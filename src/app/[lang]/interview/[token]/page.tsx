// app/[lang]/(interview)/interview/[token]/page.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { interviews as api } from '@/lib/api'
import { MicIcon, StopCircleIcon, ChevronRightIcon, CheckCircleIcon } from 'lucide-react'

type Stage = 'loading' | 'question' | 'recording' | 'submitting' | 'completed' | 'error'

export default function InterviewPage() {
    const { token } = useParams<{ token: string }>()

    const [stage, setStage] = useState<Stage>('loading')
    const [question, setQuestion] = useState<{ id: number; number: number; text: string; audio_url: string | null } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [blob, setBlob] = useState<Blob | null>(null)
    const [duration, setDuration] = useState(0)

    const mediaRef = useRef<MediaRecorder | null>(null)
    const chunksRef= useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const fetchNextQuestion = async () => {
        setStage('loading')
        setBlob(null)
        setDuration(0)

        try {
            const data = await api.nextQuestion(token)

            if (data.status === 'completed') {
                setStage('completed')
                return
            }

            setQuestion(data.question)
            setStage('question')

            if (data.audio_url) {
                audioRef.current = new Audio(data.audio_url)
                audioRef.current.play().catch(() => {})
            }
        } catch {
            setError('Не удалось загрузить вопрос')
            setStage('error')
        }
    }

    useEffect(() => {
        fetchNextQuestion()
    }, [])

    const startRecording = async () => {
        chunksRef.current = []
        setDuration(0)

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

        recorder.ondataavailable = e => chunksRef.current.push(e.data)
        recorder.onstop = () => {
            const b = new Blob(chunksRef.current, { type: 'audio/webm' })
            setBlob(b)
            stream.getTracks().forEach(t => t.stop())
        }

        recorder.start()
        mediaRef.current = recorder
        setStage('recording')

        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }

    const stopRecording = () => {
        mediaRef.current?.stop()
        if (timerRef.current) clearInterval(timerRef.current)
        setStage('question')
    }

    const submitAnswer = async () => {
        if (!blob || !question) return
        setStage('submitting')

        try {
            const formData = new FormData()
            formData.append('audio', blob, 'answer.webm')
            formData.append('duration', String(duration))

            await api.submitAnswer(token, question.id, formData)

            fetchNextQuestion()
        } catch {
            setError('Не удалось отправить ответ')
            setStage('error')
        }
    }

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
                        Интервью завершено
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Ваши ответы приняты. Мы свяжемся с вами после рассмотрения.
                    </p>
                </div>
            </div>
        )
    }

    if (stage === 'error') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchNextQuestion}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-lg">

                {/* Вопрос */}
                <div className="mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">
                        Вопрос {question?.number}
                    </span>
                </div>

                <div className="rounded-3xl border border-black dark:border-white p-8 mb-8">
                    <p className="text-lg text-black dark:text-white leading-relaxed">
                        {question?.text}
                    </p>
                </div>

                {/* Запись */}
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
                            Остановить
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
                                        Перезаписать
                                    </button>
                                    <button
                                        onClick={submitAnswer}
                                        disabled={stage === 'submitting'}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5
                                            bg-black dark:bg-white text-white dark:text-black rounded-full
                                            text-sm font-medium disabled:opacity-40 transition-all"
                                    >
                                        Следующий вопрос
                                        <ChevronRightIcon className="w-4 h-4" />
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
                                Начать запись
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
