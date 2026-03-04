// src/app/[lang]/(dashboard)/candidates/page.tsx

'use client'

import { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/auth-context";
import { candidates as cApi, interviews as iApi, vacancies as vApi } from "@/lib/api";
import type { Candidate, Vacancy } from "@/lib/types";
import { PlusIcon, LinkIcon, CheckIcon } from "lucide-react";

export default function CandidatePage() {
    const { token } = useAuth()
    const [items, setItems] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({})
}
