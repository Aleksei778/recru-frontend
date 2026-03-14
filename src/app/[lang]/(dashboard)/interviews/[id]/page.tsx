// src/app/[lang]/(dashboard)/interviews/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { Interview } from "@/types"
import { ArrowLeftIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { interviews as api } from "@/lib/api";
import {useTranslation} from "@/hooks/useTranslation";

export default function InterviewDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { t } = useTranslation()

    const router = useRouter()

    const [data, setData] = useState<Interview | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!token) return

        api.get(parseInt(id), token).then(setData)
    }, [token, id]);

    const copyLink = () => {
        if (!token) return
    }

    const regenerate = async () => {
        if (!token || !data) return

        const result = await api.regenerateToken(data.id, token)
        await navigator.clipboard.writeText(result.link)

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!data) return <div className="p-8 text-gray-400">Загрузка...</div>

    const _eval = data.ai_evaluation

    return (
        <div className="max-w-3xl mx-auto p-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeftIcon className="w-4 h-4" />
                {t('dashboard.interview.id.back')}
            </button>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {data?.candidate.last_name} {data?.candidate.first_name}
                    </h1>

                    
                </div>
            </div>
        </div>
    )
}
