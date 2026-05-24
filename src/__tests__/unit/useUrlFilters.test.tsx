import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUrlFilters } from '@/hooks/useUrlFilters'

// Mock Next.js navigation
const mockReplace = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
    usePathname: () => '/en/vacancies',
    useSearchParams: () => mockSearchParams,
}))

const DEFAULTS = { search: '', status: '', page: 1 }

describe('useUrlFilters', () => {
    it('returns defaults when no URL params', () => {
        const { result } = renderHook(() => useUrlFilters(DEFAULTS))
        expect(result.current.filters).toEqual(DEFAULTS)
    })

    it('parses page as number', () => {
        const params = new URLSearchParams('page=3')
        vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(params)
        const { result } = renderHook(() => useUrlFilters(DEFAULTS))
        expect(result.current.filters.page).toBe(3)
    })

    it('falls back to default for NaN page', () => {
        const params = new URLSearchParams('page=abc')
        vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(params)
        const { result } = renderHook(() => useUrlFilters(DEFAULTS))
        expect(result.current.filters.page).toBe(1)
    })

    it('setFilter calls router.replace', () => {
        mockReplace.mockClear()
        const { result } = renderHook(() => useUrlFilters(DEFAULTS))
        act(() => {
            result.current.setFilter('status', 'draft')
        })
        expect(mockReplace).toHaveBeenCalledOnce()
        const call = mockReplace.mock.calls[0][0] as string
        expect(call).toContain('status=draft')
    })

    it('resetFilters navigates to bare pathname', () => {
        mockReplace.mockClear()
        const { result } = renderHook(() => useUrlFilters(DEFAULTS))
        act(() => {
            result.current.resetFilters()
        })
        expect(mockReplace).toHaveBeenCalledWith('/en/vacancies', { scroll: false })
    })
})
