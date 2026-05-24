'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

interface Props {
    currentPage: number
    lastPage: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, lastPage, onPageChange }: Props) {
    if (!lastPage || lastPage <= 1) return null

    const pages: (number | '...')[] = []

    if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) pages.push(i)
    } else {
        pages.push(1)
        if (currentPage > 3) pages.push('...')
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(lastPage - 1, currentPage + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        if (currentPage < lastPage - 2) pages.push('...')
        pages.push(lastPage)
    }

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full transition text-gray-300 dark:text-gray-700 disabled:cursor-not-allowed enabled:text-gray-500 enabled:hover:text-black enabled:dark:hover:text-white enabled:hover:bg-gray-100 enabled:dark:hover:bg-gray-900"
            >
                <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {pages.map((p, i) => {
                if (p === '...') {
                    return (
                        <span
                            key={`e${i}`}
                            className="inline-flex items-center justify-center w-8 h-8 text-sm text-gray-400"
                        >
                            …
                        </span>
                    )
                }
                const isActive = p === currentPage
                return (
                    <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={
                            isActive
                                ? 'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-black text-white dark:bg-white dark:text-black'
                                : 'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition'
                        }
                    >
                        {p}
                    </button>
                )
            })}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full transition text-gray-300 dark:text-gray-700 disabled:cursor-not-allowed enabled:text-gray-500 enabled:hover:text-black enabled:dark:hover:text-white enabled:hover:bg-gray-100 enabled:dark:hover:bg-gray-900"
            >
                <ChevronRightIcon className="w-4 h-4" />
            </button>
        </div>
    )
}
