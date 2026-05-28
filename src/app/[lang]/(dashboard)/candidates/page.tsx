'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/useTranslation'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { candidates as cApi, interviews as iApi, vacancies as vApi } from '@/lib/api'
import {
    Candidate, CandidateEducationLevel, CandidateSource, CandidateGrade,
    CandidateData, Vacancy, Skill, Locale
} from '@/types'
import {
    type CandidateFieldErrors,
    validateCandidateForm,
    validateCandidateStep2,
    applyCandidateApiError,
    buildCandidateMessages,
    buildCandidateStep2Messages,
} from '@/lib/candidate-validation'
import { PlusIcon, LinkIcon, CheckIcon, XIcon, ChevronRightIcon } from 'lucide-react'
import SkillsInput from '@/components/skills/SkillsInput'
import { SearchInput } from '@/components/filters/SearchInput'
import { SelectFilter } from '@/components/filters/SelectFilter'
import { SortControl } from '@/components/filters/SortControl'
import { ActiveFilters } from '@/components/filters/ActiveFilters'
import { Pagination } from '@/components/ui/Pagination'

const EMPTY_FORM: CandidateData = {
    first_name: '', last_name: '', middle_name: null,
    email: '', phone: '', source: 'hh',
    grade: null, experience_years: 0, education_level: 'bachelor',
    locale: 'ru',
    workplaces: [], socials: [], skills: [],
}

// ── Классы полей с поддержкой состояния ошибки ────────────────────────────────

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

const FILTER_DEFAULTS = {
    search: '',
    status: '',
    grade: '',
    source: '',
    sort: '',
    order: '',
    page: 1,
}

const CANDIDATE_SORT_OPTIONS = [
    { value: 'created_at', labelKey: 'dashboard.filters.candidates.sort_created' },
    { value: 'name', labelKey: 'dashboard.filters.candidates.sort_name' },
    { value: 'experience_years', labelKey: 'dashboard.filters.candidates.sort_experience' },
    { value: 'grade', labelKey: 'dashboard.filters.candidates.sort_grade' },
    { value: 'status', labelKey: 'dashboard.filters.candidates.sort_status' },
]

type ModalStep = null | 'basic' | 'details'

function CandidatePageContent() {
    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()

    const { filters, setFilter, setFilters, resetFilters } = useUrlFilters(FILTER_DEFAULTS)

    const [items, setItems] = useState<Candidate[]>([])
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState<ModalStep>(null)
    const [form, setForm] = useState<CandidateData>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<CandidateFieldErrors>({})
    const [linkModal, setLinkModal] = useState<Candidate | null>(null)
    const [allVacancies, setAllVacancies] = useState<Vacancy[]>([])
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
    const [generatedLink, setGeneratedLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [questionsNumber, setQuestionsNumber] = useState<number | ''>('')

    const reqId = useRef(0)

    // Fetch vacancies once for the interview modal
    useEffect(() => {
        if (!token) return
        vApi.list(token).then(r => setAllVacancies(r.data))
    }, [token])

    // Fetch candidates whenever filters change
    useEffect(() => {
        if (!token) return
        const id = ++reqId.current
        setLoading(true)
        cApi.list(token, filters).then(r => {
            if (reqId.current !== id) return
            setItems(r.data)
            setMeta({ current_page: r.current_page, last_page: r.last_page, total: r.total })
            setLoading(false)
        }).catch(() => {
            if (reqId.current === id) setLoading(false)
        })
    }, [token, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

    const closeModals = () => {
        setStep(null)
        setForm(EMPTY_FORM)
        setFieldErrors({})
        setLinkModal(null)
        setGeneratedLink('')
        setSelectedVacancy(null)
    }

    // ── Хелпер: обновить поле и сбросить его ошибку ──────────────────────────
    const setField = <K extends keyof CandidateData>(key: K, value: CandidateData[K]) => {
        setForm(f => ({ ...f, [key]: value }))
        if (fieldErrors[key as keyof CandidateFieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [key]: undefined }))
        }
    }

    // ── Шаг 1 → Шаг 2: валидация базовых полей ───────────────────────────────
    const handleProceedToDetails = () => {
        const msgs = buildCandidateMessages(t, 'dashboard.candidates.modal.saveError')
        const errs = validateCandidateForm(form, 'create', msgs)

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }
        setFieldErrors({})
        setStep('details')
    }

    // ── Создать кандидата ─────────────────────────────────────────────────────
    const createCandidate = async () => {
        if (!token) return

        // Повторная валидация шага 1 (на случай перехода назад)
        const msgs  = buildCandidateMessages(t, 'dashboard.candidates.modal.saveError')
        const errs1 = validateCandidateForm(form, 'create', msgs)
        if (Object.keys(errs1).length > 0) {
            setFieldErrors(errs1)
            setStep('basic')
            return
        }

        // Валидация шага 2: workplaces и socials
        const msgs2 = buildCandidateStep2Messages(t)
        const errs2 = validateCandidateStep2(form, msgs2)
        if (Object.keys(errs2).length > 0) {
            setFieldErrors(errs2)
            return
        }

        setSaving(true)
        setFieldErrors({})
        try {
            const skill_ids: number[] = form.skills.map(skill => skill.id)
            const candidate = await cApi.create(form, skill_ids, token)
            setItems(prev => [candidate, ...prev])
            setMeta(m => ({ ...m, total: m.total + 1 }))
            closeModals()
        } catch (err) {
            const mapped = applyCandidateApiError(err, t('dashboard.candidates.modal.saveError'))
            setFieldErrors(mapped)
            // Если ошибки на полях шага 1 — вернуть туда пользователя
            const step1Fields: (keyof CandidateFieldErrors)[] = ['first_name', 'last_name', 'email', 'grade', 'experience_years', 'education_level', 'source', 'locale']
            const hasStep1Errors = step1Fields.some(f => mapped[f])
            if (hasStep1Errors) setStep('basic')
        } finally {
            setSaving(false)
        }
    }

    const createInterview = async () => {
        if (!token || !linkModal || !selectedVacancy) return
        const result = await iApi.create({
            vacancy_id: selectedVacancy.id,
            candidate_id: linkModal.id,
            questions_number: questionsNumber === '' ? 5 : questionsNumber
        }, token)
        setGeneratedLink(result.link)
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

    const updateWorkplace = (idx: number, field: string, value: string) => {
        setForm(f => {
            const updated = [...f.workplaces]
            updated[idx] = { ...updated[idx], [field]: value }
            return { ...f, workplaces: updated }
        })
        // Сбрасываем ошибку конкретного поля workplace
        if (fieldErrors.workplaces?.[idx]?.[field as keyof typeof fieldErrors.workplaces[0]]) {
            setFieldErrors(prev => {
                const wp = [...(prev.workplaces ?? [])]
                wp[idx] = { ...wp[idx], [field]: undefined }
                return { ...prev, workplaces: wp }
            })
        }
    }

    const updateSocial = (idx: number, field: string, value: string) => {
        setForm(f => {
            const updated = [...f.socials]
            updated[idx] = { ...updated[idx], [field]: value }
            return { ...f, socials: updated }
        })
        // Сбрасываем ошибку конкретного поля social
        if (fieldErrors.socials?.[idx]?.[field as keyof typeof fieldErrors.socials[0]]) {
            setFieldErrors(prev => {
                const sc = [...(prev.socials ?? [])]
                sc[idx] = { ...sc[idx], [field]: undefined }
                return { ...prev, socials: sc }
            })
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
        filters.search ? { key: 'search', label: `"${filters.search}"` } : null,
        filters.status ? { key: 'status', label: t(`dashboard.candidates.detail.status.${filters.status}`) } : null,
        filters.grade  ? { key: 'grade',  label: t(`dashboard.vacancies.grade.${filters.grade}`) } : null,
        filters.source ? { key: 'source', label: t(`dashboard.candidates.detail.sources.${filters.source}`) } : null,
    ].filter((c): c is { key: string; label: string } => c !== null)

    return (
        <div className="min-h-screen p-4 sm:p-8">

            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">{t('dashboard.candidates.heading')}</h1>
                    <p className="text-sm text-gray-400 mt-1">{t('dashboard.candidates.total', { count: meta.total })}</p>
                </div>
                <button
                    onClick={() => setStep('basic')}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('dashboard.candidates.add')}</span>
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchInput
                    value={filters.search}
                    onChange={v => setFilter('search', v)}
                    placeholder={t('dashboard.filters.candidates.search_placeholder')}
                />
                <SelectFilter
                    value={filters.status}
                    onChange={v => setFilter('status', v)}
                    placeholder={t('dashboard.filters.candidates.filter_status')}
                    options={[
                        { value: 'new',      label: t('dashboard.candidates.detail.status.new') },
                        { value: 'screened', label: t('dashboard.candidates.detail.status.screened') },
                        { value: 'approved', label: t('dashboard.candidates.detail.status.approved') },
                        { value: 'rejected', label: t('dashboard.candidates.detail.status.rejected') },
                    ]}
                />
                <SelectFilter
                    value={filters.grade}
                    onChange={v => setFilter('grade', v)}
                    placeholder={t('dashboard.filters.candidates.filter_grade')}
                    options={[
                        { value: 'junior', label: t('dashboard.vacancies.grade.junior') },
                        { value: 'middle', label: t('dashboard.vacancies.grade.middle') },
                        { value: 'senior', label: t('dashboard.vacancies.grade.senior') },
                        { value: 'lead',   label: t('dashboard.vacancies.grade.lead') },
                    ]}
                />
                <SelectFilter
                    value={filters.source}
                    onChange={v => setFilter('source', v)}
                    placeholder={t('dashboard.filters.candidates.filter_source')}
                    options={[
                        { value: 'hh',             label: t('dashboard.candidates.detail.sources.hh') },
                        { value: 'habr',           label: t('dashboard.candidates.detail.sources.habr') },
                        { value: 'social',         label: t('dashboard.candidates.detail.sources.social') },
                        { value: 'email',          label: t('dashboard.candidates.detail.sources.email') },
                        { value: 'resume_parsing', label: t('dashboard.candidates.detail.sources.resume_parsing') },
                        { value: 'bulk_import',    label: t('dashboard.candidates.detail.sources.bulk_import') },
                    ]}
                />
                <SortControl
                    sort={filters.sort}
                    order={filters.order}
                    label={t('dashboard.filters.sort_by')}
                    options={CANDIDATE_SORT_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
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

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">{t('dashboard.candidates.empty')}</p>
                    {activeChips.length === 0 && (
                        <button
                            onClick={() => setStep('basic')}
                            className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                        >
                            {t('dashboard.candidates.addFirst')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="rounded-3xl border border-black dark:border-white overflow-hidden bg-white dark:bg-black">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                            <tr className="border-b border-black dark:border-white">
                                {[
                                    t('dashboard.candidates.tableHeaders.candidate'),
                                    t('dashboard.candidates.tableHeaders.contacts'),
                                    t('dashboard.candidates.tableHeaders.skills'),
                                    t('dashboard.candidates.tableHeaders.lastPosition'),
                                    t('dashboard.candidates.tableHeaders.interview'),
                                    ''
                                ].map((h, i) => (
                                    <th key={i} className="text-left px-6 py-4 text-xs font-semibold
                                            text-black dark:text-white uppercase tracking-widest">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((c, idx) => (
                                <tr key={c.id ?? idx} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-950
                                        ${idx !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}>
                                    <td className="px-6 py-4">
                                        <Link href={`/${language}/candidates/${c.id}`} className="group">
                                            <p className="font-semibold text-black dark:text-white group-hover:underline underline-offset-2 transition">
                                                {c.last_name} {c.first_name}
                                            </p>
                                            {c.middle_name && (
                                                <p className="text-xs text-gray-400 mt-0.5">{c.middle_name}</p>
                                            )}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-600 dark:text-gray-400">{c.email ?? '—'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? '—'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(c.skills ?? []).slice(0, 3).map(s => (
                                                <span key={s.slug} className="text-xs border border-gray-200
                                                        dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {s.name}
                                                </span>
                                            ))}
                                            {(c.skills?.length ?? 0) > 3 && (
                                                <span className="text-xs text-gray-400">+{c.skills!.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.workplaces?.[0] ? (
                                            <div>
                                                <p className="text-sm text-black dark:text-white">
                                                    {c.workplaces[0].position}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {c.workplaces[0].company_name}
                                                </p>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {t('dashboard.candidates.interviewCount', { count: c.interviews?.length ?? 0 })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => { setLinkModal(c); setGeneratedLink(''); setSelectedVacancy(null) }}
                                            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                                    border border-black dark:border-white rounded-full
                                                    text-black dark:text-white hover:bg-black hover:text-white
                                                    dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            {t('dashboard.candidates.interviewButton')}
                                        </button>
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

            {/* ── Modal: Step 1 — basic info ─────────────────────────────────── */}
            {step === 'basic' && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">{t('dashboard.candidates.modal.newTitle')}</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-7">{t('dashboard.candidates.modal.step1')}</p>

                        <div className="space-y-3">
                            {/* Last name + First name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <input
                                        value={form.last_name}
                                        onChange={e => setField('last_name', e.target.value)}
                                        placeholder={t('dashboard.candidates.modal.lastName')}
                                        className={inputCls(fieldErrors.last_name)}
                                    />
                                    {fieldErrors.last_name && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.last_name}</p>
                                    )}
                                </div>
                                <div>
                                    <input
                                        value={form.first_name}
                                        onChange={e => setField('first_name', e.target.value)}
                                        placeholder={t('dashboard.candidates.modal.firstName')}
                                        className={inputCls(fieldErrors.first_name)}
                                    />
                                    {fieldErrors.first_name && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.first_name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Middle name */}
                            <input
                                value={form.middle_name ?? ''}
                                onChange={e => setField('middle_name', e.target.value || null)}
                                placeholder={t('dashboard.candidates.modal.middleName')}
                                className={inputCls()}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            {/* Email */}
                            <div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setField('email', e.target.value)}
                                    placeholder={t('dashboard.candidates.modal.email')}
                                    className={inputCls(fieldErrors.email)}
                                />
                                {fieldErrors.email && (
                                    <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <input
                                type="tel"
                                value={form.phone ?? ''}
                                onChange={e => setField('phone', e.target.value)}
                                placeholder={t('dashboard.candidates.modal.phone')}
                                className={inputCls()}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            {/* Experience + Source */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.experience_years}
                                        onChange={e => setField('experience_years', +e.target.value)}
                                        placeholder={t('dashboard.candidates.modal.experience')}
                                        className={inputCls(fieldErrors.experience_years)}
                                    />
                                    {fieldErrors.experience_years && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.experience_years}</p>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={form.source}
                                        onChange={e => setField('source', e.target.value as CandidateSource)}
                                        className={selectCls(fieldErrors.source)}
                                    >
                                        {(['hh', 'habr', 'social', 'email', 'resume_parsing', 'bulk_import'] as CandidateSource[]).map(v => (
                                            <option key={v} value={v}>{t(`dashboard.candidates.detail.sources.${v}`)}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                            </div>

                            {/* Locale */}
                            <div className="relative">
                                <select
                                    value={form.locale}
                                    onChange={e => setField('locale', e.target.value as Locale)}
                                    className={selectCls()}
                                >
                                    {(['ru', 'en'] as Locale[]).map(v => (
                                        <option key={v} value={v}>{t(`dashboard.candidates.modal.locale.${v}`)}</option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                            </div>

                            {/* Education + Grade */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <select
                                        value={form.education_level}
                                        onChange={e => setField('education_level', e.target.value as CandidateEducationLevel)}
                                        className={selectCls(fieldErrors.education_level)}
                                    >
                                        <option value="">{t('dashboard.candidates.modal.education')}</option>
                                        {(['secondary', 'incomplete_higher', 'bachelor', 'master', 'specialist', 'doctor'] as CandidateEducationLevel[]).map(v => (
                                            <option key={v} value={v}>{t(`dashboard.vacancies.educationLevel.${v}`)}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    {fieldErrors.education_level && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.education_level}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="relative">
                                        <select
                                            value={form.grade ?? ''}
                                            onChange={e => setField('grade', (e.target.value || null) as CandidateGrade | null)}
                                            className={selectCls(fieldErrors.grade)}
                                        >
                                            <option value="">{t('dashboard.candidates.modal.gradePlaceholder')}</option>
                                            {(['junior', 'middle', 'senior', 'lead'] as CandidateGrade[]).map(g => (
                                                <option key={g} value={g}>{t(`dashboard.vacancies.grade.${g}`)}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                    </div>
                                    {fieldErrors.grade && (
                                        <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.grade}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* General server error on step 1 */}
                        {fieldErrors.general && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 mt-4">
                                <p className="text-red-600 text-xs text-center">{fieldErrors.general}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-7">
                            <button
                                onClick={handleProceedToDetails}
                                className="w-full flex items-center justify-center gap-2 py-3.5
                                           bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full transition-all duration-200 text-sm"
                            >
                                {t('dashboard.candidates.modal.nextStep')}
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={closeModals}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.candidates.modal.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Step 2 — skills & experience ────────────────────────── */}
            {step === 'details' && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">{t('dashboard.candidates.modal.skillsTitle')}</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-7">
                            {t('dashboard.candidates.modal.step2prefix')}{' '}
                            <button
                                onClick={() => setStep('basic')}
                                className="underline hover:text-black dark:hover:text-white transition"
                            >
                                {t('dashboard.candidates.modal.goBack')}
                            </button>
                        </p>

                        {/* Skills */}
                        <div className="mb-6">
                            <p className="text-sm font-medium text-black dark:text-white mb-3">{t('dashboard.candidates.modal.skills')}</p>
                            <SkillsInput
                                value={form.skills}
                                onChange={(skills: Skill[]) => {
                                    setForm(f => ({ ...f, skills }))
                                    if (fieldErrors.skill_ids) setFieldErrors(prev => ({ ...prev, skill_ids: undefined }))
                                }}
                            />
                            {fieldErrors.skill_ids && (
                                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.skill_ids}</p>
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-900 mb-6" />

                        {/* Workplaces */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-black dark:text-white">{t('dashboard.candidates.modal.workExperience')}</p>
                                <button
                                    onClick={() => {
                                        setForm(f => ({
                                            ...f,
                                            workplaces: [...f.workplaces, {
                                                company_name: '', position: '',
                                                description: '', started_at: '', ended_at: null,
                                            }]
                                        }))
                                        if (fieldErrors.workplaces_min) setFieldErrors(prev => ({ ...prev, workplaces_min: undefined }))
                                    }}
                                    className="text-xs text-black dark:text-white underline hover:opacity-60 transition"
                                >
                                    {t('dashboard.candidates.modal.addWorkplace')}
                                </button>
                            </div>

                            {fieldErrors.workplaces_min && (
                                <p className="text-red-500 text-xs mb-2">{fieldErrors.workplaces_min}</p>
                            )}
                            {form.workplaces.length === 0 && !fieldErrors.workplaces_min && (
                                <p className="text-xs text-gray-400">{t('dashboard.candidates.modal.noWorkplaces')}</p>
                            )}

                            {form.workplaces.map((w, idx) => {
                                const wpErr = fieldErrors.workplaces?.[idx]
                                return (
                                    <div key={idx} className={`space-y-2 mb-4 p-4 rounded-2xl border
                                        ${wpErr ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-800'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-gray-400">{t('dashboard.candidates.modal.position', { number: idx + 1 })}</p>
                                            <button
                                                onClick={() => setForm(f => ({
                                                    ...f,
                                                    workplaces: f.workplaces.filter((_, i) => i !== idx)
                                                }))}
                                                className="text-gray-300 hover:text-red-500 transition"
                                            >
                                                <XIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div>
                                            <input
                                                className={inputCls(wpErr?.company_name)}
                                                placeholder={t('dashboard.candidates.modal.company')}
                                                value={w.company_name}
                                                onChange={e => updateWorkplace(idx, 'company_name', e.target.value)}
                                            />
                                            {wpErr?.company_name && (
                                                <p className="text-red-500 text-xs mt-1 ml-4">{wpErr.company_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                className={inputCls(wpErr?.position)}
                                                placeholder={t('dashboard.candidates.modal.companyPosition')}
                                                value={w.position}
                                                onChange={e => updateWorkplace(idx, 'position', e.target.value)}
                                            />
                                            {wpErr?.position && (
                                                <p className="text-red-500 text-xs mt-1 ml-4">{wpErr.position}</p>
                                            )}
                                        </div>
                                        <input
                                            className={inputCls(wpErr?.description)}
                                            placeholder={t('dashboard.candidates.modal.description')}
                                            value={w.description}
                                            onChange={e => updateWorkplace(idx, 'description', e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <input
                                                    className={inputCls(wpErr?.started_at)}
                                                    type="date"
                                                    value={w.started_at}
                                                    onChange={e => updateWorkplace(idx, 'started_at', e.target.value)}
                                                />
                                                {wpErr?.started_at && (
                                                    <p className="text-red-500 text-xs mt-1 ml-4">{wpErr.started_at}</p>
                                                )}
                                            </div>
                                            <input
                                                className={inputCls()}
                                                type="date"
                                                value={w.ended_at ?? ''}
                                                onChange={e => updateWorkplace(idx, 'ended_at', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-900 mb-6" />

                        {/* Socials */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-black dark:text-white">{t('dashboard.candidates.modal.socials')}</p>
                                <button
                                    onClick={() => {
                                        setForm(f => ({ ...f, socials: [...f.socials, { name: '', url: '' }] }))
                                        if (fieldErrors.socials_min) setFieldErrors(prev => ({ ...prev, socials_min: undefined }))
                                    }}
                                    className="text-xs text-black dark:text-white underline hover:opacity-60 transition"
                                >
                                    {t('dashboard.candidates.modal.addSocial')}
                                </button>
                            </div>

                            {fieldErrors.socials_min && (
                                <p className="text-red-500 text-xs mb-2">{fieldErrors.socials_min}</p>
                            )}
                            {form.socials.length === 0 && !fieldErrors.socials_min && (
                                <p className="text-xs text-gray-400">{t('dashboard.candidates.modal.noSocials')}</p>
                            )}

                            {form.socials.map((s, idx) => {
                                const scErr = fieldErrors.socials?.[idx]
                                return (
                                    <div key={idx} className="flex gap-2 mb-3 items-start">
                                        <div className="flex-1 space-y-1">
                                            <input
                                                className={inputCls(scErr?.name)}
                                                placeholder={t('dashboard.candidates.modal.socialPlaceholder')}
                                                value={s.name}
                                                onChange={e => updateSocial(idx, 'name', e.target.value)}
                                            />
                                            {scErr?.name && (
                                                <p className="text-red-500 text-xs ml-4">{scErr.name}</p>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                className={inputCls(scErr?.url)}
                                                placeholder="URL"
                                                value={s.url}
                                                onChange={e => updateSocial(idx, 'url', e.target.value)}
                                            />
                                            {scErr?.url && (
                                                <p className="text-red-500 text-xs ml-4">{scErr.url}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setForm(f => ({
                                                ...f,
                                                socials: f.socials.filter((_, i) => i !== idx)
                                            }))}
                                            className="text-gray-300 hover:text-red-500 transition shrink-0 mt-3"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* General server error */}
                        {fieldErrors.general && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 mb-4">
                                <p className="text-red-600 text-xs text-center">{fieldErrors.general}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={createCandidate}
                                disabled={saving}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full disabled:opacity-40
                                           disabled:cursor-not-allowed transition-all duration-200 text-sm"
                            >
                                {saving ? t('dashboard.candidates.modal.saving') : t('dashboard.candidates.modal.add')}
                            </button>
                            <button
                                onClick={closeModals}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.candidates.modal.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: create interview link ────────────────────────────────── */}
            {linkModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">{t('dashboard.candidates.interview.title')}</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-7">
                            {linkModal.last_name} {linkModal.first_name}
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
                                        className={inputCls()}
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
                                    <button onClick={closeModals}
                                            className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                                   text-gray-500 rounded-full text-sm hover:border-black
                                                   hover:text-black dark:hover:border-white dark:hover:text-white transition-all">
                                        {t('dashboard.candidates.interview.cancel')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-400 mb-4">{t('dashboard.candidates.interview.linkReady')}</p>
                                <div className="flex gap-2 mb-2">
                                    <input readOnly value={generatedLink}
                                           className="flex-1 px-4 py-3 text-xs bg-gray-50 dark:bg-gray-950 rounded-full
                                                   border border-gray-200 dark:border-gray-800 text-gray-600 focus:outline-none" />
                                    <button onClick={copyLink}
                                            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-medium
                                                   bg-black dark:bg-white text-white dark:text-black transition-all">
                                        {copied
                                            ? <><CheckIcon className="w-3.5 h-3.5" /> {t('dashboard.candidates.interview.copied')}</>
                                            : <><LinkIcon className="w-3.5 h-3.5" /> {t('dashboard.candidates.interview.copy')}</>
                                        }
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-7">{t('dashboard.candidates.interview.validity')}</p>
                                <button onClick={closeModals}
                                        className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                               text-gray-500 rounded-full text-sm hover:border-black
                                               hover:text-black dark:hover:border-white dark:hover:text-white transition-all">
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

function PageSkeleton() {
    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="h-8 w-40 rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse mb-8" />
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                ))}
            </div>
        </div>
    )
}

export default function CandidatePage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <CandidatePageContent />
        </Suspense>
    )
}
