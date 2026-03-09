// app/interview/[token]/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Message, Phase } from "@/types"

export default function CandidateInterviewPage() {
    const { token } = useParams<{ token: string }>()

    const [info, setInfo] = useState<InterviewSession | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState<string>('')
    const [phase, setPhase] = useState<Phase>('loading')
    const [canFinish, setCanFinish] = useState<boolean>(false)

}
