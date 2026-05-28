import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './handlers/vacancies'

// ── MSW ──────────────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── Next.js navigation ────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    usePathname: vi.fn(() => '/en/vacancies'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useParams: vi.fn(() => ({ id: '1', lang: 'en' })),
}))

vi.mock('next/link', () => ({
    default: ({ href, children, className, ...rest }: { href: string; children: unknown; className?: string; [k: string]: unknown }) => {
        const React = require('react')
        return React.createElement('a', { href, className, ...rest }, children)
    },
}))

// ── Auth / Language contexts ──────────────────────────────────────────────────
vi.mock('@/contexts/auth-context', () => ({
    useAuth: () => ({
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'hr', email_verified_at: null, created_at: '', updated_at: '' },
        tenant: { id: 1, name: 'Acme Corp', website: null, industry: null, subdomain: 'acme', created_at: '', updated_at: '' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
    }),
}))

vi.mock('@/contexts/language-context', () => ({
    useLanguage: () => ({ language: 'en', toggleLanguage: vi.fn(), setLanguage: vi.fn() }),
}))

// ── SkillsInput (avoids framer-motion and async complexity in unit tests) ─────
vi.mock('@/components/skills/SkillsInput', () => {
    const React = require('react')
    return {
        default: ({ value, onChange }: { value: { id: number; name: string }[]; onChange: (s: unknown[]) => void }) =>
            React.createElement('div', { 'data-testid': 'skills-input' },
                React.createElement('span', { 'data-testid': 'skills-count' }, `${value.length} skills`),
                React.createElement('button', { onClick: () => onChange([]) }, 'clear skills'),
            ),
    }
})
