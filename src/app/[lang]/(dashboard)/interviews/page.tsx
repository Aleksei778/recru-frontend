'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { interviews as api } from '@/lib/api'
import { Interview, Vacancy } from '@/lib/types'
import { ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon } from 'lucide-react'

const STATUS_CONFIG = {
    pending: { label: 'Ожидает', icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    in_progress: { label: 'В процессе', icon: PlayIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    completed: { label: 'Завершено', icon: CheckCircleIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    cancel: { label: 'Отменено', icon: XCircleIcon, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
}

const REC_CONFIG = {
    hire: { label: color: 'text-green-600' },
    maybe: 'text-yellow-600',
    reject: 'text-red-600',
}
