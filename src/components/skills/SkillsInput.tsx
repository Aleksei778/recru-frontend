// src/components/skills/SkillsInput.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, Reorder } from 'framer-motion'
import { X, SearchIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { skills as skillsApi } from '@/lib/api'
import type { Skill } from '@/types'

type Props = {
    value?: Skill[]
    onChange?: (skills: Skill[]) => void
}

export default function SkillsInput({ value = [], onChange }: Props) {
    const { token } = useAuth()

    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<Skill[]>(value)
    const [suggestions, setSuggestions] = useState<Skill[]>([])
    const [loading, setLoading] = useState(false)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const wrapperRef  = useRef<HTMLDivElement>(null)

    useEffect(() => { setSelected(value) }, [value])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setSuggestions([])
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([])
            return
        }

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            if (!token) return
            setLoading(true)
            try {
                const res = await skillsApi.search(query, token)
                const selectedSlugs = new Set(selected.map(s => s.slug))
                setSuggestions(res.filter((s: Skill) => !selectedSlugs.has(s.slug)))
            } finally {
                setLoading(false)
            }
        }, 300)
    }, [query, token, selected])

    const update = (newList: Skill[]) => {
        setSelected(newList)
        onChange?.(newList)
    }

    const add = (skill: Skill) => {
        update([...selected, skill])
        setQuery('')
        setSuggestions([])
    }

    const remove = (slug: string) => {
        update(selected.filter(s => s.slug !== slug))
    }

    return (
        <div ref={wrapperRef} className="space-y-3">

            <Reorder.Group<Skill>
                axis="x"
                values={selected}
                onReorder={update}
                className="flex flex-wrap gap-2"
            >
                {selected.map(skill => (
                    <Reorder.Item<Skill>
                        key={skill.slug}
                        value={skill}
                        whileDrag={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full
                            bg-black text-white dark:bg-white dark:text-black
                            cursor-grab active:cursor-grabbing shadow-sm"
                    >
                        {skill.name}
                        <button type="button" onClick={() => remove(skill.slug)}>
                            <X className="w-3 h-3 opacity-70 hover:opacity-100" />
                        </button>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2
                    w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск навыков..."
                    className="w-full pl-9 pr-4 py-3 rounded-full border text-sm
                        bg-white dark:bg-black border-gray-300 dark:border-gray-700
                        text-gray-900 dark:text-white placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                        focus:border-transparent transition"
                />

                {query && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 mt-2 w-full bg-white dark:bg-black
                            border border-gray-200 dark:border-gray-800
                            rounded-2xl shadow-lg overflow-hidden"
                    >
                        {loading ? (
                            <div className="px-4 py-3 text-xs text-gray-400">Поиск...</div>
                        ) : suggestions.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-400">Ничего не найдено</div>
                        ) : (
                            suggestions.slice(0, 8).map(skill => (
                                <div
                                    key={skill.slug}
                                    onClick={() => add(skill)}
                                    className="px-4 py-3 text-sm cursor-pointer flex justify-between
                                        hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors"
                                >
                                    <span className="text-black dark:text-white">{skill.name}</span>
                                    {skill.category && (
                                        <span className="text-xs text-gray-400">{skill.category.name}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
