'use client'

interface Option {
    value: string
    label: string
}

interface Props {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder: string
}

export function SelectFilter({ value, onChange, options, placeholder }: Props) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-black
                           border border-gray-300 dark:border-gray-700 rounded-full
                           text-gray-900 dark:text-white text-sm appearance-none
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                           focus:border-transparent transition cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>
    )
}
