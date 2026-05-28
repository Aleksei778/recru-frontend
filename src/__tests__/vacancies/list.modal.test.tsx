/**
 * CREATE/EDIT MODAL TESTS (P1)
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../handlers/vacancies'
import { renderWithProviders } from '../helpers/render'
import { vacancyFull, paginatedEmpty, makePaginated } from '../fixtures/vacancy'
import VacanciesPage from '@/app/[lang]/(dashboard)/vacancies/page'

const API_BASE = 'http://recru.local/api'

async function openCreateModal() {
    renderWithProviders(<VacanciesPage />)
    server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(paginatedEmpty)))
    await waitFor(() => expect(screen.getByText(/no vacancies/i)).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /create vacancy/i }))
    await waitFor(() => expect(screen.getByText(/new vacancy/i)).toBeInTheDocument())
}

describe('M1: Title is required — save button disabled when empty', () => {
    it('save button is disabled when title is empty', async () => {
        await openCreateModal()
        const saveBtn = screen.getByRole('button', { name: /^create$/i })
        expect(saveBtn).toBeDisabled()
    })

    it('save button enables when title is typed', async () => {
        await openCreateModal()
        await userEvent.type(screen.getByPlaceholderText(/senior frontend/i), 'My Vacancy')
        const saveBtn = screen.getByRole('button', { name: /^create$/i })
        expect(saveBtn).not.toBeDisabled()
    })
})

describe('M2: All form fields accept input', () => {
    it('can fill every field in the create form', async () => {
        await openCreateModal()

        await userEvent.type(screen.getByPlaceholderText(/senior frontend/i), 'Test Title')
        await userEvent.type(screen.getByPlaceholderText(/vacancy description/i), 'Some description')
        await userEvent.type(screen.getByPlaceholderText(/moscow/i), 'Saint Petersburg')

        // Select fields
        const employmentSelect = screen.getByDisplayValue(/full time/i) as HTMLSelectElement
        await userEvent.selectOptions(employmentSelect, 'part_time')
        expect(employmentSelect.value).toBe('part_time')

        const statusSelect = screen.getByDisplayValue(/draft/i) as HTMLSelectElement
        await userEvent.selectOptions(statusSelect, 'published')
        expect(statusSelect.value).toBe('published')

        // Number inputs
        await userEvent.type(screen.getByPlaceholderText(/salary from/i), '100000')
        await userEvent.type(screen.getByPlaceholderText(/salary to/i), '200000')
    })
})

describe('M7: Cancel resets form to empty defaults', () => {
    it('form is blank when create modal is reopened after cancel', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(paginatedEmpty)))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText(/no vacancies/i)).toBeInTheDocument())

        // Open, type, cancel
        await userEvent.click(screen.getByRole('button', { name: /create vacancy/i }))
        await userEvent.type(screen.getByPlaceholderText(/senior frontend/i), 'Temp Title')
        await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

        // Reopen
        await userEvent.click(screen.getByRole('button', { name: /create vacancy/i }))
        const titleInput = screen.getByPlaceholderText(/senior frontend/i) as HTMLInputElement
        expect(titleInput.value).toBe('')
    })
})

describe('M8: Edit modal pre-populates skills from vacancy', () => {
    it('shows skill count from the vacancy in skills input', async () => {
        server.use(http.get(`${API_BASE}/vacancies`, () => HttpResponse.json(makePaginated([vacancyFull]))))
        renderWithProviders(<VacanciesPage />)
        await waitFor(() => expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /edit/i }))
        await waitFor(() => expect(screen.getByText(/edit vacancy/i)).toBeInTheDocument())

        // Our mocked SkillsInput shows "{n} skills"
        expect(screen.getByText(`${vacancyFull.skills.length} skills`)).toBeInTheDocument()
    })
})
