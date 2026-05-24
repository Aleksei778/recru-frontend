// src/app/[lang]/(dashboard)/vacancies/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/useTranslation'
import { vacancies as vApi, ApiError } from '@/lib/api'
import type {
    Vacancy, VacancyForm,
    VacancyEmploymentType, VacancyWorkMode, VacancyStatus,
    CandidateGrade, CandidateEducationLevel,
} from '@/types'
import { ChevronLeftIcon, PencilIcon, MapPinIcon } from 'lucide-react'
import SkillsInput from '@/components/skills/SkillsInput'

const EMPTY_FORM: VacancyForm = {
    title: '',
    description: null,
    employment_type: 'full_time',
    work_mode: 'office',
    salary_min: null,
    salary_max: null,
    salary_currency: 'RUB',
    experience_years: null,
    status: 'draft',
    location: null,
    grade: null,
    education_level: null,
    skills: [],
}

const statusColors: Record<VacancyStatus, string> = {
    draft: 'border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400',
    published: 'border-black dark:border-white text-black dark:text-white',
    closed: 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500',
}

const inputClass = `
    w-full px-5 py-3 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

const selectClass = `
    w-full px-5 py-3 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white text-sm appearance-none
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

export default function VacancyDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()
    const router = useRouter()

    const [vacancy, setVacancy] = useState<Vacancy | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<VacancyForm>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) return
        vApi.get(Number(id), token)
            .then(vacancy => {
                setVacancy(vacancy)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
                setNotFound(true)
            })
    }, [id, token])

    const startEditing = () => {
        if (!vacancy) return
        setForm({
            title: vacancy.title,
            description: vacancy.description,
            employment_type: vacancy.employment_type,
            work_mode: vacancy.work_mode,
            salary_min: vacancy.salary_min,
            salary_max: vacancy.salary_max,
            salary_currency: vacancy.salary_currency,
            experience_years: vacancy.experience_years,
            status: vacancy.status,
            location: vacancy.location,
            grade: vacancy.grade,
            education_level: vacancy.education_level,
            skills: [...(vacancy.skills ?? [])],
        })
        setError(null)
        setEditing(true)
    }

    const cancelEditing = () => {
        setEditing(false)
        setError(null)
    }

    const handleBack = () => {
        if (editing && !window.confirm(t('dashboard.vacancies.unsavedChanges'))) return
        router.push(`/${language}/vacancies`)
    }

    const handleSave = async () => {
        if (!token || !vacancy || !form.title.trim()) return
        setSaving(true)
        setError(null)
        try {
            const skill_ids = form.skills.map(s => s.id)
            const updated = await vApi.update(vacancy.id, form, skill_ids, token)
            setVacancy(updated)
            setEditing(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('dashboard.vacancies.detail.error'))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-black dark:hover:text-white transition mb-6"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        {t('dashboard.vacancies.detail.back')}
                    </button>
                    <p className="text-sm text-gray-400">{t('dashboard.vacancies.detail.notFound')}</p>
                </div>
            </div>
        )
    }

    const v = vacancy!

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-black dark:hover:text-white transition mb-6"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('dashboard.vacancies.detail.back')}
                </button>

                {/* Header */}
                <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">{v.title}</h1>
                        {v.location && !editing && (
                            <p className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                {v.location}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!editing ? (
                            <>
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[v.status]}`}>
                                    {t(`dashboard.vacancies.status.${v.status}`)}
                                </span>
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                               border border-black dark:border-white rounded-full
                                               text-black dark:text-white hover:bg-black hover:text-white
                                               dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    {t('dashboard.vacancies.detail.edit')}
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
                                    {t('dashboard.vacancies.detail.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.title.trim()}
                                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                               bg-black dark:bg-white text-white dark:text-black
                                               rounded-full disabled:opacity-40 disabled:cursor-not-allowed
                                               transition-all duration-200"
                                >
                                    {saving ? t('dashboard.vacancies.saving') : t('dashboard.vacancies.detail.saveChanges')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Card 1 — About vacancy */}
                <div className="rounded-3xl border border-black dark:border-white p-6 mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                        {t('dashboard.vacancies.detail.mainInfo')}
                    </h2>
                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.title')}
                                </label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder={t('dashboard.vacancies.modal.titlePlaceholder')}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.description')}
                                </label>
                                <textarea
                                    value={form.description ?? ''}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                                    placeholder={t('dashboard.vacancies.modal.descriptionPlaceholder')}
                                    rows={5}
                                    className="w-full px-5 py-3 bg-white dark:bg-black
                                               border border-gray-300 dark:border-gray-700 rounded-2xl
                                               text-gray-900 dark:text-white placeholder-gray-400 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                                               focus:border-transparent transition resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.location')}
                                </label>
                                <input
                                    value={form.location ?? ''}
                                    onChange={e => setForm(f => ({ ...f, location: e.target.value || null }))}
                                    placeholder={t('dashboard.vacancies.modal.locationPlaceholder')}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            {v.description ? (
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {v.description}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">{t('dashboard.vacancies.detail.notSpecified')}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 2 — Conditions */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                        {t('dashboard.vacancies.detail.conditions')}
                    </h2>
                    {editing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.vacancies.modal.employmentType')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.employment_type}
                                            onChange={e => setForm(f => ({ ...f, employment_type: e.target.value as VacancyEmploymentType }))}
                                            className={selectClass}
                                        >
                                            {(['full_time', 'part_time', 'contract', 'internship'] as VacancyEmploymentType[]).map(val => (
                                                <option key={val} value={val}>{t(`dashboard.vacancies.employment.${val}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.vacancies.modal.workMode')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.work_mode}
                                            onChange={e => setForm(f => ({ ...f, work_mode: e.target.value as VacancyWorkMode }))}
                                            className={selectClass}
                                        >
                                            {(['office', 'remote', 'hybrid'] as VacancyWorkMode[]).map(val => (
                                                <option key={val} value={val}>{t(`dashboard.vacancies.workMode.${val}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.vacancies.modal.status')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.status}
                                            onChange={e => setForm(f => ({ ...f, status: e.target.value as VacancyStatus }))}
                                            className={selectClass}
                                        >
                                            {(['draft', 'published', 'closed'] as VacancyStatus[]).map(val => (
                                                <option key={val} value={val}>{t(`dashboard.vacancies.status.${val}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        {t('dashboard.vacancies.modal.experienceYears')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.experience_years ?? ''}
                                        onChange={e => setForm(f => ({ ...f, experience_years: e.target.value ? +e.target.value : null }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.grade')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.grade ?? ''}
                                        onChange={e => setForm(f => ({ ...f, grade: (e.target.value || null) as CandidateGrade | null }))}
                                        className={selectClass}
                                    >
                                        <option value="">{t('dashboard.vacancies.modal.gradePlaceholder')}</option>
                                        {(['junior', 'middle', 'senior', 'lead'] as CandidateGrade[]).map(g => (
                                            <option key={g} value={g}>{t(`dashboard.vacancies.grade.${g}`)}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.educationLevel')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={form.education_level ?? ''}
                                        onChange={e => setForm(f => ({ ...f, education_level: (e.target.value || null) as CandidateEducationLevel | null }))}
                                        className={selectClass}
                                    >
                                        <option value="">{t('dashboard.vacancies.modal.educationLevelPlaceholder')}</option>
                                        {(['secondary', 'incomplete_higher', 'bachelor', 'master', 'specialist', 'doctor'] as CandidateEducationLevel[]).map(level => (
                                            <option key={level} value={level}>{t(`dashboard.vacancies.educationLevel.${level}`)}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.employmentType')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {t(`dashboard.vacancies.employment.${v.employment_type}`)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.workMode')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {t(`dashboard.vacancies.workMode.${v.work_mode}`)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.experienceYears')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {v.experience_years !== null
                                        ? t('dashboard.vacancies.experience', { years: v.experience_years })
                                        : t('dashboard.vacancies.detail.notSpecified')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.grade')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {v.grade
                                        ? t(`dashboard.vacancies.grade.${v.grade}`)
                                        : t('dashboard.vacancies.detail.notSpecified')}
                                </p>
                            </div>
                            {v.education_level && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.educationLevel')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {t(`dashboard.vacancies.educationLevel.${v.education_level}`)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.modal.status')}</p>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusColors[v.status]}`}>
                                    {t(`dashboard.vacancies.status.${v.status}`)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card 3 — Salary */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-3">
                        {t('dashboard.vacancies.modal.salaryMin')} / {t('dashboard.vacancies.modal.salaryMax')}
                    </h2>
                    {editing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                type="number"
                                min={0}
                                value={form.salary_min ?? ''}
                                onChange={e => setForm(f => ({ ...f, salary_min: e.target.value ? +e.target.value : null }))}
                                placeholder={t('dashboard.vacancies.modal.salaryMin')}
                                className={inputClass}
                            />
                            <input
                                type="number"
                                min={0}
                                value={form.salary_max ?? ''}
                                onChange={e => setForm(f => ({ ...f, salary_max: e.target.value ? +e.target.value : null }))}
                                placeholder={t('dashboard.vacancies.modal.salaryMax')}
                                className={inputClass}
                            />
                            <input
                                value={form.salary_currency ?? ''}
                                onChange={e => setForm(f => ({ ...f, salary_currency: e.target.value || null }))}
                                placeholder={t('dashboard.vacancies.modal.salaryCurrency')}
                                className={inputClass}
                            />
                        </div>
                    ) : (
                        (v.salary_min !== null || v.salary_max !== null) ? (
                            <p className="text-lg font-semibold text-black dark:text-white">
                                {v.salary_min ?? 0} — {v.salary_max ?? '∞'} {v.salary_currency ?? 'RUB'}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400">{t('dashboard.vacancies.detail.notSpecified')}</p>
                        )
                    )}
                </div>

                {/* Card 4 — Skills */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-3">
                        {t('dashboard.vacancies.detail.skills')}
                    </h2>
                    {editing ? (
                        <SkillsInput
                            value={form.skills}
                            onChange={skills => setForm(f => ({ ...f, skills }))}
                        />
                    ) : (v.skills ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(v.skills ?? []).map(s => (
                                <span
                                    key={s.slug}
                                    className="text-xs border border-gray-200 dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full"
                                >
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">{t('dashboard.vacancies.detail.noSkills')}</p>
                    )}
                </div>

                {/* Card 5 — Metadata (view only) */}
                {!editing && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                            {t('dashboard.vacancies.detail.metadata')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.detail.createdAt')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {new Date(v.created_at).toLocaleDateString(language)}
                                </p>
                            </div>
                            {v.published_at && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.detail.publishedAt')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {new Date(v.published_at).toLocaleDateString(language)}
                                    </p>
                                </div>
                            )}
                            {v.closed_at && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.vacancies.detail.closedAt')}</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {new Date(v.closed_at).toLocaleDateString(language)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Save error */}
                {editing && error && (
                    <p className="text-red-500 text-xs text-center mt-2">{error}</p>
                )}

            </div>
        </div>
    )
}
