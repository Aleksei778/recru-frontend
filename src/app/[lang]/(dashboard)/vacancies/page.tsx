'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { vacancies as vApi, ApiError } from '@/lib/api'
import type { Vacancy, VacancyForm, VacancyEmploymentType, VacancyWorkMode, VacancyStatus, CandidateGrade, CandidateEducationLevel } from '@/types'
import { PlusIcon, MapPinIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import SkillsInput from '@/components/skills/SkillsInput'
import { SearchInput } from '@/components/filters/SearchInput'
import { SelectFilter } from '@/components/filters/SelectFilter'
import { SortControl } from '@/components/filters/SortControl'
import { ActiveFilters } from '@/components/filters/ActiveFilters'
import { Pagination } from '@/components/ui/Pagination'

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
    skills: []
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

const FILTER_DEFAULTS = {
    search: '',
    status: '',
    employment_type: '',
    work_mode: '',
    grade: '',
    sort: '',
    order: '',
    page: 1,
}

const VACANCY_SORT_OPTIONS = [
    { value: 'created_at', labelKey: 'dashboard.filters.vacancies.sort_created' },
    { value: 'title',      labelKey: 'dashboard.filters.vacancies.sort_title' },
    { value: 'salary_min', labelKey: 'dashboard.filters.vacancies.sort_salary' },
    { value: 'status',     labelKey: 'dashboard.filters.vacancies.sort_status' },
]

function VacanciesPageContent() {
    const { token, tenant } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()

    const { filters, setFilter, setFilters, resetFilters } = useUrlFilters(FILTER_DEFAULTS)

    const [items, setItems] = useState<Vacancy[]>([])
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Vacancy | null>(null)
    const [form, setForm] = useState<VacancyForm>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Vacancy | null>(null)
    const [deleting, setDeleting] = useState(false)

    const reqId = useRef(0)

    useEffect(() => {
        if (!token) return
        const id = ++reqId.current
        setLoading(true)
        vApi.list(token, filters).then(r => {
            if (reqId.current !== id) return
            setItems(r.data)
            setMeta({ current_page: r.current_page, last_page: r.last_page, total: r.total })
            setLoading(false)
        }).catch(() => {
            if (reqId.current === id) setLoading(false)
        })
    }, [token, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

    const openCreate = () => {
        setEditing(null)
        setForm(EMPTY_FORM)
        setModalOpen(true)
    }

    const openEdit = (v: Vacancy) => {
        setEditing(v)
        setForm({
            title: v.title,
            description: v.description,
            employment_type: v.employment_type,
            work_mode: v.work_mode,
            salary_min: v.salary_min,
            salary_max: v.salary_max,
            salary_currency: v.salary_currency,
            experience_years: v.experience_years,
            status: v.status,
            location: v.location,
            grade: v.grade,
            education_level: v.education_level,
            skills: [...v.skills],
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditing(null)
        setForm(EMPTY_FORM)
        setSaveError(null)
    }

    const handleSave = async () => {
        if (!token || !form.title.trim()) return
        setSaving(true)
        setSaveError(null)
        try {
            const skill_ids: number[] = form.skills.map(skill => skill.id)
            if (editing) {
                const updated = await vApi.update(editing.id, form, skill_ids, token)
                setItems(prev => prev.map(v => v.id === updated.id ? updated : v))
            } else {
                const created = await vApi.create(form, skill_ids, token)
                setItems(prev => [created, ...prev])
                setMeta(m => ({ ...m, total: m.total + 1 }))
            }
            closeModal()
        } catch (err) {
            setSaveError(err instanceof ApiError ? err.message : t('dashboard.vacancies.modal.saveError'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!token || !deleteTarget) return
        setDeleting(true)
        try {
            await vApi.delete(deleteTarget.id, token)
            setItems(prev => {
                const next = prev.filter(v => v.id !== deleteTarget.id)
                if (next.length === 0 && Number(filters.page) > 1) {
                    setFilter('page', Number(filters.page) - 1)
                }
                return next
            })
            setMeta(m => ({ ...m, total: Math.max(0, m.total - 1) }))
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const handleSortChange = (field: string) => {
        if (field) {
            setFilters({ sort: field, order: filters.order || 'desc' })
        } else {
            setFilters({ sort: '', order: '' })
        }
    }

    const handleOrderToggle = () => {
        setFilter('order', filters.order === 'asc' ? 'desc' : 'asc')
    }

    const activeChips = [
        filters.search          ? { key: 'search',          label: `"${filters.search}"` } : null,
        filters.status          ? { key: 'status',          label: t(`dashboard.vacancies.status.${filters.status}`) } : null,
        filters.employment_type ? { key: 'employment_type', label: t(`dashboard.vacancies.employment.${filters.employment_type}`) } : null,
        filters.work_mode       ? { key: 'work_mode',       label: t(`dashboard.vacancies.workMode.${filters.work_mode}`) } : null,
        filters.grade           ? { key: 'grade',           label: t(`dashboard.vacancies.grade.${filters.grade}`) } : null,
    ].filter((c): c is { key: string; label: string } => c !== null)

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        {t('dashboard.vacancies.heading')}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {t('dashboard.vacancies.total', { count: meta.total })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('dashboard.vacancies.create')}</span>
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchInput
                    value={filters.search}
                    onChange={v => setFilter('search', v)}
                    placeholder={t('dashboard.filters.vacancies.search_placeholder')}
                />
                <SelectFilter
                    value={filters.status}
                    onChange={v => setFilter('status', v)}
                    placeholder={t('dashboard.filters.vacancies.filter_status')}
                    options={[
                        { value: 'draft',     label: t('dashboard.vacancies.status.draft') },
                        { value: 'published', label: t('dashboard.vacancies.status.published') },
                        { value: 'closed',    label: t('dashboard.vacancies.status.closed') },
                    ]}
                />
                <SelectFilter
                    value={filters.employment_type}
                    onChange={v => setFilter('employment_type', v)}
                    placeholder={t('dashboard.filters.vacancies.filter_employment_type')}
                    options={[
                        { value: 'full_time',  label: t('dashboard.vacancies.employment.full_time') },
                        { value: 'part_time',  label: t('dashboard.vacancies.employment.part_time') },
                        { value: 'contract',   label: t('dashboard.vacancies.employment.contract') },
                        { value: 'internship', label: t('dashboard.vacancies.employment.internship') },
                    ]}
                />
                <SelectFilter
                    value={filters.work_mode}
                    onChange={v => setFilter('work_mode', v)}
                    placeholder={t('dashboard.filters.vacancies.filter_work_mode')}
                    options={[
                        { value: 'office', label: t('dashboard.vacancies.workMode.office') },
                        { value: 'remote', label: t('dashboard.vacancies.workMode.remote') },
                        { value: 'hybrid', label: t('dashboard.vacancies.workMode.hybrid') },
                    ]}
                />
                <SelectFilter
                    value={filters.grade}
                    onChange={v => setFilter('grade', v)}
                    placeholder={t('dashboard.filters.vacancies.filter_grade')}
                    options={[
                        { value: 'junior', label: t('dashboard.vacancies.grade.junior') },
                        { value: 'middle', label: t('dashboard.vacancies.grade.middle') },
                        { value: 'senior', label: t('dashboard.vacancies.grade.senior') },
                        { value: 'lead',   label: t('dashboard.vacancies.grade.lead') },
                    ]}
                />
                <SortControl
                    sort={filters.sort}
                    order={filters.order}
                    label={t('dashboard.filters.sort_by')}
                    options={VACANCY_SORT_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                    onSortChange={handleSortChange}
                    onOrderToggle={handleOrderToggle}
                />
            </div>

            <ActiveFilters
                chips={activeChips}
                clearLabel={t('dashboard.filters.clear_all')}
                onRemove={key => setFilter(key as keyof typeof FILTER_DEFAULTS, '')}
                onClearAll={resetFilters}
            />

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">{t('dashboard.vacancies.empty')}</p>
                    {activeChips.length === 0 && (
                        <button
                            onClick={openCreate}
                            className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                        >
                            {t('dashboard.vacancies.createFirst')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="rounded-3xl border border-black dark:border-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-black dark:border-white">
                                        {[
                                            t('dashboard.vacancies.tableHeaders.vacancy'),
                                            t('dashboard.vacancies.tableHeaders.company'),
                                            t('dashboard.vacancies.tableHeaders.location'),
                                            t('dashboard.vacancies.tableHeaders.salary'),
                                            t('dashboard.vacancies.tableHeaders.skills'),
                                            t('dashboard.vacancies.tableHeaders.experience'),
                                            t('dashboard.vacancies.tableHeaders.status'),
                                            '',
                                        ].map((h, i) => (
                                            <th key={i} className="text-left px-6 py-4 text-xs font-semibold
                                                    text-black dark:text-white uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((v, idx) => (
                                        <tr key={v.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-950
                                                ${idx !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}>
                                            {/* Title */}
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/${language}/vacancies/${v.id}`}
                                                    className="font-semibold text-black dark:text-white hover:opacity-70 transition"
                                                >
                                                    {v.title}
                                                </Link>
                                            </td>
                                            {/* Company */}
                                            <td className="px-6 py-4">
                                                <p className="text-gray-500 dark:text-gray-400">{tenant?.name ?? 'NDA Company'}</p>
                                            </td>
                                            {/* Location */}
                                            <td className="px-6 py-4">
                                                {v.location ? (
                                                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                        <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {v.location}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            {/* Salary */}
                                            <td className="px-6 py-4">
                                                {(v.salary_min !== null || v.salary_max !== null) ? (
                                                    <p className="font-semibold text-black dark:text-white whitespace-nowrap">
                                                        {v.salary_min ?? 0} — {v.salary_max ?? '∞'} {v.salary_currency ?? 'RUB'}
                                                    </p>
                                                ) : <span className="text-gray-400">—</span>}
                                            </td>
                                            {/* Skills */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {v.skills.slice(0, 3).map(skill => (
                                                        <span key={skill.id} className="text-xs border border-gray-200
                                                                dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                    {v.skills.length > 3 && (
                                                        <span className="text-xs text-gray-400">+{v.skills.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Experience */}
                                            <td className="px-6 py-4 text-gray-400 text-xs">
                                                {v.experience_years !== null
                                                    ? t('dashboard.vacancies.experience', { years: v.experience_years })
                                                    : '—'}
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusColors[v.status]}`}>
                                                    {t(`dashboard.vacancies.status.${v.status}`)}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(v)}
                                                        className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                                                   border border-black dark:border-white rounded-full
                                                                   text-black dark:text-white hover:bg-black hover:text-white
                                                                   dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                        {t('dashboard.vacancies.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(v)}
                                                        className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                                                   border border-gray-300 dark:border-gray-700 rounded-full
                                                                   text-gray-400 hover:border-red-500 hover:text-red-500
                                                                   transition-all duration-200"
                                                    >
                                                        <Trash2Icon className="w-3.5 h-3.5" />
                                                        {t('dashboard.vacancies.delete')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination
                        currentPage={meta.current_page}
                        lastPage={meta.last_page}
                        onPageChange={page => setFilter('page', page)}
                    />
                </>
            )}

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-black dark:text-white">
                                {editing
                                    ? t('dashboard.vacancies.modal.editTitle')
                                    : t('dashboard.vacancies.modal.createTitle')
                                }
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Title */}
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

                            {/* Description */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.description')}
                                </label>
                                <textarea
                                    value={form.description ?? ''}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                                    placeholder={t('dashboard.vacancies.modal.descriptionPlaceholder')}
                                    rows={3}
                                    className="w-full px-5 py-3 bg-white dark:bg-black
                                               border border-gray-300 dark:border-gray-700 rounded-2xl
                                               text-gray-900 dark:text-white placeholder-gray-400 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                                               focus:border-transparent transition resize-none"
                                />
                            </div>

                            {/* Location */}
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

                            {/* Employment type + Work mode */}
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
                                            {(['full_time', 'part_time', 'contract', 'internship'] as VacancyEmploymentType[]).map(v => (
                                                <option key={v} value={v}>{t(`dashboard.vacancies.employment.${v}`)}</option>
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
                                            {(['office', 'remote', 'hybrid'] as VacancyWorkMode[]).map(v => (
                                                <option key={v} value={v}>{t(`dashboard.vacancies.workMode.${v}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status + Experience */}
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
                                            {(['draft', 'published', 'closed'] as VacancyStatus[]).map(v => (
                                                <option key={v} value={v}>{t(`dashboard.vacancies.status.${v}`)}</option>
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

                            {/* Grade */}
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

                            {/* Education level */}
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

                            {/* Salary */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.salaryMin')} / {t('dashboard.vacancies.modal.salaryMax')}
                                </label>
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
                            </div>

                            {/* Required Skills */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.skillsLabel')}
                                </label>
                                <SkillsInput
                                    value={form.skills}
                                    onChange={skills => setForm(f => ({ ...f, skills }))}
                                />
                            </div>
                        </div>

                        {/* Save error */}
                        {saveError && (
                            <p className="text-red-500 text-xs text-center mt-4">{saveError}</p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.title.trim()}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full disabled:opacity-40
                                           disabled:cursor-not-allowed transition-all duration-200 text-sm"
                            >
                                {saving
                                    ? t('dashboard.vacancies.saving')
                                    : editing
                                        ? t('dashboard.vacancies.modal.update')
                                        : t('dashboard.vacancies.modal.add')
                                }
                            </button>
                            <button
                                onClick={closeModal}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.vacancies.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-sm p-8">

                        <h2 className="text-xl font-bold text-black dark:text-white mb-2">
                            {t('dashboard.vacancies.deleteConfirm')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{deleteTarget.title}</p>
                        <p className="text-xs text-gray-400 mb-8">{t('dashboard.vacancies.deleteText')}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-medium
                                           rounded-full disabled:opacity-40 disabled:cursor-not-allowed
                                           transition-all duration-200 text-sm"
                            >
                                {deleting ? t('dashboard.vacancies.deleting') : t('dashboard.vacancies.delete')}
                            </button>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.vacancies.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
            <div className="h-8 w-40 rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse mb-8" />
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                ))}
            </div>
        </div>
    )
}

export default function VacanciesPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <VacanciesPageContent />
        </Suspense>
    )
}
