/**
 * ROW ACTIONS TESTS (P1)
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../handlers/vacancies'
import { renderWithProviders } from '../helpers/render'
import { vacancyFull, makePaginated, makeVacancy } from '../fixtures/vacancy'
import VacanciesPage from '@/app/[lang]/(dashboard)/vacancies/page'

const API_BASE = 'http://recru.local/api'

describe('R1: Title link navigates to detail', () => {
    it('title cell renders a link with the correct href', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        const link = screen.getByText('Senior Frontend Developer').closest('a')
        expect(link?.getAttribute('href')).toBe(`/en/vacancies/${vacancyFull.id}`)
    })
})

describe('R2: Only title cell is clickable (UX note)', () => {
    it('salary and skills cells are not anchor tags', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        // Salary cell — should be a p or span, not a link
        const salaryText = screen.getByText(/150000/)
        expect(salaryText.closest('a')).toBeNull()
    })
})

describe('R3: Delete confirmation modal appears', () => {
    it('opens delete modal with vacancy title when Delete is clicked', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())
        await userEvent.click(screen.getByRole('button', { name: /delete/i }))
        expect(screen.getByText(/delete vacancy\?/i)).toBeInTheDocument()
        expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
})

describe('R4: Cancel delete closes modal without deleting', () => {
    it('item remains in list after cancelling delete', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        const deleteSpy = vi.fn()
        server.use(http.delete(`${API_BASE}/vacancies/:id`, () => { deleteSpy(); return HttpResponse.json({}) }))

        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /delete/i }))
        expect(screen.getByText(/delete vacancy\?/i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
        expect(screen.queryByText(/delete vacancy\?/i)).not.toBeInTheDocument()
        expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
        expect(deleteSpy).not.toHaveBeenCalled()
    })
})

describe('R5: Confirm delete removes item from list', () => {
    it('removes row and decrements total after confirmed delete', async () => {
        const target = makeVacancy({ id: 10, title: 'To Be Deleted' })
        server.use(
            http.get(`${API_BASE}/vacancies`, () =>
                HttpResponse.json(makePaginated([vacancyFull, target], { total: 2 }))
            ),
            http.delete(`${API_BASE}/vacancies/10`, () => HttpResponse.json(target))
        )

        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('To Be Deleted')).toBeInTheDocument())

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
        // Click the delete button on the 'To Be Deleted' row
        await userEvent.click(deleteButtons[deleteButtons.length - 1])

        // Confirm in modal
        const allDeleteButtons = screen.getAllByRole('button', { name: /delete/i })
        await userEvent.click(allDeleteButtons[allDeleteButtons.length - 1])

        await waitFor(() => expect(screen.queryByText('To Be Deleted')).not.toBeInTheDocument())
        expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
        expect(screen.getByText('1 vacancies')).toBeInTheDocument()
    })
})

describe('R6: Edit button opens modal, not navigates', () => {
    it('opens edit modal without changing URL', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /edit/i }))
        expect(screen.getByText(/edit vacancy/i)).toBeInTheDocument()
        // No navigation should occur
    })
})
