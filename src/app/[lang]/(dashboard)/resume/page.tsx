// src/app/[lang]/(dashboard)/resume/page.tsx

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import { candidates as cApi, resume as rApi, operations as opApi } from '@/lib/api'
import { ApiError } from '@/lib/api'
import {
    UploadIcon, FileTextIcon, SparklesIcon,
    CheckIcon, ChevronRightIcon, XIcon,
} from 'lucide-react'
import type { ParsedCandidate } from '@/types'
import { CandidateEducationLevel } from '@/types'

type Stage = 'upload' | 'parsing' | 'review' | 'saving' | 'done'

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
    const { token } = useAuth()

    const [stage, setStage] = useState<Stage>('upload')
    const [error, setError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [pasteText, setPasteText] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
    const [parsed, setParsed] = useState<ParsedCandidate | null>(null)

    const [parseOpId, setParseOpId] = useState<number | null>(null)
    const [evalOpId,  setEvalOpId] = useState<number | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!parseOpId || !evalOpId || !token) return

        pollRef.current = setInterval(async () => {
            try {
                const [parseOp, evalOp] = await Promise.all([
                    opApi.status(parseOpId, token),
                    opApi.status(evalOpId,  token),
                ])

                if (parseOp.status === 'completed' && evalOp.status === 'completed') {
                    clearInterval(pollRef.current!)

                    setParsed({
                        candidateData: parseOp.result,
                        text_grade: evalOp.result?.text_grade ?? 'No text grade provided.',
                        grade: evalOp.result?.grade ?? 0,
                    })

                    setStage('review')
                }

                if (parseOp.status === 'failed' || evalOp.status === 'failed') {
                    clearInterval(pollRef.current!)
                    setError(t('dashboard.resume.parsing.error'))
                    setStage('upload')
                }
            } catch {
                clearInterval(pollRef.current!)
                setError(t('dashboard.resume.parsing.error'))
                setStage('upload')
            }
        }, 3000)

        return () => clearInterval(pollRef.current!)
    }, [parseOpId, evalOpId, token, t])

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
        if (!parsed || !token) return
        setStage('saving')
        setError(null)

        try {
            await cApi.create(parsed.candidateData, token)
            setStage('done')
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('dashboard.resume.saving.error'))
            setStage('review')
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
    }

    const stageOrder: Record<Stage, number> = {
        upload: 0, parsing: 0, review: 1, saving: 1, done: 2
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">
            <div className="max-w-2xl mx-auto">

                <div className="mb-10">
                    <div className="flex items-center mb-2 gap-3">
                        <SparklesIcon className="w-5 h-5 text-black dark:text-white" />
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {t('dashboard.resume.heading')}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-400 ml-8">
                        {t('dashboard.resume.subheading')}
                    </p>
                </div>

                <div className="flex items-center gap-3 mb-10">
                    {(['upload', 'review', 'done'] as const).map((s, i) => {
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
                                        ${done   ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900' : ''}
                                        ${active ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' : ''}
                                        ${!done && !active ? 'border-gray-200 dark:border-gray-800' : ''}
                                    `}>
                                        {done ? <CheckIcon className="w-3 h-3" /> : i + 1}
                                    </span>
                                    {t(`dashboard.resume.steps.${s}`)}
                                </div>
                                {i < 2 && <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" />}
                            </div>
                        )
                    })}
                </div>

                {stage === 'upload' && (
                    <div className="space-y-6">
                        <div className="flex gap-1 rounded-full border border-gray-200 dark:border-gray-800 w-fit">
                            {(['file', 'text'] as const).map(mode => (
                                <button key={mode} onClick={() => setInputMode(mode)}
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
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
                                        <div className="w-14 h-14 rounded-2xl border-2 border-black dark:border-white
                                            flex items-center justify-center">
                                            <FileTextIcon className="w-6 h-6 text-black dark:text-white" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-black dark:text-white text-sm">{file.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button onClick={e => { e.stopPropagation(); setFile(null) }}
                                                className="flex items-center gap-1.5 text-xs text-gray-400
                                                hover:text-black dark:hover:text-white transition">
                                            <XIcon className="w-3.5 h-3.5" />
                                            {t('dashboard.resume.upload.remove')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl border-2 border-gray-300 dark:border-gray-700
                                            flex items-center justify-center group-hover:border-black
                                            dark:group-hover:border-white transition-colors">
                                            <UploadIcon className="w-6 h-6 text-gray-400 group-hover:text-black
                                                dark:group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-black dark:text-white">
                                                {t('dashboard.resume.upload.drop')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                PDF — {t('dashboard.resume.upload.size')}
                                            </p>
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
                                font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm
                                flex items-center justify-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            {t('dashboard.resume.upload.parse')}
                        </button>
                    </div>
                )}

                {/* Parsing */}
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
                            <p className="font-semibold text-black dark:text-white">
                                {t('dashboard.resume.parse.parsing')}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('dashboard.resume.parse.hint')}
                            </p>
                        </div>
                    </div>
                )}

                {stage === 'review' && parsed && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="rounded-3xl border border-black dark:border-white p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-black dark:text-white" />
                                    <span className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                        {t('dashboard.resume.review.summary')}
                                    </span>
                                </div>
                                {parsed.grade != null && (
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-black dark:text-white">
                                            {parsed.grade}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">/ 100</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {parsed.text_grade}
                            </p>
                        </div>

                        <div className="rounded-3xl border border-black dark:border-white p-8 space-y-5">
                            <p className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                {t('dashboard.resume.review.fields')}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-2 gap-4">
                                <Field label={t('candidate.experienceYears')}>
                                    <input type="number" min={0}
                                           value={parsed.candidateData.experience_years ?? ''}
                                           onChange={e => setField('candidateData.experience_years', +e.target.value)}
                                           className={inputClass} />
                                </Field>
                                <Field label={t('candidate.educationLevel')}>
                                    <select value={parsed.candidateData.education_level ?? ''}
                                            onChange={e => setField('candidateData.education_level', e.target.value)}
                                            className={inputClass}>
                                        {Object.values(CandidateEducationLevel).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <div className="flex gap-3">
                            <button onClick={reset}
                                    className="flex-1 py-4 border border-gray-300 dark:border-gray-700
                                    text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                    dark:hover:border-white dark:hover:text-white transition-all">
                                Загрузить другое
                            </button>
                            <button onClick={save}
                                    className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black
                                    font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                    transition-all duration-200 text-sm flex items-center justify-center gap-2">
                                <CheckIcon className="w-4 h-4" />
                                {t('dashboard.resume.review.save')}
                            </button>
                        </div>
                    </div>
                )}

                {stage === 'done' && (
                    <div className="rounded-3xl border border-black dark:border-white p-16
                        flex flex-col items-center justify-center gap-6 text-center">
                        <div className="w-16 h-16 rounded-full border-2 border-black dark:border-white
                            flex items-center justify-center">
                            <CheckIcon className="w-8 h-8 text-black dark:text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white text-lg">
                                {t('dashboard.resume.done.title')}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('dashboard.resume.done.hint')}
                            </p>
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
