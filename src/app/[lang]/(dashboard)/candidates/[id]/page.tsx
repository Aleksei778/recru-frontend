// src/app/[lang]/(dashboard)/candidates/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useTranslation } from '@/hooks/useTranslation'
import { candidates as cApi, interviews as iApi, vacancies as vApi } from '@/lib/api'
import type { Candidate, Vacancy } from '@/types'
import { ChevronLeftIcon, LinkIcon, CheckIcon, XIcon } from 'lucide-react'

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

export default function CandidateDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()
    const router = useRouter()

    const [candidate, setCandidate] = useState<Candidate | null>(null)
    const [loading, setLoading] = useState(true)

    const [linkModal, setLinkModal] = useState(false)
    const [allVacancies, setAllVacancies] = useState<Vacancy[]>([])
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
    const [questionsNumber, setQuestionsNumber] = useState(5)
    const [generatedLink, setGeneratedLink] = useState('')
    const [copied, setCopied] = useState(false)

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

    const createInterview = async () => {
        if (!token || !candidate || !selectedVacancy) return
        const result = await iApi.create({
            vacancy_id: selectedVacancy.id,
            candidate_id: candidate.id,
            questions_number: questionsNumber,
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

    if (loading || !candidate) {
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

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">

                <button
                    onClick={() => router.push(`/${language}/candidates`)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-black dark:hover:text-white transition mb-6"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('dashboard.candidates.detail.back')}
                </button>

                {/* Header */}
                <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {candidate.last_name} {candidate.first_name}
                            {candidate.middle_name && (
                                <span className="text-gray-400 font-normal text-xl ml-2">{candidate.middle_name}</span>
                            )}
                        </h1>
                        {(candidate.grade || candidate.experience_years > 0) && (
                            <p className="text-sm text-gray-400 mt-1">
                                {candidate.grade && t(`dashboard.vacancies.grade.${candidate.grade}`)}
                                {candidate.grade && candidate.experience_years > 0 && ' · '}
                                {candidate.experience_years > 0 && t('dashboard.candidates.detail.yearsExp', { years: candidate.experience_years })}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {candidate.status && (
                            <span className="text-xs border border-gray-300 dark:border-gray-700 text-gray-500 px-3 py-1.5 rounded-full">
                                {t(`dashboard.candidates.detail.status.${candidate.status}`)}
                            </span>
                        )}
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
                    </div>
                </div>

                {/* Contacts card */}
                <div className="rounded-3xl border border-black dark:border-white p-6 mb-6">
                    <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                        {t('dashboard.candidates.detail.contacts')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {candidate.email && (
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.modal.email')}</p>
                                <p className="text-sm text-black dark:text-white">{candidate.email}</p>
                            </div>
                        )}
                        {candidate.phone && (
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.modal.phone')}</p>
                                <p className="text-sm text-black dark:text-white">{candidate.phone}</p>
                            </div>
                        )}
                        {candidate.education_level && (
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.education')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {t(`dashboard.vacancies.educationLevel.${candidate.education_level}`)}
                                </p>
                            </div>
                        )}
                        {candidate.source && (
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">{t('dashboard.candidates.detail.source')}</p>
                                <p className="text-sm text-black dark:text-white">
                                    {t(`dashboard.candidates.detail.sources.${candidate.source}`)}
                                </p>
                            </div>
                        )}
                    </div>

                    {(candidate.socials ?? []).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900">
                            <div className="flex flex-wrap gap-2">
                                {candidate.socials!.map((s, i) => (
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

                {/* Skills */}
                {(candidate.skills ?? []).length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-3">
                            {t('dashboard.candidates.detail.skills')}
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            {candidate.skills!.map(s => (
                                <span key={s.slug} className="text-xs border border-gray-200 dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Work Experience */}
                {(candidate.workplaces ?? []).length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                            {t('dashboard.candidates.detail.workExperience')}
                        </h2>
                        <div className="space-y-4">
                            {candidate.workplaces!.map((w, i) => (
                                <div
                                    key={i}
                                    className={i !== candidate.workplaces!.length - 1
                                        ? 'pb-4 border-b border-gray-100 dark:border-gray-900'
                                        : ''}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-black dark:text-white">{w.position}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{w.company_name}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0">
                                            {w.started_at} — {w.ended_at ?? t('dashboard.candidates.detail.present')}
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

                {/* Interviews */}
                {(candidate.interviews ?? []).length > 0 && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-4">
                            {t('dashboard.candidates.detail.interviews')}
                        </h2>
                        <div className="space-y-3">
                            {candidate.interviews!.map(iv => (
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

            </div>

            {/* Interview creation modal */}
            {linkModal && candidate && (
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
                            {candidate.last_name} {candidate.first_name}
                        </p>

                        {!generatedLink ? (
                            <>
                                <div className="relative mb-7">
                                    <select
                                        value={selectedVacancy?.id ?? ''}
                                        onChange={e => setSelectedVacancy(allVacancies.find(v => v.id === +e.target.value) ?? null)}
                                        className={selectClass}
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
                                        className={inputClass}
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
