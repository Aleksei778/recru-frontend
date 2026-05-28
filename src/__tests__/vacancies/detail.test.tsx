/**
 * DETAIL PAGE TESTS (P1)
 * Requires BUG-1 fix: vacancies.get() must unwrap correctly.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../handlers/vacancies'
import { renderWithProviders } from '../helpers/render'
import { vacancyFull, vacancyMinimal } from '../fixtures/vacancy'
import VacancyDetailPage from '@/app/[lang]/(dashboard)/vacancies/[id]/page'

const API_BASE = 'http://recru.local/api'

// Override useParams for detail page tests — default id=1 (vacancyFull)
const mockPush = vi.fn()
beforeEach(() => {
    mockPush.mockClear()
    vi.mocked(require('next/navigation').useParams).mockReturnValue({ id: String(vacancyFull.id), lang: 'en' })
    vi.mocked(require('next/navigation').useRouter).mockReturnValue({ push: mockPush, replace: vi.fn() })
})

describe('D1: Enter edit mode', () => {
    it('shows save/cancel buttons and hides edit button when editing', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
    })

    it('shows input fields in edit mode', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        const titleInput = screen.getByPlaceholderText(/senior frontend/i) as HTMLInputElement
        expect(titleInput.value).toBe('Senior Frontend Developer')
    })
})

describe('D2: Title validation blocks save', () => {
    it('disables save button when title is cleared', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))

        const titleInput = screen.getByPlaceholderText(/senior frontend/i)
        await userEvent.clear(titleInput)
        expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
    })
})

describe('D3: Save changes updates the detail view', () => {
    it('exits edit mode and shows updated title', async () => {
        server.use(
            http.patch(`${API_BASE}/vacancies/${vacancyFull.id}`, async ({ request }) => {
                const body = await request.json() as Record<string, unknown>
                return HttpResponse.json({ ...vacancyFull, title: String(body.title) })
            })
        )

        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))

        const titleInput = screen.getByPlaceholderText(/senior frontend/i)
        await userEvent.clear(titleInput)
        await userEvent.type(titleInput, 'Updated Title')
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

        await waitFor(() => expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument())
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Updated Title')
    })
})

describe('D4: Save failure shows error message', () => {
    it('renders error text and stays in edit mode on 422', async () => {
        server.use(
            http.patch(`${API_BASE}/vacancies/${vacancyFull.id}`, () =>
                HttpResponse.json({ error: 'Validation failed' }, { status: 422 })
            )
        )

        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

        await waitFor(() => expect(screen.getByText(/validation failed/i)).toBeInTheDocument())
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })
})

describe('D5: Cancel discards changes', () => {
    it('shows original title after cancel without API call', async () => {
        const patchSpy = vi.fn()
        server.use(http.patch(`${API_BASE}/vacancies/:id`, () => { patchSpy(); return HttpResponse.json(vacancyFull) }))

        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))

        const titleInput = screen.getByPlaceholderText(/senior frontend/i)
        await userEvent.clear(titleInput)
        await userEvent.type(titleInput, 'Temporary Title')

        await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
        expect(patchSpy).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Senior Frontend Developer')
    })
})

describe('D6: Skills card shows placeholder when vacancy has 0 skills (BUG-6 fix)', () => {
    beforeEach(() => {
        vi.mocked(require('next/navigation').useParams).mockReturnValue({ id: String(vacancyMinimal.id), lang: 'en' })
        server.use(
            http.get(`${API_BASE}/vacancies/${vacancyMinimal.id}`, () => HttpResponse.json(vacancyMinimal))
        )
    })

    it('renders skills card with "no skills" placeholder in view mode', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
        expect(screen.getByText(/required skills/i)).toBeInTheDocument()
        expect(screen.getByText(/no skills specified/i)).toBeInTheDocument()
    })
})

describe('D7: Skills card visible in edit mode when 0 skills', () => {
    beforeEach(() => {
        vi.mocked(require('next/navigation').useParams).mockReturnValue({ id: String(vacancyMinimal.id), lang: 'en' })
        server.use(
            http.get(`${API_BASE}/vacancies/${vacancyMinimal.id}`, () => HttpResponse.json(vacancyMinimal))
        )
    })

    it('shows SkillsInput in edit mode even with empty skills', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Intern')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        expect(screen.getByTestId('skills-input')).toBeInTheDocument()
    })
})

describe('D8: Metadata card hidden in edit mode', () => {
    it('hides metadata card when editing', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText(/details/i)).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        expect(screen.queryByText(/^details$/i)).not.toBeInTheDocument()
    })
})

describe('D9: Location hidden in header during edit', () => {
    it('hides location paragraph under h1 when editing', async () => {
        renderWithProviders(<VacancyDetailPage />)
        // In view mode, location is visible under the title
        await waitFor(() => expect(screen.getByText('Moscow')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        // The location paragraph (flex row with MapPin icon, text-gray-400) should be gone from header
        // It may still appear in the location form input
        const locationParagraphs = Array.from(document.querySelectorAll('p.text-gray-400')).filter(
            p => p.textContent?.includes('Moscow')
        )
        expect(locationParagraphs).toHaveLength(0)
    })
})

describe('D10: Back navigation (BUG-7 guard)', () => {
    it('navigates to vacancies list when back is clicked in view mode', async () => {
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /back to vacancies/i }))
        expect(mockPush).toHaveBeenCalledWith('/en/vacancies')
    })

    it('shows confirm dialog when back is clicked in edit mode', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        await userEvent.click(screen.getByRole('button', { name: /back to vacancies/i }))

        expect(confirmSpy).toHaveBeenCalled()
        expect(mockPush).not.toHaveBeenCalled()
        confirmSpy.mockRestore()
    })

    it('navigates if user confirms leaving with unsaved changes', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
        await userEvent.click(screen.getByRole('button', { name: /back to vacancies/i }))

        expect(mockPush).toHaveBeenCalledWith('/en/vacancies')
        vi.restoreAllMocks()
    })
})

describe('S5/S6: Detail page loading and 404', () => {
    it('shows loading skeleton then renders vacancy', async () => {
        renderWithProviders(<VacancyDetailPage />)
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBeGreaterThan(0)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
    })

    it('shows not-found message for invalid ID', async () => {
        vi.mocked(require('next/navigation').useParams).mockReturnValue({ id: '9999', lang: 'en' })
        renderWithProviders(<VacancyDetailPage />)
        await waitFor(() => expect(screen.getByText(/vacancy not found/i)).toBeInTheDocument())
        expect(screen.getByRole('button', { name: /back to vacancies/i })).toBeInTheDocument()
    })
})
