'use client'

import { XIcon } from 'lucide-react'

interface Chip {
    key: string
    label: string
}

interface Props {
    chips: Chip[]
    clearLabel: string
    onRemove: (key: string) => void
    onClearAll: () => void
}

export function ActiveFilters({ chips, clearLabel, onRemove, onClearAll }: Props) {
    if (chips.length === 0) return null

    return (
        <div className="flex items-center gap-2 flex-wrap mb-4">
            {chips.map(chip => (
                <span
                    key={chip.key}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5
                               bg-gray-100 dark:bg-gray-900
                               text-gray-700 dark:text-gray-300 rounded-full"
                >
                    {chip.label}
                    <button
                        onClick={() => onRemove(chip.key)}
                        className="text-gray-400 hover:text-black dark:hover:text-white transition"
                    >
                        <XIcon className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <button
                onClick={onClearAll}
                className="text-xs text-gray-400 hover:text-black dark:hover:text-white
                           underline underline-offset-2 transition"
            >
                {clearLabel}
            </button>
        </div>
    )
}
