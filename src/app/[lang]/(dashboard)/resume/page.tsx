'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import {candidates as cApi, resume, resume as rApi} from '@/lib/api'
import { ApiError} from '@/lib/api'
import {
    UploadIcon, FileTextIcon, SparklesIcon,
    CheckIcon, ChevronRightIcon, XIcon, RefreshCwIcon,
} from 'lucide-react'
import React from 'react'
import type {
    CandidateData,
    ResumeParsingStage,
    ParsedCandidate
} from '@/types'
import {
    CandidateSource,
    CandidateEducationLevel, CandidateGrade
} from '@/types'

const inputClass = `
    w-full px-5 py-3.5 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

const Field = ({
    label, children
}: {
    label: string,
    children: React.ReactNode
}) => (
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

    const router = useRouter()

    const [stage, setStage] = useState<ResumeParsingStage>('upload')
    const [error, setError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [pasteText, setPasteText] = useState<string>('')
    const [dragOver, setDragOver] = useState<boolean>(false)
    const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
    const [parsed, setParsed] = useState<ParsedCandidate | null>(null)

    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()

        setDragOver(false)

        const f = e.dataTransfer.files[0]
        if (!f) return

        if (f && (f.type === 'application/pdf' || f.type === 'text/plain')) {
            setFile(f)
        }
    }, [])

    const parse = async () => {
        setError(null)
        setStage('parsing')

        try {
            let result: ParsedCandidate

            if (inputMode === 'file' && file) {
                const formData = new FormData()
                formData.append('resume', file)

                const { parsedCandidate } = await rApi.pdf(formData, token!)

                result = parsedCandidate
            } else {
                const { parsedCandidate } = await rApi.text(pasteText, token!)

                result = parsedCandidate
            }
        } catch (err) {
            let message = err instanceof ApiError
                ? err.message
                : t('dashboard.resume.parsing.error')

            setError(message)
            setStage('review')
        }
    }

    const reset = ()  => {
        setStage('upload')
        setFile(null)
        setPasteText('')
        setParsed(null)
        setError(null)
    }

    const save = async () => {
        if (!parsed || !token) return

        setStage('saving')
        setError(null)

        try {
            await cApi.create(parsed.candidateData, token)
            setStage('done')
        } catch (err) {
            let message = err instanceof ApiError
                ? err.message
                : t('dashboard.resume.saving.error')
        }
    }

    const setField = <K extends keyof ParsedCandidate>(key: K, value: ParsedCandidate[K]) => {
        setParsed(p => p ? {...p, [key]: value} : p)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center mb-2 gap-3">
                        <SparklesIcon className="w-5 h-5 text-black dark:text-white" />
                        <h1  className="text-2xl font-bold text-black dark:text-white">
                            {t('dashboard.resume.heading')}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-400 ml-8">
                        {t('dashboard.resume.subheading')}
                    </p>
                </div>

                {/* Progress steps */}
                <div className="flex items-center gap-3 mb-10">
                    {(['upload', 'review', 'done'] as const).map((s, i) => {
                        const stageOrder = { upload: 0, review: 1, saving: 1, done: 2 }
                        const current = stageOrder[stage]
                        const active = current === stageOrder[s]
                        const done = current < stageOrder[s]

                        return (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 text-xs font-medium transition-colors
                                    ${done ? 'text-gray-400' : ''}
                                    ${active ? 'text-black dark:text-white' : ''}
                                    ${!done && !active ? 'text-gray-300 dark:text-gray-700' : ''}
                                `}>
                                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs
                                        transition-all duration-300
                                        ${done ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900' : ''}
                                        ${active ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' : ''}
                                        ${!done && !active ? 'border-gray-200 dark:border-gray-800' : ''}
                                    `}>
                                        {done ? <CheckIcon className="w-3 h-3" /> : i + 1}
                                    </span>
                                    {t(`dashboard.resume.steps.${s}`)}
                                </div>
                                {i < 2 && (
                                    <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Stage: Upload */}
                {(stage === 'upload') && (
                    <div className="space-y-6">
                        {/* Mode toggle */}
                        <div className="flex gap-1 rounded-full border border-gray-200 dark:border-gray-800 w-fit">
                            {(['file', 'text'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setInputMode(mode)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium
                                                transition-all duration-200
                                                ${inputMode === mode
                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                                    }`}
                                >
                                    {mode === 'file'
                                        ? t('dashboard.resume.upload.pdf')
                                        : t('dashboard.resume.upload.text')
                                    }
                                </button>
                            ))}
                        </div>

                        {/* File drop zone */}
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                                />

                                {file ? (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl border-2 border-black dark:border-white flex items-center justify-center">
                                            <FileTextIcon className="w-6 h-6 text-black dark:text-white"/>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-black dark:text-white text-sm">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {(file.size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); setFile(null) }}
                                            className="flex items-center gap-1.5 text-xs text-gray-400
                                                       hover:text-black dark:hover:text-white transition"
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                            {t('dashboard.resume.upload.remove')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-2xl border-2 border-gray-300
                                            dark:border-gray-700 flex items-center justify-center
                                            group-hover:border-black dark:group-hover:border-white
                                            transition-colors"
                                        >
                                            <UploadIcon className="w-6 h-6 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-black dark:text-white">
                                                {t('dashboard.resume.upload.drop')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                PDF - {t('dashboard.resume.upload.size')}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Paste text zone */}
                        {inputMode === 'text' && (
                            <div className="rounded-3xl border border-black dark:border-white p-1">
                                <textarea
                                    value={pasteText}
                                    onChange={e => setPasteText(e.target.value)}
                                    placeholder={t('dashboard.resume.upload.paste')}
                                    rows={12}
                                    className="w-full px-5 py-4 bg-transparent text-sm text-gray-900
                                               dark:text-white placeholder-gray-400 resize-none
                                               focus:outline-none"
                                />
                            </div>
                        )}

                        {error && (
                            <p className= "text-red-500 text-xs text-center">{error}</p>
                        )}

                        <button
                            onClick={parse}
                            disabled={inputMode === 'file' ? !file : !pasteText.trim()}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black
                                       font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                       disabled:opacity-40 disabled:cursor-not-allowed
                                       transition-all duration-200 text-sm
                                       flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            {t('dashboard.resume.upload.parse')}
                        </button>
                    </div>
                )}

                {/* Stage: Parsing */}
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

                {/* Stage: Review */}
                {stage === 'review' && parsed && (
                    <div className="space-y-6">
                        {/* AI Summary */}
                        <div className="rounded-3xl border border-black dark:border-white p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <SparklesIcon className="w-4 h-4 text-black dark:text-white" />
                                <span className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest">
                                    {t('dashboard.resume.review.summary')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {parsed.summary}
                            </p>
                        </div>

                        {/* Editable Fields */}
                        <div className="rounded-3xl border border-black dark:border-white p-8 space-y-6">
                            <p className="text-xs font-semibold text-black dark:text-white uppercase tracking-widest mb-6">
                                {t('dashboard.resume.review.fields')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

