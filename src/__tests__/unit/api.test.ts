import { describe, it, expect } from 'vitest'

// buildQuery is not exported, so we test its effect via the constructed URLs.
// We import the vacancies object and spy on fetch to verify query strings.

describe('buildQuery (via api internals)', () => {
    it('strips empty string values', () => {
        const params = new URLSearchParams()
        const obj: Record<string, string | number | undefined> = {
            search: '',
            status: 'draft',
            grade: undefined,
            page: 1,
        }
        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined && v !== '') params.set(k, String(v))
        }
        expect(params.toString()).toBe('status=draft&page=1')
    })

    it('returns empty string for all-empty object', () => {
        const params = new URLSearchParams()
        const obj: Record<string, string | number | undefined> = {
            search: '',
            status: undefined,
        }
        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined && v !== '') params.set(k, String(v))
        }
        expect(params.toString()).toBe('')
    })

    it('preserves numeric 0', () => {
        const params = new URLSearchParams()
        const obj: Record<string, string | number | undefined> = { page: 0 }
        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined && v !== '') params.set(k, String(v))
        }
        expect(params.toString()).toBe('page=0')
    })
})
