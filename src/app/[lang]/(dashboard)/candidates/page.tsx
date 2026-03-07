// src/app/[lang]/(dashboard)/candidates/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { candidates as cApi, interviews as iApi, vacancies as vApi } from '@/lib/api'
import {
    Candidate,
    CandidateEducationLevel,
    CandidateForm,
    CandidateSource,
    CandidateStatus,
    Vacancy,
    VacancyStatus
} from '@/lib/types'
import { PlusIcon, LinkIcon, CheckIcon, XIcon } from 'lucide-react'

const EMPTY_FORM: CandidateForm = {
    first_name:      '',
    last_name:       '',
    middle_name:     null,
    email:           '',
    phone:           '',
    resume_url:      '',
    linkedin_url:    null,
    github_url:      null,
    source:          CandidateSource.HH,
    experience_years: 0,
    education_level: CandidateEducationLevel.Bachelor,
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

export default function CandidatePage() {
    const { token }                                     = useAuth()
    const [items,          setItems]                    = useState<Candidate[]>([])
    const [loading,        setLoading]                  = useState(true)
    const [showModal,      setShowModal]                = useState(false)
    const [form,           setForm]                     = useState<CandidateForm>(EMPTY_FORM)
    const [saving,         setSaving]                   = useState(false)

    const [linkModal,      setLinkModal]                = useState<Candidate | null>(null)
    const [allVacancies,   setAllVacancies]             = useState<Vacancy[]>([])
    const [selectedVacancy, setSelectedVacancy]         = useState<Vacancy | null>(null)
    const [generatedLink,  setGeneratedLink]            = useState('')
    const [copied,         setCopied]                   = useState(false)

    useEffect(() => {
        if (!token) return
        Promise.all([cApi.list(token), vApi.list(token)]).then(([c, v]) => {
            setItems(c.data)
            setAllVacancies(v.data)
            setLoading(false)
        })
    }, [token])

    const createCandidate = async () => {
        if (!token) return
        setSaving(true)
        const candidate = await cApi.create(form, token)
        setItems(prev => [candidate, ...prev])
        setForm(EMPTY_FORM)
        setShowModal(false)
        setSaving(false)
    }

    const createInterview = async () => {
        if (!token || !linkModal || !selectedVacancy) return
        const result = await iApi.create({
            vacancy_id:   selectedVacancy.id,
            candidate_id: linkModal.id,
        }, token)
        setGeneratedLink(result.link)
    }

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const openLinkModal = (c: Candidate) => {
        setLinkModal(c)
        setGeneratedLink('')
        setSelectedVacancy(null)
    }

    const closeModals = () => {
        setShowModal(false)
        setLinkModal(null)
        setGeneratedLink('')
        setSelectedVacancy(null)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">Кандидаты</h1>
                    <p className="text-sm text-gray-400 mt-1">{items.length} кандидатов</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    Добавить кандидата
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">Нет кандидатов</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sm text-black dark:text-white underline underline-offset-4
                                   hover:opacity-60 transition"
                    >
                        Добавить первого кандидата →
                    </button>
                </div>
            ) : (
                <div className="rounded-3xl border border-black dark:border-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-black dark:border-white">
                            {['Кандидат', 'Контакты', 'Опыт', 'Источник', 'Интервью', ''].map(h => (
                                <th
                                    key={h}
                                    className="text-left px-6 py-4 text-xs font-semibold
                                                   text-black dark:text-white uppercase tracking-widest"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((c, idx) => (
                            <tr
                                key={c.id}
                                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-950
                                        ${idx !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}
                            >
                                {/* Кандидат */}
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-black dark:text-white">
                                        {c.last_name} {c.first_name}
                                    </p>
                                    {c.middle_name && (
                                        <p className="text-xs text-gray-400 mt-0.5">{c.middle_name}</p>
                                    )}
                                </td>

                                {/* Контакты */}
                                <td className="px-6 py-4">
                                    <p className="text-gray-600 dark:text-gray-400">{c.email ?? '—'}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? '—'}</p>
                                </td>

                                {/* Опыт */}
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                    {c.experience_years != null ? `${c.experience_years} лет` : '—'}
                                </td>

                                {/* Источник */}
                                <td className="px-6 py-4">
                                    {c.source ? (
                                        <span className="text-xs border border-gray-300 dark:border-gray-700
                                                             text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                                                {c.source}
                                            </span>
                                    ) : '—'}
                                </td>

                                {/* Интервью */}
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {c.interviews?.length ?? 0} интервью
                                </td>

                                {/* Действие */}
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => openLinkModal(c)}
                                        className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                                       border border-black dark:border-white rounded-full
                                                       text-black dark:text-white
                                                       hover:bg-black hover:text-white
                                                       dark:hover:bg-white dark:hover:text-black
                                                       transition-all duration-200"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Интервью
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Modal: Новый кандидат ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-7">
                            <h2 className="text-xl font-bold text-black dark:text-white">Новый кандидат</h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={form.last_name}
                                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                    placeholder="Фамилия *"
                                    required
                                    className={inputClass}
                                />
                                <input
                                    value={form.first_name}
                                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                    placeholder="Имя *"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <input
                                value={form.middle_name ?? ''}
                                onChange={e => setForm(f => ({ ...f, middle_name: e.target.value || null }))}
                                placeholder="Отчество"
                                className={inputClass}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <input
                                type="email"
                                value={form.email ?? ''}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="Email"
                                className={inputClass}
                            />
                            <input
                                type="tel"
                                value={form.phone ?? ''}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="Телефон"
                                className={inputClass}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.experience_years ?? ''}
                                    onChange={e => setForm(f => ({ ...f, experience_years: +e.target.value }))}
                                    placeholder="Опыт (лет)"
                                    className={inputClass}
                                />
                                <div className="relative">
                                    <select
                                        value={form.source ?? ''}
                                        onChange={e => setForm(f => ({ ...f, source: e.target.value as CandidateSource }))}
                                        className={selectClass}
                                    >
                                        {Object.values(CandidateSource).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={form.education_level ?? ''}
                                    onChange={e => setForm(f => ({ ...f, education_level: e.target.value as CandidateEducationLevel }))}
                                    className={selectClass}
                                >
                                    <option value="">Образование</option>
                                    {Object.values(CandidateEducationLevel).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                            </div>

                            <input
                                type="url"
                                value={form.resume_url ?? ''}
                                onChange={e => setForm(f => ({ ...f, resume_url: e.target.value }))}
                                placeholder="Ссылка на резюме"
                                className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-7">
                            <button
                                onClick={createCandidate}
                                disabled={saving || !form.first_name || !form.last_name}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           transition-all duration-200 text-sm"
                            >
                                {saving ? 'Сохранение...' : 'Добавить кандидата'}
                            </button>
                            <button
                                onClick={closeModals}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 dark:text-gray-400 rounded-full text-sm
                                           hover:border-black dark:hover:border-white
                                           hover:text-black dark:hover:text-white
                                           transition-all duration-200"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Создать интервью ── */}
            {linkModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">Создать интервью</h2>
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
                                        onChange={e => {
                                            const v = allVacancies.find(v => v.id === +e.target.value) ?? null
                                            setSelectedVacancy(v)
                                        }}
                                        className={selectClass}
                                    >
                                        <option value="">Выберите вакансию</option>
                                        {allVacancies
                                            .filter(v => v.status === VacancyStatus.Published)
                                            .map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.title}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={createInterview}
                                        disabled={!selectedVacancy}
                                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                                   font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                                   disabled:opacity-40 disabled:cursor-not-allowed
                                                   transition-all duration-200 text-sm"
                                    >
                                        Создать ссылку
                                    </button>
                                    <button
                                        onClick={closeModals}
                                        className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                                   text-gray-500 rounded-full text-sm
                                                   hover:border-black dark:hover:border-white
                                                   hover:text-black dark:hover:text-white
                                                   transition-all duration-200"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-400 mb-4">
                                    Ссылка готова — отправьте кандидату:
                                </p>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1 px-4 py-3 text-xs bg-gray-50 dark:bg-gray-950 rounded-full
                                                   border border-gray-200 dark:border-gray-800
                                                   text-gray-600 dark:text-gray-400 focus:outline-none"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs
                                                   font-medium transition-all duration-200
                                                   bg-black dark:bg-white text-white dark:text-black
                                                   hover:bg-gray-800 dark:hover:bg-gray-200"
                                    >
                                        {copied
                                            ? <><CheckIcon className="w-3.5 h-3.5" /> Скопировано</>
                                            : <><LinkIcon  className="w-3.5 h-3.5" /> Копировать</>
                                        }
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-7">Ссылка действительна 7 дней.</p>

                                <button
                                    onClick={closeModals}
                                    className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                               text-gray-500 rounded-full text-sm
                                               hover:border-black dark:hover:border-white
                                               hover:text-black dark:hover:text-white
                                               transition-all duration-200"
                                >
                                    Закрыть
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
