'use client'

import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface SortOption {
    value: string
    label: string
}

interface Props {
    sort: string
    order: string
    options: SortOption[]
    label: string
    onSortChange: (sort: string) => void
    onOrderToggle: () => void
}

export function SortControl({ sort, order, options, label, onSortChange, onOrderToggle }: Props) {
    const effectiveOrder = order === 'asc' ? 'asc' : 'desc'

    return (
        <div className="flex items-center gap-1.5">
            <div className="relative">
                <select
                    value={sort}
                    onChange={e => onSortChange(e.target.value)}
                    className="pl-4 pr-8 py-2.5 bg-white dark:bg-black
                               border border-gray-300 dark:border-gray-700 rounded-full
                               text-gray-900 dark:text-white text-sm appearance-none
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                               focus:border-transparent transition cursor-pointer"
                >
                    <option value="" disabled>{label}</option>
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            {sort && (
                <button
                    onClick={onOrderToggle}
                    className="p-2.5 bg-white dark:bg-black border border-gray-300 dark:border-gray-700
                               rounded-full text-gray-500 hover:text-black dark:hover:text-white
                               hover:border-black dark:hover:border-white transition"
                >
                    {effectiveOrder === 'asc'
                        ? <ArrowUpIcon className="w-3.5 h-3.5" />
                        : <ArrowDownIcon className="w-3.5 h-3.5" />
                    }
                </button>
            )}
        </div>
    )
}
