import type { Vacancy, Paginated } from '@/types'

const skill1 = { id: 1, name: 'React', slug: 'react', aliases: [], category: { id: 1, name: 'Frontend', slug: 'frontend' } }
const skill2 = { id: 2, name: 'TypeScript', slug: 'typescript', aliases: [], category: { id: 1, name: 'Frontend', slug: 'frontend' } }
const skill3 = { id: 3, name: 'Node.js', slug: 'nodejs', aliases: [], category: { id: 2, name: 'Backend', slug: 'backend' } }
const skill4 = { id: 4, name: 'PostgreSQL', slug: 'postgresql', aliases: [], category: { id: 3, name: 'Database', slug: 'database' } }
const skill5 = { id: 5, name: 'Docker', slug: 'docker', aliases: [], category: { id: 4, name: 'DevOps', slug: 'devops' } }

export const vacancyFull: Vacancy = {
    id: 1,
    tenant_id: 1,
    title: 'Senior Frontend Developer',
    description: 'We are looking for a talented frontend developer with deep React expertise.',
    employment_type: 'full_time',
    work_mode: 'remote',
    salary_min: 150000,
    salary_max: 250000,
    salary_currency: 'RUB',
    experience_years: 3,
    status: 'published',
    location: 'Moscow',
    grade: 'senior',
    education_level: 'bachelor',
    skills: [skill1, skill2, skill3, skill4, skill5],
    published_at: '2024-01-15T10:00:00Z',
    closed_at: null,
    created_by_id: 1,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
}

export const vacancyMinimal: Vacancy = {
    id: 2,
    tenant_id: 1,
    title: 'Intern',
    description: null,
    employment_type: 'internship',
    work_mode: 'office',
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    experience_years: null,
    status: 'draft',
    location: null,
    grade: null,
    education_level: null,
    skills: [],
    published_at: null,
    closed_at: null,
    created_by_id: 1,
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
}

export const vacancySalaryZero: Vacancy = {
    ...vacancyMinimal,
    id: 3,
    title: 'Entry Level Dev',
    salary_min: 0,
    salary_max: 50000,
    salary_currency: 'RUB',
}

export const vacancyThreeSkills: Vacancy = {
    ...vacancyMinimal,
    id: 4,
    title: 'Mid Developer',
    skills: [skill1, skill2, skill3],
}

export const vacancyFiveSkills: Vacancy = {
    ...vacancyFull,
    id: 5,
    title: 'Full Stack Dev',
    skills: [skill1, skill2, skill3, skill4, skill5],
}

export const makeVacancy = (overrides: Partial<Vacancy>): Vacancy => ({
    ...vacancyMinimal,
    ...overrides,
})

export function makePaginated(items: Vacancy[], overrides: Partial<Omit<Paginated<Vacancy>, 'data'>> = {}): Paginated<Vacancy> {
    return {
        data: items,
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: items.length,
        from: items.length > 0 ? 1 : null,
        to: items.length > 0 ? items.length : null,
        ...overrides,
    }
}

export const paginatedPage1 = makePaginated(
    Array.from({ length: 15 }, (_, i) => makeVacancy({ id: i + 1, title: `Vacancy ${i + 1}` })),
    { current_page: 1, last_page: 3, total: 45, per_page: 15 },
)

export const paginatedPage2Single = makePaginated(
    [makeVacancy({ id: 16, title: 'Last on page 2' })],
    { current_page: 2, last_page: 2, total: 16, per_page: 15, from: 16, to: 16 },
)

export const paginatedEmpty = makePaginated([], { total: 0, from: null, to: null })

export const skillSearchResults = [skill1, skill2, skill3]
