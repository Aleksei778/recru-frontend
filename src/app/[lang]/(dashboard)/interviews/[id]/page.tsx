// src/app/[lang]/(dashboard)/interviews/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { Interview } from "@/types"
import { ArrowLeftIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { interviews as api } from "@/lib/api";

export default function InterviewDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()

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
        <div>
            
        </div>
    )
}
