'use client'

import { useEffect, useRef, useState } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'

interface Props {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: Props) {
    const [local, setLocal] = useState(value)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setLocal(value)
    }, [value])

    const handleChange = (v: string) => {
        setLocal(v)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => onChange(v), 300)
    }

    const handleClear = () => {
        setLocal('')
        if (debounceRef.current) clearTimeout(debounceRef.current)
        onChange('')
    }

    return (
        <div className="relative flex-1 min-w-[200px] max-w-xs">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
                value={local}
                onChange={e => handleChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-black
                           border border-gray-300 dark:border-gray-700 rounded-full
                           text-gray-900 dark:text-white placeholder-gray-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                           focus:border-transparent transition"
            />
            {local && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-black dark:hover:text-white transition"
                >
                    <XIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
