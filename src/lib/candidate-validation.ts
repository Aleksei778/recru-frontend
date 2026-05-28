// src/lib/candidate-validation.ts

import { ApiError } from '@/lib/api'
import type { CandidateData } from '@/types'

// ── Nested error types ────────────────────────────────────────────────────────

export type WorkplaceFieldErrors = {
    position?: string
    company_name?: string
    started_at?: string
    description?: string
}

export type SocialFieldErrors = {
    name?: string
    url?: string
}

// ── Тип ошибок по полям ───────────────────────────────────────────────────────

export type CandidateFieldErrors = {
    first_name?: string
    last_name?: string
    middle_name?: string
    email?: string
    phone?: string
    grade?: string
    experience_years?: string
    education_level?: string
    source?: string
    locale?: string
    skill_ids?: string
    status?: string
    /** "Добавьте хотя бы одно место работы" */
    workplaces_min?: string
    /** "Добавьте хотя бы одну соцсеть" */
    socials_min?: string
    /** Ошибки вложенных полей workplace[i].field */
    workplaces?: (WorkplaceFieldErrors | undefined)[]
    /** Ошибки вложенных полей social[i].field */
    socials?: (SocialFieldErrors | undefined)[]
    general?: string
}

// ── Сообщения (передаются из компонента через t()) ────────────────────────────

export interface CandidateValidationMessages {
    firstNameRequired: string
    lastNameRequired: string
    nameMaxLength: string
    emailRequired: string
    emailInvalid: string
    gradeRequired: string
    experienceMin: string
    fallback: string
}

// ── Клиентская валидация ──────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * mode='create' — проверяет все обязательные поля
 * mode='update' — только присутствующие поля (min-validation)
 */
export function validateCandidateForm(
    form: Pick<CandidateData, 'first_name' | 'last_name' | 'email' | 'grade' | 'experience_years'>,
    mode: 'create' | 'update',
    msg: CandidateValidationMessages,
): CandidateFieldErrors {
    const errs: CandidateFieldErrors = {}

    // first_name
    if (mode === 'create') {
        if (!form.first_name.trim()) {
            errs.first_name = msg.firstNameRequired
        } else if (form.first_name.length > 255) {
            errs.first_name = msg.nameMaxLength
        }
    } else if (form.first_name.length > 255) {
        errs.first_name = msg.nameMaxLength
    }

    // last_name
    if (mode === 'create') {
        if (!form.last_name.trim()) {
            errs.last_name = msg.lastNameRequired
        } else if (form.last_name.length > 255) {
            errs.last_name = msg.nameMaxLength
        }
    } else if (form.last_name.length > 255) {
        errs.last_name = msg.nameMaxLength
    }

    // email
    if (mode === 'create') {
        if (!form.email.trim()) {
            errs.email = msg.emailRequired
        } else if (!EMAIL_RE.test(form.email)) {
            errs.email = msg.emailInvalid
        }
    } else if (form.email && !EMAIL_RE.test(form.email)) {
        errs.email = msg.emailInvalid
    }

    // grade — обязателен при создании (StoreRequest: required)
    if (mode === 'create' && !form.grade) {
        errs.grade = msg.gradeRequired
    }

    // experience_years — не может быть отрицательным
    if (Number(form.experience_years) < 0) {
        errs.experience_years = msg.experienceMin
    }

    return errs
}

// ── Known scalar fields ───────────────────────────────────────────────────────

const KNOWN_SCALAR_FIELDS = new Set([
    'first_name', 'last_name', 'middle_name', 'email', 'phone',
    'grade', 'experience_years', 'education_level', 'source', 'locale', 'status',
])

// ── Маппинг серверных ошибок (422) ────────────────────────────────────────────

export function applyCandidateApiError(err: unknown, fallback: string): CandidateFieldErrors {
    if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        const mapped: CandidateFieldErrors = {}

        for (const [field, msgs] of Object.entries(err.fieldErrors)) {
            const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)

            // workplaces.N.field или socials.N.field
            const nestedMatch = field.match(/^(workplaces|socials)\.(\d+)\.(.+)$/)
            if (nestedMatch) {
                const [, group, idxStr, subField] = nestedMatch
                const idx = parseInt(idxStr, 10)
                if (group === 'workplaces') {
                    if (!mapped.workplaces) mapped.workplaces = []
                    if (!mapped.workplaces[idx]) mapped.workplaces[idx] = {}
                    ;(mapped.workplaces[idx] as WorkplaceFieldErrors)[subField as keyof WorkplaceFieldErrors] = msg
                } else {
                    if (!mapped.socials) mapped.socials = []
                    if (!mapped.socials[idx]) mapped.socials[idx] = {}
                    ;(mapped.socials[idx] as SocialFieldErrors)[subField as keyof SocialFieldErrors] = msg
                }
                continue
            }

            // skill_ids
            if (field === 'skill_ids' || field.startsWith('skill_ids.')) {
                mapped.skill_ids = msg
                continue
            }

            // workplaces / socials — top-level ошибка массива
            if (field === 'workplaces' || field === 'socials') {
                mapped.general = mapped.general ? `${mapped.general}; ${msg}` : msg
                continue
            }

            // scalar fields
            if (KNOWN_SCALAR_FIELDS.has(field)) {
                mapped[field as keyof Omit<CandidateFieldErrors, 'workplaces' | 'socials'>] = msg
                continue
            }

            // unmapped → general
            mapped.general = mapped.general ? `${mapped.general}; ${msg}` : msg
        }

        return mapped
    }

    if (err instanceof ApiError) {
        return { general: err.message }
    }

    return { general: fallback }
}

// ── Хелпер: объект сообщений из t() (шаг 1) ─────────────────────────────────

export function buildCandidateMessages(
    t: (key: string) => string,
    fallbackKey: string,
): CandidateValidationMessages {
    return {
        firstNameRequired: t('validation.candidateFirstNameRequired'),
        lastNameRequired:  t('validation.candidateLastNameRequired'),
        nameMaxLength:     t('validation.candidateNameMaxLength'),
        emailRequired:     t('validation.emailRequired'),
        emailInvalid:      t('validation.emailInvalid'),
        gradeRequired:     t('validation.candidateGradeRequired'),
        experienceMin:     t('validation.vacancyExperienceMin'),
        fallback:          t(fallbackKey),
    }
}

// ── Шаг 2: валидация workplaces и socials ─────────────────────────────────────

export interface CandidateStep2Messages {
    workplacesMinRequired: string
    workplacePositionRequired: string
    workplaceCompanyRequired: string
    workplaceStartDateRequired: string
    socialsMinRequired: string
    socialNameRequired: string
    socialUrlRequired: string
    socialUrlInvalid: string
}

const URL_RE = /^https?:\/\/.+/

export function validateCandidateStep2(
    form: Pick<CandidateData, 'workplaces' | 'socials'>,
    msg: CandidateStep2Messages,
): CandidateFieldErrors {
    const errs: CandidateFieldErrors = {}

    // ── Workplaces ────────────────────────────────────────────────────────────
    if (form.workplaces.length === 0) {
        errs.workplaces_min = msg.workplacesMinRequired
    } else {
        const wpErrs: (WorkplaceFieldErrors | undefined)[] = []
        let hasWpErr = false
        for (let i = 0; i < form.workplaces.length; i++) {
            const w = form.workplaces[i]
            const e: WorkplaceFieldErrors = {}
            if (!w.position.trim())    e.position    = msg.workplacePositionRequired
            if (!w.company_name.trim()) e.company_name = msg.workplaceCompanyRequired
            if (!w.started_at)         e.started_at   = msg.workplaceStartDateRequired
            if (Object.keys(e).length > 0) { wpErrs[i] = e; hasWpErr = true }
        }
        if (hasWpErr) errs.workplaces = wpErrs
    }

    // ── Socials ───────────────────────────────────────────────────────────────
    if (form.socials.length === 0) {
        errs.socials_min = msg.socialsMinRequired
    } else {
        const scErrs: (SocialFieldErrors | undefined)[] = []
        let hasScErr = false
        for (let i = 0; i < form.socials.length; i++) {
            const s = form.socials[i]
            const e: SocialFieldErrors = {}
            if (!s.name.trim())   e.name = msg.socialNameRequired
            if (!s.url.trim())    e.url  = msg.socialUrlRequired
            else if (!URL_RE.test(s.url)) e.url = msg.socialUrlInvalid
            if (Object.keys(e).length > 0) { scErrs[i] = e; hasScErr = true }
        }
        if (hasScErr) errs.socials = scErrs
    }

    return errs
}

export function buildCandidateStep2Messages(t: (key: string) => string): CandidateStep2Messages {
    return {
        workplacesMinRequired:     t('validation.candidateWorkplacesMinRequired'),
        workplacePositionRequired: t('validation.candidateWorkplacePositionRequired'),
        workplaceCompanyRequired:  t('validation.candidateWorkplaceCompanyRequired'),
        workplaceStartDateRequired: t('validation.candidateWorkplaceStartDateRequired'),
        socialsMinRequired:        t('validation.candidateSocialsMinRequired'),
        socialNameRequired:        t('validation.candidateSocialNameRequired'),
        socialUrlRequired:         t('validation.candidateSocialUrlRequired'),
        socialUrlInvalid:          t('validation.candidateSocialUrlInvalid'),
    }
}
