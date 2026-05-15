// app/[lang]/(interview)/interview/[token]/page.tsx

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { interviews as api } from '@/lib/api'
import { MicIcon, StopCircleIcon, ChevronRightIcon, CheckCircleIcon, Volume2Icon, ClipboardCheckIcon } from 'lucide-react'
import { type Question, InterviewStage } from "@/types";
import { nauryzRedKeds } from '@/lib/font'
import { useTranslation } from '@/hooks/useTranslation'

export default function InterviewPage() {
    const { token } = useParams<{ token: string }>()
    const { t } = useTranslation()

    const [stage, setStage] = useState<InterviewStage>('intro')
    const [question, setQuestion] = useState<Question | null>(null)
    const [total, setTotal] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [blob, setBlob] = useState<Blob | null>(null)
    const [duration, setDuration] = useState(0)

    const mediaRef  = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
    const audioRef  = useRef<HTMLAudioElement | null>(null)

    const fetchNextQuestion = useCallback(async () => {
        setStage('loading')
        setBlob(null)
        setDuration(0)

        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }

        try {
            const data = await api.nextQuestion(token)

            if (data.is_completed) {
                setStage('completed')
                return
            }

            if (!data.question) {
                setError(t('interview.error.loadQuestion'))
                setStage('error')
                return
            }

            if (data.total_questions) setTotal(data.total_questions)
            setQuestion({
                id: data.question.id,
                number: data.question.number,
                text: data.question.text,
                answer: null
            })
            setStage('question')

            if (data.audio_url) {
                audioRef.current = new Audio(data.audio_url)
                audioRef.current.play().catch(() => {})
            }
        } catch {
            setError(t('interview.error.loadQuestion'))
            setStage('error')
        }
    }, [token, t])

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const startRecording = async () => {
        chunksRef.current = []
        setDuration(0)

        try {
            const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const b = new Blob(chunksRef.current, { type: 'audio/webm' })
                setBlob(b)
                stream.getTracks().forEach(t => t.stop())
            }

            recorder.start()
            mediaRef.current = recorder
            setStage('recording')

            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        } catch {
            setError(t('interview.error.noMic'))
            setStage('error')
        }
    }

    const stopRecording = () => {
        mediaRef.current?.stop()
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        setStage('question')
    }

    const submitAnswer = async () => {
        if (!blob || !question) return
        setStage('submitting')

        try {
            const formData = new FormData()
            formData.append('audio',    blob, 'answer.webm')
            formData.append('duration', String(duration))

            await api.submitAnswer(token, question.id, formData)

            await fetchNextQuestion()
        } catch {
            setError(t('interview.error.submitAnswer'))
            setStage('error')
        }
    }

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    if (stage === 'intro') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md flex flex-col items-center text-center">

                    <h1 className={`text-4xl font-bold text-black dark:text-white mb-2 ${nauryzRedKeds.className}`}>
                        RECRU
                    </h1>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-12">
                        {t('interview.intro.aiInterview')}
                    </p>

                    <div className="w-full rounded-3xl border border-black dark:border-white p-8 mb-8 text-left space-y-5">
                        <p className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest mb-6">
                            {t('interview.intro.howItWorks')}
                        </p>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                                <Volume2Icon className="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black dark:text-white">{t('interview.intro.questionStep')}</p>
                                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                                    {t('interview.intro.questionStepDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                                <MicIcon className="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black dark:text-white">{t('interview.intro.answerStep')}</p>
                                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                                    {t('interview.intro.answerStepDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0">
                                <ClipboardCheckIcon className="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black dark:text-white">{t('interview.intro.evaluationStep')}</p>
                                <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                                    {t('interview.intro.evaluationStepDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6">
                        {t('interview.intro.micHint')}
                    </p>

                    <button
                        onClick={fetchNextQuestion}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black
                            rounded-full font-medium text-sm transition-all hover:opacity-80"
                    >
                        {t('interview.intro.start')}
                    </button>
                </div>
            </div>
        )
    }

    if (stage === 'loading') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-800
                    border-t-black dark:border-t-white animate-spin" />
            </div>
        )
    }

    if (stage === 'completed') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <CheckCircleIcon className="w-16 h-16 text-black dark:text-white mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-black dark:text-white mb-3">
                        {t('interview.completed.title')}
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {t('interview.completed.text')}
                    </p>
                </div>
            </div>
        )
    }

    if (stage === 'error') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-red-500 mb-4 text-sm">{error}</p>
                    <button
                        onClick={fetchNextQuestion}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black
                            rounded-full text-sm font-medium"
                    >
                        {t('interview.error.retry')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-lg">

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400 uppercase tracking-widest">
                            {t('interview.question', { number: question?.number })}
                        </span>
                        {total && question && (
                            <span className="text-sm font-bold text-black dark:text-white tabular-nums">
                                {question.number} <span className="text-gray-400 font-normal">/ {total}</span>
                            </span>
                        )}
                    </div>
                    {total && question ? (
                        <div className="flex gap-1.5">
                            {Array.from({ length: total }, (_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-all duration-300
                                        ${i < question.number
                                            ? 'bg-black dark:bg-white'
                                            : 'bg-gray-200 dark:bg-gray-800'
                                        }`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-900" />
                    )}
                </div>

                <div className="rounded-3xl border border-black dark:border-white p-8 mb-8">
                    <p className="text-lg text-black dark:text-white leading-relaxed">
                        {question?.text}
                    </p>
                </div>

                {stage === 'recording' ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-2xl font-mono text-black dark:text-white">
                                {formatTime(duration)}
                            </span>
                        </div>
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-8 py-3.5 bg-black dark:bg-white
                                text-white dark:text-black rounded-full font-medium transition-all hover:opacity-80"
                        >
                            <StopCircleIcon className="w-5 h-5" />
                            {t('interview.stop')}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {blob ? (
                            <>
                                <audio
                                    src={URL.createObjectURL(blob)}
                                    controls
                                    className="w-full"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={startRecording}
                                        className="flex-1 py-3.5 border border-gray-300 dark:border-gray-700
                                            text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                            dark:hover:border-white dark:hover:text-white transition-all"
                                    >
                                        {t('interview.reRecord')}
                                    </button>
                                    <button
                                        onClick={submitAnswer}
                                        disabled={stage === 'submitting'}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5
                                            bg-black dark:bg-white text-white dark:text-black rounded-full
                                            text-sm font-medium disabled:opacity-40 transition-all"
                                    >
                                        {stage === 'submitting' ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30
                                                dark:border-black/30 border-t-white dark:border-t-black animate-spin" />
                                        ) : (
                                            <>
                                                {t('interview.nextQuestion')}
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={startRecording}
                                className="w-full flex items-center justify-center gap-2 py-4
                                    bg-black dark:bg-white text-white dark:text-black rounded-full
                                    font-medium text-sm transition-all hover:opacity-80"
                            >
                                <MicIcon className="w-5 h-5" />
                                {t('interview.intro.start')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
