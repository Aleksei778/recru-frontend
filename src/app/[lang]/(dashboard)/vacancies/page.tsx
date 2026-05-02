'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { vacancies as vApi } from '@/lib/api'
import type { Vacancy, VacancyForm, VacancyEmploymentType, VacancyWorkMode, VacancyStatus } from '@/types'
import { PlusIcon, MapPinIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
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

export default function VacanciesPage() {
    const { token, tenant } = useAuth()
    const { t } = useTranslation()

    const [items, setItems] = useState<Vacancy[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<Vacancy | null>(null)
    const [form, setForm] = useState<VacancyForm>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Vacancy | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!token) return
        vApi.list(token).then(r => {
            setItems(r.data)
            setLoading(false)
        })
    }, [token])

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
            skills: [...v.skills],
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditing(null)
        setForm(EMPTY_FORM)
    }

    const handleSave = async () => {
        if (!token || !form.title.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const updated = await vApi.update(editing.id, form, token)
                setItems(prev => prev.map(v => v.id === updated.id ? updated : v))
            } else {
                const created = await vApi.create(form, token)
                setItems(prev => [created, ...prev])
            }
            closeModal()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!token || !deleteTarget) return
        setDeleting(true)
        try {
            await vApi.delete(deleteTarget.id, token)
            setItems(prev => prev.filter(v => v.id !== deleteTarget.id))
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        {t('dashboard.vacancies.heading')}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {t('dashboard.vacancies.total', { count: items.length })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('dashboard.vacancies.create')}
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-52 rounded-3xl border border-gray-200 dark:border-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">{t('dashboard.vacancies.empty')}</p>
                    <button
                        onClick={openCreate}
                        className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                    >
                        {t('dashboard.vacancies.createFirst')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(v => (
                        <div
                            key={v.id}
                            className="flex flex-col rounded-3xl border border-black dark:border-white
                                       p-7 hover:shadow-2xl transition-all duration-200"
                        >
                            {/* Title + status */}
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <h2 className="text-base font-bold text-black dark:text-white leading-snug">
                                    {v.title}
                                </h2>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColors[v.status]}`}>
                                    {t(`dashboard.vacancies.status.${v.status}`)}
                                </span>
                            </div>

                            {/* Company */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {tenant?.name ?? 'NDA Company'}
                            </p>

                            {/* Location */}
                            {v.location && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                                    <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    {v.location}
                                </div>
                            )}

                            {/* Salary */}
                            {(v.salary_min || v.salary_max) && (
                                <p className="text-sm font-semibold text-black dark:text-white mb-4">
                                    {v.salary_min ?? 0} — {v.salary_max ?? '∞'} {v.salary_currency ?? 'RUB'}
                                </p>
                            )}

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {v.skills.slice(0, 4).map(skill => (
                                    <span
                                        key={skill.id}
                                        className="text-xs border border-gray-300 dark:border-gray-600
                                                   text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full"
                                    >
                                        {skill.name}
                                    </span>
                                ))}
                                {v.skills.length > 4 && (
                                    <span className="text-xs text-gray-400">+{v.skills.length - 4}</span>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-auto flex items-center justify-between gap-2">
                                {v.experience_years !== null && (
                                    <span className="text-xs text-gray-400">
                                        {t('dashboard.vacancies.experience', { years: v.experience_years })}
                                    </span>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
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
                            </div>
                        </div>
                    ))}
                </div>
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
                            <div className="grid grid-cols-2 gap-3">
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
                            <div className="grid grid-cols-2 gap-3">
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

                            {/* Salary */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    {t('dashboard.vacancies.modal.salaryMin')} / {t('dashboard.vacancies.modal.salaryMax')}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
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
                                {deleting ? t('dashboard.vacancies.saving') : t('dashboard.vacancies.delete')}
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
