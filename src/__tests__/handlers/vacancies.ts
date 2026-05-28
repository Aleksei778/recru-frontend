import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vacancyFull, vacancyMinimal, makePaginated, skillSearchResults } from '../fixtures/vacancy'

const API_BASE = 'http://recru.local/api'

export const handlers = [
    http.get(`${API_BASE}/vacancies`, () => {
        return HttpResponse.json(makePaginated([vacancyFull, vacancyMinimal]))
    }),

    http.get(`${API_BASE}/vacancies/:id`, ({ params }) => {
        const id = Number(params.id)
        if (id === vacancyFull.id) return HttpResponse.json(vacancyFull)
        if (id === vacancyMinimal.id) return HttpResponse.json(vacancyMinimal)
        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    http.post(`${API_BASE}/vacancies`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ ...vacancyFull, id: 99, title: String(body.title ?? 'New Vacancy') }, { status: 201 })
    }),

    http.patch(`${API_BASE}/vacancies/:id`, async ({ params, request }) => {
        const id = Number(params.id)
        const body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ ...vacancyFull, id, ...body })
    }),

    http.delete(`${API_BASE}/vacancies/:id`, ({ params }) => {
        const id = Number(params.id)
        return HttpResponse.json({ ...vacancyFull, id })
    }),

    http.get(`${API_BASE}/skills/search`, () => {
        return HttpResponse.json(skillSearchResults)
    }),

    http.get(`${API_BASE}/auth/me`, () => {
        return HttpResponse.json({
            user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'hr', email_verified_at: null, created_at: '', updated_at: '' },
            tenant: { id: 1, name: 'Acme Corp', website: null, industry: null, subdomain: 'acme', created_at: '', updated_at: '' },
        })
    }),
]

export const server = setupServer(...handlers)
