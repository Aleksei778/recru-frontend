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
}
