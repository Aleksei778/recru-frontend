// src/app/[lang]/(dashboard)/resume/page.tsx

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/language-context'
import { candidates as cApi, resume as rApi, operations as opApi } from '@/lib/api'
import { ApiError } from '@/lib/api'
import {
    UploadIcon, FileTextIcon, SparklesIcon, SearchIcon,
    CheckIcon, ChevronRightIcon, XIcon,
    BriefcaseIcon, GlobeIcon, PlusIcon, Trash2Icon, LinkIcon, CalendarIcon,
} from 'lucide-react'
import type { Candidate, CandidateEducationLevel, ParsedCandidate, Workplace, Social } from '@/types'

type Stage = 'upload' | 'parsing' | 'review' | 'candidate' | 'saving' | 'done'
type CandidateMode = 'new' | 'existing'

const inputClass = `
    w-full px-5 py-3.5 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
            {label}
        </label>
        {children}
    </div>
)

export default function ResumePage() {
    const { t } = useTranslation()
    const { language } = useLanguage()
    const { token } = useAuth()

    const [stage, setStage] = useState<Stage>('upload')
    const [error, setError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [pasteText, setPasteText] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
    const [parsed, setParsed] = useState<ParsedCandidate | null>(null)
    const [resumeId, setResumeId] = useState<number | null>(null)

    const [parseOpId, setParseOpId] = useState<number | null>(null)
    const [evalOpId, setEvalOpId] = useState<number | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [candidateMode, setCandidateMode]     = useState<CandidateMode>('new')
    const [candidateSearch, setCandidateSearch]   = useState('')
    const [candidates, setCandidates]        = useState<Candidate[]>([])
    const [candidatesLoading, setCandidatesLoading] = useState(false)
    const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null)
    const searchRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [reviewMounted, setReviewMounted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!parseOpId || !evalOpId || !token) return
        if (stage !== 'parsing') return

        pollRef.current = setInterval(async () => {
            try {
                const [parseOp, evalOp] = await Promise.all([
                    opApi.status(parseOpId, token),
                    opApi.status(evalOpId, token),
                ])

                if (parseOp.status === 'completed' && evalOp.status === 'completed') {
                    clearInterval(pollRef.current!)
                    pollRef.current = null

                    setParsed({
                        candidateData: parseOp.result,
                        text_grade:    evalOp.result?.feedback ?? '',
                        grade:         evalOp.result?.score ?? 0,
                    })
                    setStage('review')
                }

                if (parseOp.status === 'failed' || evalOp.status === 'failed') {
                    clearInterval(pollRef.current!)
                    pollRef.current = null
                    setError(t('dashboard.resume.parsing.error'))
                    setStage('upload')
                }
            } catch {
                clearInterval(pollRef.current!)
                pollRef.current = null
                setError(t('dashboard.resume.parsing.error'))
                setStage('upload')
            }
        }, 3000)

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current)
                pollRef.current = null
            }
        }
    }, [parseOpId, evalOpId, token, t, stage])

    useEffect(() => {
        if (candidateMode !== 'existing' || !candidateSearch.trim() || !token) return

        if (searchRef.current) clearTimeout(searchRef.current)

        searchRef.current = setTimeout(async () => {
            setCandidatesLoading(true)
            try {
                const res = await cApi.search(candidateSearch, token)
                setCandidates(res)
            } finally {
                setCandidatesLoading(false)
            }
        }, 300)
    }, [candidateSearch, candidateMode, token])

    useEffect(() => {
        if (stage === 'review') {
            const t = setTimeout(() => setReviewMounted(true), 30)
            return () => clearTimeout(t)
        }
        setReviewMounted(false)
    }, [stage])

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f?.type === 'application/pdf') setFile(f)
    }, [])

    const parse = async () => {
        setError(null)
        setStage('parsing')

        try {
            let result

            if (inputMode === 'file' && file) {
                const formData = new FormData()
                formData.append('resume', file)
                result = await rApi.file(formData, token!)
            } else {
                result = await rApi.text(pasteText, token!)
            }

            setResumeId(result.resume_id)
            setParseOpId(result.parse_operation_id)
            setEvalOpId(result.evaluate_operation_id)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('dashboard.resume.parsing.error'))
            setStage('upload')
        }
    }

    const setField = (path: string, value: unknown) => {
        setParsed(p => {
            if (!p) return p
            const keys = path.split('.')
            const next = { ...p }
            let obj: Record<string, unknown> = next as unknown as Record<string, unknown>
            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...(obj[keys[i]] as object) }
                obj = obj[keys[i]] as Record<string, unknown>
            }
            obj[keys[keys.length - 1]] = value
            return next
        })
    }

    const save = async () => {
        if (!parsed || !token || !resumeId) return
        setStage('saving')
        setError(null)

        try {
            await rApi.save(
                resumeId,
                candidateMode === 'existing' ? existingCandidate?.id : undefined,
                candidateMode,
                token
            )
            setStage('done')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('dashboard.resume.saving.error'))
            setStage('candidate')
        }
    }

    const reset = () => {
        setStage('upload')
        setFile(null)
        setPasteText('')
        setParsed(null)
        setError(null)
        setParseOpId(null)
        setEvalOpId(null)
        setResumeId(null)
        setCandidateMode('new')
        setExistingCandidate(null)
        setCandidateSearch('')
        setCandidates([])
    }

    const setWorkplace = (idx: number, field: keyof Workplace, value: unknown) => {
        setParsed(p => {
            if (!p) return p
            const workplaces = [...p.candidateData.workplaces]
            workplaces[idx] = { ...workplaces[idx], [field]: value }
            return { ...p, candidateData: { ...p.candidateData, workplaces } }
        })
    }

    const addWorkplace = () => {
        setParsed(p => {
            if (!p) return p
            const blank: Workplace = { company_name: '', position: '', description: '', started_at: '', ended_at: null }
            return { ...p, candidateData: { ...p.candidateData, workplaces: [...p.candidateData.workplaces, blank] } }
        })
    }

    const removeWorkplace = (idx: number) => {
        setParsed(p => {
            if (!p) return p
            return { ...p, candidateData: { ...p.candidateData, workplaces: p.candidateData.workplaces.filter((_, i) => i !== idx) } }
        })
    }

    const setSocial = (idx: number, field: keyof Social, value: string) => {
        setParsed(p => {
            if (!p) return p
            const socials = [...p.candidateData.socials]
            socials[idx] = { ...socials[idx], [field]: value }
            return { ...p, candidateData: { ...p.candidateData, socials } }
        })
    }

    const addSocial = () => {
        setParsed(p => {
            if (!p) return p
            return { ...p, candidateData: { ...p.candidateData, socials: [...p.candidateData.socials, { name: '', url: '' }] } }
        })
    }

    const removeSocial = (idx: number) => {
        setParsed(p => {
            if (!p) return p
            return { ...p, candidateData: { ...p.candidateData, socials: p.candidateData.socials.filter((_, i) => i !== idx) } }
        })
    }

    const formatPeriod = (start: string, end: string | null) => {
        const fmt = (s: string) => {
            if (!s) return ''
            try { return new Date(s).toLocaleDateString(language, { month: 'short', year: 'numeric' }) }
            catch { return s }
        }
        const s = fmt(start)
        const e = end ? fmt(end) : t('dashboard.resume.workplace.present')
        if (!s && !end) return ''
        if (!s) return e
        return `${s} — ${e}`
    }

    const stageOrder: Record<Stage, number> = {
        upload: 0, parsing: 0, review: 1, saving: 2, candidate: 2, done: 3
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">

                <div className="mb-10">
                    <div className="flex items-center mb-2 gap-3">
                        <SparklesIcon className="w-5 h-5 text-black dark:text-white" />
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {t('dashboard.resume.heading')}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-400 ml-8">{t('dashboard.resume.subheading')}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10 flex-wrap">
                    {(['upload', 'review', 'candidate', 'done'] as const).map((s, i) => {
                        const current = stageOrder[stage]
                        const step    = stageOrder[s]
                        const active  = current === step
                        const done    = current > step

                        return (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 text-xs font-medium transition-colors
                                    ${done   ? 'text-gray-400' : ''}
                                    ${active ? 'text-black dark:text-white' : ''}
                                    ${!done && !active ? 'text-gray-300 dark:text-gray-700' : ''}
                                `}>
                                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs
                                        transition-all duration-300
                                        ${done   ? 'border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700' : ''}
                                        ${active ? 'border-black bg-black text-white dark:bg-white dark:border-white dark:text-black' : ''}
                                        ${!done && !active ? 'border-gray-200 dark:border-gray-800' : ''}
                                    `}>
                                        {done ? <CheckIcon className="w-3 h-3" /> : i + 1}
                                    </span>
                                    {t(`dashboard.resume.steps.${s}`)}
                                </div>
                                {i < 3 && <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" />}
                            </div>
                        )
                    })}
                </div>

                {/* Upload */}
                {stage === 'upload' && (
                    <div className="space-y-6">
                        <div className="flex gap-1 rounded-full border border-gray-200 dark:border-gray-800 w-fit">
                            {(['file', 'text'] as const).map(mode => (
                                <button key={mode} onClick={() => setInputMode(mode)}
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all
                                        ${inputMode === mode
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'text-gray-500 hover:text-black dark:hover:text-white'
                                        }`}>
                                    {mode === 'file' ? t('dashboard.resume.upload.pdf') : t('dashboard.resume.upload.text')}
                                </button>
                            ))}
                        </div>

                        {inputMode === 'file' && (
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-3xl border-2 border-dashed p-16
                                    flex flex-col items-center justify-center gap-4
                                    cursor-pointer transition-all duration-200 group
                                    ${dragOver
                                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-950'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white'
                                }`}
                            >
                                <input ref={fileInputRef} type="file" accept="application/pdf"
                                       className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />

                                {file ? (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl border-2 border-black dark:border-white flex items-center justify-center">
                                            <FileTextIcon className="w-6 h-6 text-black dark:text-white" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-black dark:text-white text-sm">{file.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button onClick={e => { e.stopPropagation(); setFile(null) }}
                                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black dark:hover:text-white transition">
                                            <XIcon className="w-3.5 h-3.5" />
                                            {t('dashboard.resume.upload.remove')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl border-2 border-gray-300 dark:border-gray-700
                                            flex items-center justify-center group-hover:border-black dark:group-hover:border-white transition-colors">
                                            <UploadIcon className="w-6 h-6 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-black dark:text-white">
                                                {t('dashboard.resume.upload.drop')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">PDF — {t('dashboard.resume.upload.size')}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {inputMode === 'text' && (
                            <div className="rounded-3xl border border-black dark:border-white p-1">
                                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                                          placeholder={t('dashboard.resume.upload.paste')} rows={12}
                                          className="w-full px-5 py-4 bg-transparent text-sm text-gray-900
                                        dark:text-white placeholder-gray-400 resize-none focus:outline-none" />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button onClick={parse}
                                disabled={inputMode === 'file' ? !file : !pasteText.trim()}
                                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black
                                font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed
                                transition-all duration-200 text-sm flex items-center justify-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            {t('dashboard.resume.upload.parse')}
                        </button>
                    </div>
                )}

                {stage === 'parsing' && (
                    <div className="rounded-3xl border border-black dark:border-white p-16
                        flex flex-col items-center justify-center gap-6">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-800" />
                            <div className="absolute inset-0 rounded-full border-2 border-transparent
                                border-t-black dark:border-t-white animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-black dark:text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-black dark:text-white">{t('dashboard.resume.parse.parsing')}</p>
                            <p className="text-sm text-gray-400 mt-1">{t('dashboard.resume.parse.hint')}</p>
                        </div>
                    </div>
                )}

                {stage === 'review' && parsed && (
                    <div
                        className="space-y-6"
                        style={{
                            opacity: reviewMounted ? 1 : 0,
                            transform: reviewMounted ? 'none' : 'translateY(10px)',
                            transition: 'opacity 0.45s ease, transform 0.45s ease',
                        }}
                    >
                        {/* AI Summary + circular score */}
                        <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black">
                            <div className="flex items-start gap-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <SparklesIcon className="w-4 h-4 text-black dark:text-white" />
                                        <span className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                            {t('dashboard.resume.review.summary')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{parsed.text_grade}</p>
                                </div>
                                {parsed.grade != null && (() => {
                                    const r = 34
                                    const circ = 2 * Math.PI * r
                                    const color = parsed.grade >= 7 ? 'text-emerald-500' : parsed.grade >= 5 ? 'text-amber-500' : 'text-red-400'
                                    return (
                                        <div className="relative w-20 h-20 shrink-0">
                                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                                <circle cx="40" cy="40" r={r} strokeWidth="5" fill="none"
                                                    stroke="currentColor" className="text-gray-100 dark:text-gray-900" />
                                                <circle cx="40" cy="40" r={r} strokeWidth="5" fill="none"
                                                    stroke="currentColor" strokeLinecap="round"
                                                    className={color}
                                                    style={{
                                                        strokeDasharray: circ,
                                                        strokeDashoffset: reviewMounted
                                                            ? circ * (1 - parsed.grade / 10)
                                                            : circ,
                                                        transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) 0.3s',
                                                    }} />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold ${color}`}>{parsed.grade}</span>
                                                <span className="text-[10px] text-gray-400">/ 10</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>

                        {/* Basic fields */}
                        <div className="rounded-3xl border border-black dark:border-white p-8 space-y-5">
                            <p className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                {t('dashboard.resume.review.fields')}
                            </p>


                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label={t('candidate.lastName')}>
                                    <input value={parsed.candidateData.last_name}
                                           onChange={e => setField('candidateData.last_name', e.target.value)}
                                           className={inputClass} />
                                </Field>
                                <Field label={t('candidate.firstName')}>
                                    <input value={parsed.candidateData.first_name}
                                           onChange={e => setField('candidateData.first_name', e.target.value)}
                                           className={inputClass} />
                                </Field>
                            </div>

                            <Field label={t('candidate.middleName')}>
                                <input value={parsed.candidateData.middle_name ?? ''}
                                       onChange={e => setField('candidateData.middle_name', e.target.value || null)}
                                       className={inputClass} />
                            </Field>

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <Field label={t('candidate.email')}>
                                <input type="email" value={parsed.candidateData.email ?? ''}
                                       onChange={e => setField('candidateData.email', e.target.value)}
                                       className={inputClass} />
                            </Field>

                            <Field label={t('candidate.phone')}>
                                <input value={parsed.candidateData.phone ?? ''}
                                       onChange={e => setField('candidateData.phone', e.target.value || null)}
                                       className={inputClass} />
                            </Field>

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label={t('candidate.experienceYears')}>
                                    <input type="number" min={0}
                                           value={parsed.candidateData.experience_years ?? ''}
                                           onChange={e => setField('candidateData.experience_years', +e.target.value)}
                                           className={inputClass} />
                                </Field>
                                <Field label={t('candidate.educationLevel')}>
                                    <select value={parsed.candidateData.education_level ?? ''}
                                            onChange={e => setField('candidateData.education_level', e.target.value as CandidateEducationLevel)}
                                            className={inputClass}>
                                        {(['secondary', 'incomplete_higher', 'bachelor', 'master', 'specialist', 'doctor'] as const).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        {/* Workplaces */}
                        <div className="rounded-3xl border border-black dark:border-white p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BriefcaseIcon className="w-4 h-4 text-black dark:text-white" />
                                    <p className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                        {t('dashboard.resume.review.workExperience')}
                                    </p>
                                </div>
                                {parsed.candidateData.workplaces.length > 0 && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500">
                                        {parsed.candidateData.workplaces.length}
                                    </span>
                                )}
                            </div>

                            {parsed.candidateData.workplaces.length > 0 ? (
                                <div className="relative space-y-4">
                                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-800" />

                                    {parsed.candidateData.workplaces.map((wp, idx) => (
                                        <div
                                            key={idx}
                                            className="relative pl-9"
                                            style={{
                                                opacity: reviewMounted ? 1 : 0,
                                                transform: reviewMounted ? 'none' : 'translateX(-6px)',
                                                transition: `opacity 0.4s ease ${0.15 + idx * 0.1}s, transform 0.4s ease ${0.15 + idx * 0.1}s`,
                                            }}
                                        >
                                            <div className={`absolute left-0 top-4 w-[22px] h-[22px] rounded-full z-10
                                                border-2 border-black dark:border-white bg-white dark:bg-black
                                                flex items-center justify-center transition-transform hover:scale-110
                                                ${!wp.ended_at ? 'shadow-[0_0_0_4px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]' : ''}`}>
                                                <div className={`w-2 h-2 rounded-full bg-black dark:bg-white ${!wp.ended_at ? 'animate-pulse' : ''}`} />
                                            </div>

                                            <div className="rounded-2xl border border-gray-100 dark:border-gray-900
                                                hover:border-gray-300 dark:hover:border-gray-700
                                                transition-colors duration-200 p-5 space-y-4">

                                                {(wp.company_name || wp.position) && (
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-sm text-black dark:text-white">
                                                                {wp.position || <span className="text-gray-400 italic font-normal">{t('dashboard.resume.workplace.position')}</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {wp.company_name || <span className="text-gray-300 italic">{t('dashboard.resume.workplace.company')}</span>}
                                                            </p>
                                                        </div>
                                                        {(wp.started_at || wp.ended_at) && (
                                                            <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                {formatPeriod(wp.started_at, wp.ended_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Field label={t('dashboard.resume.workplace.company')}>
                                                        <input value={wp.company_name}
                                                               onChange={e => setWorkplace(idx, 'company_name', e.target.value)}
                                                               className={inputClass} />
                                                    </Field>
                                                    <Field label={t('dashboard.resume.workplace.position')}>
                                                        <input value={wp.position}
                                                               onChange={e => setWorkplace(idx, 'position', e.target.value)}
                                                               className={inputClass} />
                                                    </Field>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Field label={t('dashboard.resume.workplace.startDate')}>
                                                        <input type="date" value={wp.started_at}
                                                               onChange={e => setWorkplace(idx, 'started_at', e.target.value)}
                                                               className={inputClass} />
                                                    </Field>
                                                    <Field label={t('dashboard.resume.workplace.endDate')}>
                                                        <input type="date" value={wp.ended_at ?? ''}
                                                               onChange={e => setWorkplace(idx, 'ended_at', e.target.value || null)}
                                                               className={inputClass} />
                                                    </Field>
                                                </div>

                                                {wp.description && (
                                                    <Field label={t('dashboard.resume.workplace.description')}>
                                                        <textarea value={wp.description}
                                                                  onChange={e => setWorkplace(idx, 'description', e.target.value)}
                                                                  rows={2}
                                                                  className="w-full px-5 py-3.5 bg-white dark:bg-black
                                                                      border border-gray-300 dark:border-gray-700 rounded-2xl
                                                                      text-gray-900 dark:text-white placeholder-gray-400 text-sm
                                                                      focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                                                                      focus:border-transparent transition resize-none" />
                                                    </Field>
                                                )}

                                                <button onClick={() => removeWorkplace(idx)}
                                                        className="text-xs text-gray-300 dark:text-gray-700
                                                            hover:text-red-400 dark:hover:text-red-500
                                                            flex items-center gap-1 transition-colors">
                                                    <Trash2Icon className="w-3 h-3" />
                                                    {t('dashboard.resume.workplace.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">{t('dashboard.resume.review.noWorkplaces')}</p>
                            )}

                            <button onClick={addWorkplace}
                                    className="w-full py-3 border border-dashed border-gray-200 dark:border-gray-800
                                        rounded-2xl text-xs text-gray-400
                                        hover:border-black dark:hover:border-white
                                        hover:text-black dark:hover:text-white
                                        transition-all duration-200 flex items-center justify-center gap-2">
                                <PlusIcon className="w-3.5 h-3.5" />
                                {t('dashboard.resume.review.addWorkplace')}
                            </button>
                        </div>

                        {/* Socials */}
                        <div className="rounded-3xl border border-black dark:border-white p-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-black dark:text-white" />
                                <p className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                    {t('dashboard.resume.review.socials')}
                                </p>
                            </div>

                            {parsed.candidateData.socials.length > 0 ? (
                                <div className="space-y-3">
                                    {parsed.candidateData.socials.map((social, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 group"
                                            style={{
                                                opacity: reviewMounted ? 1 : 0,
                                                transform: reviewMounted ? 'none' : 'translateX(-6px)',
                                                transition: `opacity 0.4s ease ${0.25 + idx * 0.08}s, transform 0.4s ease ${0.25 + idx * 0.08}s`,
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800
                                                flex items-center justify-center shrink-0
                                                group-hover:border-black dark:group-hover:border-white
                                                group-hover:bg-black dark:group-hover:bg-white
                                                transition-all duration-200">
                                                <GlobeIcon className="w-3.5 h-3.5 text-gray-400
                                                    group-hover:text-white dark:group-hover:text-black transition-colors" />
                                            </div>
                                            <div className="w-24 sm:w-36 shrink-0">
                                                <input value={social.name}
                                                       onChange={e => setSocial(idx, 'name', e.target.value)}
                                                       placeholder={t('dashboard.resume.social.name')}
                                                       className={inputClass} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <input value={social.url}
                                                       onChange={e => setSocial(idx, 'url', e.target.value)}
                                                       placeholder="URL"
                                                       className={inputClass} />
                                            </div>
                                            <button onClick={() => removeSocial(idx)}
                                                    className="p-2 text-gray-200 dark:text-gray-800
                                                        hover:text-red-400 dark:hover:text-red-500
                                                        transition-colors shrink-0">
                                                <XIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">{t('dashboard.resume.review.noSocials')}</p>
                            )}

                            <button onClick={addSocial}
                                    className="w-full py-3 border border-dashed border-gray-200 dark:border-gray-800
                                        rounded-2xl text-xs text-gray-400
                                        hover:border-black dark:hover:border-white
                                        hover:text-black dark:hover:text-white
                                        transition-all duration-200 flex items-center justify-center gap-2">
                                <PlusIcon className="w-3.5 h-3.5" />
                                {t('dashboard.resume.review.addSocial')}
                            </button>
                        </div>

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <div className="flex gap-3">
                            <button onClick={reset}
                                    className="flex-1 py-4 border border-gray-300 dark:border-gray-700
                                    text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                    dark:hover:border-white dark:hover:text-white transition-all">
                                {t('dashboard.resume.review.uploadAnother')}
                            </button>
                            <button onClick={() => setStage('candidate')}
                                    className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black
                                    font-medium rounded-full transition-all text-sm flex items-center justify-center gap-2">
                                {t('dashboard.resume.review.next')}
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Candidate selection */}
                {stage === 'candidate' && (
                    <div className="space-y-6">
                        <div className="flex gap-1 p-1 rounded-full border border-gray-200 dark:border-gray-800">
                            {(['new', 'existing'] as CandidateMode[]).map(mode => (
                                <button key={mode} onClick={() => setCandidateMode(mode)}
                                        className={`flex-1 py-2 rounded-full text-sm font-medium transition-all
                                        ${candidateMode === mode
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'text-gray-500 hover:text-black dark:hover:text-white'
                                        }`}>
                                    {mode === 'new' ? t('dashboard.resume.candidate.new') : t('dashboard.resume.candidate.existing')}
                                </button>
                            ))}
                        </div>

                        {candidateMode === 'new' && parsed && (
                            <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black space-y-2">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-3">
                                    {t('dashboard.resume.candidate.willCreate')}
                                </p>
                                <p className="font-semibold text-black dark:text-white">
                                    {parsed.candidateData.last_name} {parsed.candidateData.first_name}
                                </p>
                                {parsed.candidateData.email && (
                                    <p className="text-sm text-gray-400">{parsed.candidateData.email}</p>
                                )}
                                {parsed.candidateData.phone && (
                                    <p className="text-sm text-gray-400">{parsed.candidateData.phone}</p>
                                )}
                                <button onClick={() => setStage('review')}
                                        className="text-xs text-gray-400 hover:text-black dark:hover:text-white
                                        underline underline-offset-4 transition mt-2 block">
                                    {t('dashboard.resume.candidate.editData')}
                                </button>
                            </div>
                        )}

                        {candidateMode === 'existing' && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2
                                        w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input value={candidateSearch}
                                           onChange={e => { setCandidateSearch(e.target.value); setExistingCandidate(null) }}
                                           placeholder={t('dashboard.resume.candidate.search')}
                                           className="w-full pl-9 pr-4 py-3 rounded-full border border-gray-300
                                            dark:border-gray-700 bg-white dark:bg-black text-sm text-gray-900
                                            dark:text-white placeholder-gray-400 focus:outline-none
                                            focus:ring-2 focus:ring-black dark:focus:ring-white transition" />
                                </div>

                                {candidatesLoading && (
                                    <p className="text-xs text-gray-400 text-center py-2">{t('dashboard.resume.candidate.searching')}</p>
                                )}

                                {!candidatesLoading && candidates.length > 0 && (
                                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        {candidates.map((c, idx) => (
                                            <button key={c.id} onClick={() => setExistingCandidate(c)}
                                                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors
                                                    ${existingCandidate?.id === c.id
                                                        ? 'bg-black dark:bg-white'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-950'
                                                    }
                                                    ${idx !== candidates.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}>
                                                <div>
                                                    <p className={`text-sm font-medium
                                                        ${existingCandidate?.id === c.id ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                                                        {c.last_name} {c.first_name}
                                                    </p>
                                                    <p className={`text-xs mt-0.5
                                                        ${existingCandidate?.id === c.id ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}>
                                                        {c.email}
                                                    </p>
                                                </div>
                                                {existingCandidate?.id === c.id && (
                                                    <CheckIcon className="w-4 h-4 text-white dark:text-black shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!candidatesLoading && candidateSearch && candidates.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">{t('dashboard.resume.candidate.notFound')}</p>
                                )}
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <div className="flex gap-3">
                            <button onClick={() => setStage('review')}
                                    className="flex-1 py-4 border border-gray-300 dark:border-gray-700
                                    text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                    dark:hover:border-white dark:hover:text-white transition-all">
                                {t('dashboard.resume.candidate.back')}
                            </button>
                            <button onClick={save}
                                    disabled={candidateMode === 'existing' && !existingCandidate}
                                    className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black
                                    font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed
                                    transition-all text-sm flex items-center justify-center gap-2">
                                <CheckIcon className="w-4 h-4" />
                                {candidateMode === 'new' ? t('dashboard.resume.candidate.create') : t('dashboard.resume.candidate.attach')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Saving */}
                {stage === 'saving' && (
                    <div className="rounded-3xl border border-black dark:border-white p-16
                        flex flex-col items-center justify-center gap-6">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-800
                            border-t-black dark:border-t-white animate-spin" />
                        <p className="text-sm text-gray-400">{t('dashboard.resume.saving.text')}</p>
                    </div>
                )}

                {/* Done */}
                {stage === 'done' && (
                    <div className="rounded-3xl border border-black dark:border-white p-16
                        flex flex-col items-center justify-center gap-6 text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-black dark:border-white flex items-center justify-center">
                            <CheckIcon className="w-8 h-8 text-black dark:text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white text-lg">
                                {t('dashboard.resume.done.title')}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{t('dashboard.resume.done.hint')}</p>
                        </div>
                        <button onClick={reset}
                                className="px-8 py-3 border border-gray-300 dark:border-gray-700
                                text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                dark:hover:border-white dark:hover:text-white transition-all">
                            {t('dashboard.resume.done.another')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
