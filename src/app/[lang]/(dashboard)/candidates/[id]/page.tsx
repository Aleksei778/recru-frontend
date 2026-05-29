// src/app/[lang]/(dashboard)/candidates/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/useTranslation'
import { candidates as cApi, interviews as iApi, vacancies as vApi } from '@/lib/api'
import type { Candidate, CandidateData, CandidateEducationLevel, Locale, Vacancy } from '@/types'
import {
    type CandidateFieldErrors,
    validateCandidateForm,
    applyCandidateApiError,
    buildCandidateMessages,
} from '@/lib/candidate-validation'
import { ChevronLeftIcon, LinkIcon, CheckIcon, XIcon, PencilIcon } from 'lucide-react'
import SkillsInput from '@/components/skills/SkillsInput'

const inputCls = (err?: string) =>
    `w-full px-5 py-3 bg-white dark:bg-black
    border ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 dark:border-gray-700 focus:ring-black dark:focus:ring-white'}
    rounded-full text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:border-transparent transition`

const selectCls = (err?: string) =>
    `w-full px-5 py-3 bg-white dark:bg-black
    border ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 dark:border-gray-700 focus:ring-black dark:focus:ring-white'}
    rounded-full text-gray-900 dark:text-white text-sm appearance-none
    focus:outline-none focus:ring-2 focus:border-transparent transition`

function candidateToForm(c: Candidate): CandidateData {
    return {
        first_name:      c.first_name,
        last_name:       c.last_name,
        middle_name:     c.middle_name,
        email:           c.email ?? '',
        phone:           c.phone ?? '',
        source:          c.source ?? 'hh',
        grade:           c.grade,
        experience_years: c.experience_years,
        education_level: c.education_level ?? 'bachelor',
        locale:          c.locale ?? 'ru',
        workplaces:      c.workplaces ?? [],
        socials:         c.socials ?? [],
        skills:          c.skills ?? [],
    }
}

export default function CandidateDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()
    const router = useRouter()

    const [candidate, setCandidate] = useState<Candidate | null>(null)
    const [loading, setLoading] = useState(true)

    // ── Edit-режим ────────────────────────────────────────────────────────────
    const [editing, setEditing]       = useState(false)
    const [form, setForm]             = useState<CandidateData | null>(null)
    const [saving, setSaving]         = useState(false)
    const [fieldErrors, setFieldErrors] = useState<CandidateFieldErrors>({})

    // ── Interview modal ───────────────────────────────────────────────────────
    const [linkModal, setLinkModal]           = useState(false)
    const [allVacancies, setAllVacancies]     = useState<Vacancy[]>([])
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
    const [questionsNumber, setQuestionsNumber] = useState<number | ''>('')
    const [generatedLink, setGeneratedLink]   = useState('')
    const [copied, setCopied]                 = useState(false)

    useEffect(() => {
        if (!token) return
        Promise.all([
            cApi.get(Number(id), token),
            vApi.list(token),
        ]).then(([c, v]) => {
            setCandidate(c)
            setAllVacancies(v.data)
            setLoading(false)
        })
    }, [id, token])

    // ── Edit helpers ──────────────────────────────────────────────────────────

    const startEditing = () => {
        if (!candidate) return
        setForm(candidateToForm(candidate))
        setFieldErrors({})
        setEditing(true)
    }

    const cancelEditing = () => {
        setEditing(false)
        setForm(null)
        setFieldErrors({})
    }

    const updateField = <K extends keyof CandidateData>(key: K, value: CandidateData[K]) => {
        setForm(f => f ? { ...f, [key]: value } : f)
        if (fieldErrors[key as keyof CandidateFieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [key]: undefined }))
        }
    }

    const handleBack = () => {
        if (editing && !window.confirm(t('dashboard.candidates.detail.unsavedChanges'))) return
        router.push(`/${language}/candidates`)
    }

    const handleSave = async () => {
        if (!token || !candidate || !form) return

        const msgs = buildCandidateMessages(t, 'dashboard.candidates.detail.saveError')
        const errs = validateCandidateForm(form, 'update', msgs)

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }

        setSaving(true)
        setFieldErrors({})
        try {
            const skill_ids = form.skills.map(s => s.id)
            const updated = await cApi.update(candidate.id, form, skill_ids, token)
            setCandidate(updated)
            setEditing(false)
            setForm(null)
        } catch (err) {
            setFieldErrors(applyCandidateApiError(err, t('dashboard.candidates.detail.saveError')))
        } finally {
            setSaving(false)
        }
    }

    // ── Interview helpers ──────────────────────────────────────────────────────

    const createInterview = async () => {
        if (!token || !candidate || !selectedVacancy) return
        const result = await iApi.create({
            vacancy_id: selectedVacancy.id,
            candidate_id: candidate.id,
            questions_number: questionsNumber === '' ? 5 : questionsNumber,
        }, token)
        setGeneratedLink(result.link)
    }

    const closeModal = () => {
        setLinkModal(false)
        setGeneratedLink('')
        setSelectedVacancy(null)
    }

    const copyLink = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(generatedLink)
            } else {
                const input = document.createElement('input')
                input.value = generatedLink
                input.style.position = 'fixed'
                input.style.opacity  = '0'
                document.body.appendChild(input)
                input.focus()
                input.select()
                document.execCommand('copy')
                document.body.removeChild(input)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading || !candidate) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    const c = candidate

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-black dark:hover:text-white transition mb-6"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('dashboard.candidates.detail.back')}
                </button>

                {/* Header */}
                <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {c.last_name} {c.first_name}
                            {c.middle_name && (
                                <span className="text-gray-400 font-normal text-xl ml-2">{c.middle_name}</span>
                            )}
                        </h1>
                        {(c.grade || c.experience_years > 0) && (
                            <p className="text-sm text-gray-400 mt-1">
                                {c.grade && t(`dashboard.vacancies.grade.${c.grade}`)}
                                {c.grade && c.experience_years > 0 && ' · '}
                                {c.experience_years > 0 && t('dashboard.candidates.detail.yearsExp', { years: c.experience_years })}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {c.status && !editing && (
                            <span className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500 px-3 py-1.5 rounded-full">
                                {t(`dashboard.candidates.detail.status.${c.status}`)}
                            </span>
                        )}
                        {!editing ? (
                            <>
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                               border border-black dark:border-white rounded-full
                                               text-black dark:text-white hover:bg-black hover:text-white
                                               dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    {t('dashboard.candidates.detail.editButton')}
                                </button>
                                <button
                                    onClick={() => { setLinkModal(true); setGeneratedLink(''); setSelectedVacancy(null) }}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                            border border-black dark:border-white rounded-full
                                            text-black dark:text-white hover:bg-black hover:text-white
                                            dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    {t('dashboard.candidates.interviewButton')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={cancelEditing}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                               border border-gray-300 dark:border-gray-700 rounded-full
                                               text-gray-500 hover:border-black hover:text-black
                                               dark:hover:border-white dark:hover:text-white transition-all duration-200"
                                >
                                    {t('dashboard.candidates.detail.cancelEdit')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                               bg-black dark:bg-white text-white dark:text-black
                                               rounded-full disabled:opacity-40 disabled:cursor-not-allowed
                                               transition-all duration-200"
                                >
                                    {saving
                                        ? t('dashboard.candidates.modal.saving')
                                        : t('dashboard.candidates.detail.saveChanges')
                                    }
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Card 1: Contacts ───────────────────────────────────────── */}
                <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                        {t('dashboard.candidates.detail.contacts')}
                    </h2>

                    {editing && form ? (
                        <div className="space-y-4">
                            {/* Last + First name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.candidates.modal.lastName')}
                                    </label>
                                    <input
                                        value={form.last_name}
                                        onChange={e => updateField('last_name', e.target.value)}
                                        className={inputCls(fieldErrors.last_name)}
                                    />
                                    {fieldErrors.last_name && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.last_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.candidates.modal.firstName')}
                                    </label>
                                    <input
                                        value={form.first_name}
                                        onChange={e => updateField('first_name', e.target.value)}
                                        className={inputCls(fieldErrors.first_name)}
                                    />
                                    {fieldErrors.first_name && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.first_name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Middle name */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.candidates.modal.middleName')}
                                </label>
                                <input
                                    value={form.middle_name ?? ''}
                                    onChange={e => updateField('middle_name', e.target.value || null)}
                                    className={inputCls(fieldErrors.middle_name)}
                                />
                                {fieldErrors.middle_name && (
                                    <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.middle_name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.candidates.modal.email')}
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => updateField('email', e.target.value)}
                                    className={inputCls(fieldErrors.email)}
                                />
                                {fieldErrors.email && (
                                    <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.candidates.modal.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone ?? ''}
                                    onChange={e => updateField('phone', e.target.value)}
                                    className={inputCls(fieldErrors.phone)}
                                />
                                {fieldErrors.phone && (
                                    <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.phone}</p>
                                )}
                            </div>

                            {/* Locale */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.candidates.detail.localeLabel')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.locale}
                                        onChange={e => updateField('locale', e.target.value as Locale)}
                                        className={selectCls(fieldErrors.locale)}
                                    >
                                        {(['ru', 'en'] as Locale[]).map(v => (
                                            <option key={v} value={v}>{t(`dashboard.candidates.modal.locale.${v}`)}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                                {fieldErrors.locale && (
                                    <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.locale}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {c.email && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.modal.email')}</p>
                                    <p className="text-sm text-black dark:text-white">{c.email}</p>
                                </div>
                            )}
                            {c.phone && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.modal.phone')}</p>
                                    <p className="text-sm text-black dark:text-white">{c.phone}</p>
                                </div>
                            )}
                            {c.education_level && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.education')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {t(`dashboard.vacancies.educationLevel.${c.education_level}`)}
                                    </p>
                                </div>
                            )}
                            {c.source && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.source')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {t(`dashboard.candidates.detail.sources.${c.source}`)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Socials — всегда view-only (не в UpdateRequest) */}
                    {!editing && (c.socials ?? []).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900">
                            <div className="flex flex-wrap gap-2">
                                {c.socials!.map((s, i) => (
                                    <a
                                        key={i}
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500
                                                px-3 py-1.5 rounded-full hover:border-black dark:hover:border-white
                                                hover:text-black dark:hover:text-white transition"
                                    >
                                        {s.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Card 2: Professional info ──────────────────────────────── */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                        {t('dashboard.candidates.detail.professionalInfo')}
                    </h2>

                    {editing && form ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Experience */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.candidates.detail.experienceLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={form.experience_years}
                                        onChange={e => updateField('experience_years', +e.target.value)}
                                        className={inputCls(fieldErrors.experience_years)}
                                    />
                                    {fieldErrors.experience_years && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.experience_years}</p>
                                    )}
                                </div>

                                {/* Education */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.candidates.detail.education')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.education_level}
                                            onChange={e => updateField('education_level', e.target.value as CandidateEducationLevel)}
                                            className={selectCls(fieldErrors.education_level)}
                                        >
                                            {(['secondary', 'incomplete_higher', 'bachelor', 'master', 'specialist', 'doctor'] as CandidateEducationLevel[]).map(v => (
                                                <option key={v} value={v}>{t(`dashboard.vacancies.educationLevel.${v}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                    {fieldErrors.education_level && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.education_level}</p>
                                    )}
                                </div>
                            </div>

                            {/* Status — read-only in edit mode (not in CandidateData / UpdateRequest is handled server-side) */}
                            {c.status && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.candidates.detail.statusLabel')}
                                    </label>
                                    <span className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500 px-3 py-1.5 rounded-full inline-block">
                                        {t(`dashboard.candidates.detail.status.${c.status}`)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {c.grade && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.modal.grade')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {t(`dashboard.vacancies.grade.${c.grade}`)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.experienceLabel')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {c.experience_years > 0
                                        ? t('dashboard.candidates.detail.yearsExp', { years: c.experience_years })
                                        : t('dashboard.candidates.detail.notSpecified')}
                                </p>
                            </div>
                            {c.education_level && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.education')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {t(`dashboard.vacancies.educationLevel.${c.education_level}`)}
                                    </p>
                                </div>
                            )}
                            {c.status && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.statusLabel')}</p>
                                    <span className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500 px-2.5 py-0.5 rounded-full">
                                        {t(`dashboard.candidates.detail.status.${c.status}`)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Card 3: Skills ─────────────────────────────────────────── */}
                {(editing || (c.skills ?? []).length > 0) && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-3">
                            {t('dashboard.candidates.detail.skills')}
                        </h2>
                        {editing && form ? (
                            <>
                                <SkillsInput
                                    value={form.skills}
                                    onChangeAction={skills => {
                                        setForm(f => f ? { ...f, skills } : f)
                                        if (fieldErrors.skill_ids) setFieldErrors(prev => ({ ...prev, skill_ids: undefined }))
                                    }}
                                />
                                {fieldErrors.skill_ids && (
                                    <p className="text-red-500 text-xs mt-2">{fieldErrors.skill_ids}</p>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {c.skills!.map(s => (
                                    <span key={s.slug} className="text-xs border border-gray-200 dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Card 4: Work Experience (view only) ────────────────────── */}
                {(c.workplaces ?? []).length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                            {t('dashboard.candidates.detail.workExperience')}
                        </h2>
                        <div className="space-y-4">
                            {c.workplaces!.map((w, i) => (
                                <div
                                    key={i}
                                    className={i !== c.workplaces!.length - 1
                                        ? 'pb-4 border-b border-gray-100 dark:border-gray-900'
                                        : ''}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-black dark:text-white">{w.position}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{w.company_name}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0">
                                            {w.started_at.slice(0, 10)} — {w.ended_at ? w.ended_at.slice(0, 10) : t('dashboard.candidates.detail.present')}
                                        </p>
                                    </div>
                                    {w.description && (
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{w.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Card 5: Interviews ─────────────────────────────────────── */}
                {(c.interviews ?? []).length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                            {t('dashboard.candidates.detail.interviews')}
                        </h2>
                        <div className="space-y-3">
                            {c.interviews!.map(iv => (
                                <Link
                                    key={iv.id}
                                    href={`/${language}/interviews/${iv.id}`}
                                    className="flex items-center justify-between gap-3 hover:opacity-70 transition"
                                >
                                    <div>
                                        <p className="text-sm text-black dark:text-white">{iv.vacancy?.title ?? '—'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(iv.created_at).toLocaleDateString(language)}
                                        </p>
                                    </div>
                                    <span className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500 px-3 py-1.5 rounded-full shrink-0">
                                        {t(`dashboard.interviews.status.${iv.status}`)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── General / unmapped server error ───────────────────────── */}
                {editing && fieldErrors.general && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 mt-4">
                        <p className="text-red-600 text-xs text-center">{fieldErrors.general}</p>
                    </div>
                )}

            </div>

            {/* ── Interview creation modal ──────────────────────────────────── */}
            {linkModal && c && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">{t('dashboard.candidates.interview.title')}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-7">
                            {c.last_name} {c.first_name}
                        </p>

                        {!generatedLink ? (
                            <>
                                <div className="relative mb-7">
                                    <select
                                        value={selectedVacancy?.id ?? ''}
                                        onChange={e => setSelectedVacancy(allVacancies.find(v => v.id === +e.target.value) ?? null)}
                                        className={selectCls()}
                                    >
                                        <option value="">{t('dashboard.candidates.interview.selectVacancy')}</option>
                                        {allVacancies
                                            .filter(v => v.status === 'published')
                                            .map(v => <option key={v.id} value={v.id}>{v.title}</option>)
                                        }
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>

                                <div className="relative mb-7">
                                    <input
                                        type="number"
                                        id="questionsNumber"
                                        name="questionsNumber"
                                        onInput={(e) => setQuestionsNumber(Number(e.currentTarget.value))}
                                        min={5}
                                        value={questionsNumber ?? ''}
                                        className={selectCls()}
                                        placeholder={t('dashboard.candidates.interview.questionsNumber')}
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={createInterview}
                                        disabled={!selectedVacancy}
                                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                                   font-medium rounded-full disabled:opacity-40 transition-all text-sm"
                                    >
                                        {t('dashboard.candidates.interview.generate')}
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                               text-gray-500 rounded-full text-sm hover:border-black
                                               hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                                    >
                                        {t('dashboard.candidates.interview.cancel')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-400 mb-4">{t('dashboard.candidates.interview.linkReady')}</p>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1 px-4 py-3 text-xs bg-gray-50 dark:bg-gray-950 rounded-full
                                                border border-gray-200 dark:border-gray-800 text-gray-600 focus:outline-none"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-medium
                                               bg-black dark:bg-white text-white dark:text-black transition-all"
                                    >
                                        {copied
                                            ? <><CheckIcon className="w-3.5 h-3.5" /> {t('dashboard.candidates.interview.copied')}</>
                                            : <><LinkIcon className="w-3.5 h-3.5" /> {t('dashboard.candidates.interview.copy')}</>
                                        }
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-7">{t('dashboard.candidates.interview.validity')}</p>
                                <button
                                    onClick={closeModal}
                                    className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                                >
                                    {t('dashboard.candidates.interview.close')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
