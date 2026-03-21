'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { session } from '@/lib/api'
import type { AiEvaluation, InterviewSession, Message, Phase } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'
import { Send } from 'lucide-react'

export default function CandidateInterviewPage() {
    const { token } = useParams<{ token: string }>()
    const { t }     = useTranslation()

    const [info,      setInfo]      = useState<InterviewSession | null>(null)
    const [input,     setInput]     = useState('')
    const [phase,     setPhase]     = useState<Phase>('loading')
    const [canFinish, setCanFinish] = useState(false)
    const [messages,  setMessages]  = useState<Message[]>([])
    const [eval_,     setEval_]     = useState<AiEvaluation | null>(null)
    const [sending,   setSending]   = useState(false)
    const [error,     setError]     = useState<string | null>(null)

    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!token) return
        session.get(token).then(res => {
            setInfo(res)
            if (res.conversation?.length) {
                setMessages(res.conversation)
                setPhase('active')
            } else {
                setPhase('ready')
            }
        }).catch(() => setPhase('error'))
    }, [token])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, phase])

    const start = async () => {
        setSending(true)
        const { message } = await session.start(token)
        setMessages([{ role: 'assistant', content: message }])
        setPhase('active')
        setSending(false)
    }

    const send = async () => {
        if (!input.trim()) return
        const text = input.trim()
        setInput('')
        setMessages(m => [...m, { role: 'user', content: text }])
        setSending(true)
        try {
            const res = await session.answer(token, text)
            setMessages(m => [...m, { role: 'assistant', content: res.message }])
            if (res.can_finish) setCanFinish(true)
        } catch (err: any) {
            setError(err.message)
        }
        setSending(false)
    }

    const finish = async () => {
        setPhase('finishing')
        const res = await session.finish(token)
        setEval_(res)
        setPhase('done')
    }

    if (phase === 'error') {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
                <div className="rounded-3xl border border-black dark:border-white p-10
                                max-w-md w-full text-center">
                    <h1 className="text-lg font-bold text-black dark:text-white mb-2">
                        {t('interview.token.invalid_link')}
                    </h1>
                    <p className="text-sm text-gray-400">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">

            {/* Header */}
            <div className="border-b border-gray-100 dark:border-gray-900 px-6 py-4 bg-white dark:bg-black">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        {info ? (
                            <>
                                <h1 className="text-base font-bold text-black dark:text-white">
                                    {info.vacancy.title}
                                </h1>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {info.vacancy.tenant?.name}
                                </p>
                            </>
                        ) : (
                            <div className="h-8 w-48 rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse" />
                        )}
                    </div>

                    {phase === 'active' && canFinish && (
                        <button
                            onClick={finish}
                            className="text-xs px-4 py-2 border border-black dark:border-white rounded-full
                                       text-black dark:text-white hover:bg-black hover:text-white
                                       dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                        >
                            {t('interview.token.finish')}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat body */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                    {/* Ready state */}
                    {phase === 'ready' && info && (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16
                                            border-2 border-black dark:border-white rounded-3xl mb-6">
                                <span className="text-2xl" style={{ fontSize: 24 }}>👋</span>
                            </div>
                            <h2 className="text-xl font-bold text-black dark:text-white mb-3">
                                {t('interview.token.hello')}
                                {info.candidate.candidateData.last_name} {info.candidate.candidateData.first_name}
                            </h2>
                            <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                {t('interview.token.wait')}{' '}
                                <span className="text-black dark:text-white font-medium">
                                    {info.vacancy.title}
                                </span>.{' '}
                                {t('interview.token.honest')}
                            </p>
                            <button
                                onClick={start}
                                disabled={sending}
                                className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           rounded-full text-sm font-medium
                                           hover:bg-gray-800 dark:hover:bg-gray-200
                                           disabled:opacity-40 transition-all duration-200"
                            >
                                {sending ? t('interview.token.connecting') : t('interview.token.start')}
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-full border-2 border-black dark:border-white
                                                flex items-center justify-center text-black dark:text-white
                                                text-xs font-bold mr-2.5 mt-1 shrink-0 bg-white dark:bg-black">
                                    AI
                                </div>
                            )}
                            <div className={`max-w-lg text-sm px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap
                                ${msg.role === 'user'
                                ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-sm'
                                : 'border border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-bl-sm'
                            }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {sending && phase === 'active' && (
                        <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full border-2 border-black dark:border-white
                                            flex items-center justify-center text-black dark:text-white
                                            text-xs font-bold shrink-0">
                                AI
                            </div>
                            <div className="border border-gray-200 dark:border-gray-800
                                            rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Finishing */}
                    {phase === 'finishing' && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center gap-3 text-sm text-gray-400">
                                <span className="w-4 h-4 border-2 border-gray-300 border-t-black
                                                 dark:border-t-white rounded-full animate-spin" />
                                {t('interview.token.analyze')}
                            </div>
                        </div>
                    )}

                    {/* Done — evaluation */}
                    {phase === 'done' && eval_ && (
                        <div className="rounded-3xl border border-black dark:border-white p-8">
                            <h2 className="text-lg font-bold text-black dark:text-white mb-1">
                                {t('interview.token.finish_interview')}
                            </h2>
                            <p className="text-sm text-gray-400 mb-7">
                                {t('interview.token.send_recruiter')}
                            </p>

                            {/* Score */}
                            <div className="flex items-end gap-3 mb-6 pb-6
                                            border-b border-gray-100 dark:border-gray-900">
                                <span className="text-5xl font-bold text-black dark:text-white">
                                    {eval_.score}
                                </span>
                                <span className="text-sm text-gray-400 mb-1.5">
                                    / 100 — {t('interview.token.grade')}
                                </span>
                            </div>

                            {/* Summary */}
                            {eval_.summary && (
                                <p className="text-sm text-gray-600 dark:text-gray-400
                                              leading-relaxed mb-6">
                                    {eval_.summary}
                                </p>
                            )}

                            {/* Strengths + weaknesses */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-black dark:text-white
                                                  uppercase tracking-widest mb-3">
                                        {t('interview.token.strength')}
                                    </p>
                                    {eval_.strengths?.map((s, i) => (
                                        <div key={i}
                                             className="flex items-start gap-2 text-xs
                                                        text-gray-600 dark:text-gray-400 mb-2">
                                            <span className="mt-0.5 w-3 h-3 rounded-full border
                                                             border-black dark:border-white shrink-0" />
                                            {s}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-black dark:text-white
                                                  uppercase tracking-widest mb-3">
                                        {t('interview.token.weaknesses')}
                                    </p>
                                    {eval_.weaknesses?.map((s, i) => (
                                        <div key={i}
                                             className="flex items-start gap-2 text-xs
                                                        text-gray-600 dark:text-gray-400 mb-2">
                                            <span className="mt-0.5 shrink-0 text-gray-400">→</span>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input */}
            {phase === 'active' && (
                <div className="border-t border-gray-100 dark:border-gray-900
                                px-4 py-4 bg-white dark:bg-black">
                    <div className="max-w-2xl mx-auto flex gap-3 items-end">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    send()
                                }
                            }}
                            placeholder={t('interview.token.type_message')}
                            rows={3}
                            disabled={sending}
                            className="flex-1 resize-none px-5 py-3.5 text-sm rounded-3xl
                                       border border-gray-300 dark:border-gray-700
                                       bg-white dark:bg-black text-black dark:text-white
                                       placeholder-gray-400
                                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                                       focus:border-transparent disabled:opacity-50 transition"
                        />
                        <button
                            onClick={send}
                            disabled={sending || !input.trim()}
                            className="flex-shrink-0 w-11 h-11 flex items-center justify-center
                                       bg-black dark:bg-white text-white dark:text-black
                                       rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                                       disabled:opacity-40 transition-all duration-200"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
