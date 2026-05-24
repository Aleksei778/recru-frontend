// src/lib/vacancy-validation.ts

import { ApiError } from '@/lib/api'
import type { VacancyForm } from '@/types'

// ── Тип ошибок по полям ───────────────────────────────────────────────────────

export type VacancyFieldErrors = {
    title?: string
    description?: string
    employment_type?: string
    work_mode?: string
    salary_min?: string
    salary_max?: string
    salary_currency?: string
    experience_years?: string
    status?: string
    location?: string
    grade?: string
    education_level?: string
    skill_ids?: string
    general?: string
}

// ── Сообщения (передаются из компонента через t()) ───────────────────────────

export interface VacancyValidationMessages {
    titleRequired: string
    titleMaxLength: string
    descriptionRequired: string
    experienceRequired: string
    experienceMin: string
    gradeRequired: string
    salaryMaxMin: string
    fallback: string
}

// ── Клиентская валидация ──────────────────────────────────────────────────────

/**
 * mode='create' — проверяет все обязательные поля (title, description, experience_years, grade)
 * mode='update' — проверяет только title и кросс-поля (salary)
 */
export function validateVacancyForm(
    form: VacancyForm,
    mode: 'create' | 'update',
    msg: VacancyValidationMessages,
): VacancyFieldErrors {
    const errs: VacancyFieldErrors = {}

    // title — обязательно в обоих режимах
    if (!form.title.trim()) {
        errs.title = msg.titleRequired
    } else if (form.title.length > 255) {
        errs.title = msg.titleMaxLength
    }

    // Обязательно только при создании (StoreRequest)
    if (mode === 'create') {
        if (!form.description?.trim()) {
            errs.description = msg.descriptionRequired
        }
        if (form.experience_years === null || form.experience_years === undefined) {
            errs.experience_years = msg.experienceRequired
        } else if (Number(form.experience_years) < 0) {
            errs.experience_years = msg.experienceMin
        }
        if (!form.grade) {
            errs.grade = msg.gradeRequired
        }
    }

    // Кросс-поля: salary_max ≥ salary_min (оба режима)
    if (
        form.salary_min !== null && form.salary_min !== undefined &&
        form.salary_max !== null && form.salary_max !== undefined &&
        Number(form.salary_max) < Number(form.salary_min)
    ) {
        errs.salary_max = msg.salaryMaxMin
    }

    return errs
}

// ── Маппинг серверных ошибок (422) ────────────────────────────────────────────

const KNOWN_FIELDS = new Set([
    'title', 'description', 'employment_type', 'work_mode',
    'salary_min', 'salary_max', 'salary_currency', 'experience_years',
    'status', 'location', 'grade', 'education_level',
])

export function applyVacancyApiError(err: unknown, fallback: string): VacancyFieldErrors {
    if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        const mapped: VacancyFieldErrors = {}
        for (const [field, msgs] of Object.entries(err.fieldErrors)) {
            const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
            if (KNOWN_FIELDS.has(field)) {
                mapped[field as keyof VacancyFieldErrors] = msg
            } else if (field === 'skill_ids' || field.startsWith('skill_ids.')) {
                mapped.skill_ids = msg
            } else {
                mapped.general = mapped.general ? `${mapped.general}; ${msg}` : msg
            }
        }
        return mapped
    }
    if (err instanceof ApiError) {
        return { general: err.message }
    }
    return { general: fallback }
}

// ── Хелпер: объект сообщений из t() ──────────────────────────────────────────

export function buildVacancyMessages(
    t: (key: string) => string,
    fallbackKey: string,
): VacancyValidationMessages {
    return {
        titleRequired:       t('validation.vacancyTitleRequired'),
        titleMaxLength:      t('validation.vacancyTitleMaxLength'),
        descriptionRequired: t('validation.vacancyDescriptionRequired'),
        experienceRequired:  t('validation.vacancyExperienceRequired'),
        experienceMin:       t('validation.vacancyExperienceMin'),
        gradeRequired:       t('validation.vacancyGradeRequired'),
        salaryMaxMin:        t('validation.vacancySalaryMaxMin'),
        fallback:            t(fallbackKey),
    }
}
