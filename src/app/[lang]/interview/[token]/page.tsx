// app/interview/[token]/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function InterviewPage() {
    const { token } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<'idle' | 'active' | 'done'>('idle');>

}