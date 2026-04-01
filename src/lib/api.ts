import type {
    User,
    Vacancy,
    Candidate,
    CandidateData,
    Paginated,
    Interview,
    Tenant,
    LoginData,
    RegisterData,
    UpdateProfileData,
    UpdateTenantData,
    UpdatePasswordData,
    ParsedCandidate,
    AiEvaluation,
    InterviewSession, Email
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:80/api';

async function request<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {...options, headers})

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new ApiError(res.status, err?.error ?? err?.message ?? 'Server Error', err);
    }

    return res.json();
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: unknown,
    ) {
        super(message);
    }
}

export const auth = {
    login: (loginData: LoginData) =>
        request<{ token: string, user: User, tenant: Tenant }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        }),

    register: (registerData: RegisterData) =>
        request<{ token: string, user: User, tenant: Tenant }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        }),

    logout: (token: string) =>
        request<{ message: string }>('/auth/logout', { method: 'POST' }, token),

    me: (token: string) =>
        request<{ user: User, tenant: Tenant }>('/auth/me', {}, token),

    updateProfile: (updateProfileData: UpdateProfileData, token: string) =>
        request<{ user: User, tenant: Tenant }>('/auth/me', {
            method: 'PATCH',
            body: JSON.stringify(updateProfileData),
        }, token),

    updateTenant: (updateTenantData: UpdateTenantData, token: string) =>
        request<{ tenant: Tenant }>('/auth/tenant', {
            method: 'PATCH',
            body: JSON.stringify(updateTenantData)
        }, token),

    updatePassword: (updateProfileData: UpdatePasswordData, token: string) =>
        request<{ user: User, tenant: Tenant }>('/auth/me/password', {
            method: 'PATCH',
            body: JSON.stringify(updateProfileData),
        }, token),
}

export const emails = {
    list: (token: string, page: number = 1) =>
        request<Paginated<Email>>(`/emails?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Email>(`/emails/${id}`, {}, token),

    send: (token: string, data: Email) =>
        request<Email>('/email', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),
}

export const vacancies = {
    list: (token: string, page: number = 1) =>
        request<Paginated<Vacancy>>(`/vacancies?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Vacancy>(`/vacancies/${id}`, {}, token),

    create: (data: VacancyForm, token: string) =>
        request<Vacancy>('/vacancies', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (id: number, data: Partial<VacancyForm>, token: string) =>
        request<Vacancy>('/vacancies', {
            method: 'PATCH' ,
            body: JSON.stringify(data),
        }, token),

    delete: (id: number, token: string) =>
        request<Vacancy>(`/vacancies/${id}`, { method: 'DELETE' }, token),
}

export const candidates = {
    list: (token: string, page: number = 1) =>
        request<Paginated<Candidate>>(`/candidates?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Candidate>(`/candidates/${id}`, {}, token),

    create: (data: CandidateData, token: string) =>
        request<Candidate>('/candidates', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    update: (id: number, data: Partial<CandidateData>, token: string) =>
        request<Vacancy>('/candidates', {
            method: 'PATCH' ,
            body: JSON.stringify(data),
        }, token),

    delete: (id: number, token: string) =>
        request<Vacancy>(`/candidates/${id}`, { method: 'DELETE' }, token),
}

export const resume = {
    pdf: (FormData: FormData, token: string) =>
        request<{ parsedCandidate: ParsedCandidate }>('/resume/pdf', {
            method: 'POST',
            body: FormData,
        }, token),

    text: (text: string, token: string) =>
        request<{ parsedCandidate: ParsedCandidate }>('/resume/text', {
            method: 'POST',
            body: JSON.stringify({ resume_text: text }),
        }, token),
}

export const interviews = {
    list: (token: string, page = 1) =>
        request<Paginated<Interview>>(`/interviews/hr?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Interview>(`/interviews/hr${id}`, {}, token),

    create: (data: { vacancy_id: number; candidate_id: number }, token: string) =>
        request<{ interview: Interview; access_token: string; link: string }>('/interviews/hr', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    regenerateToken: (id: number, token: string) =>
        request<{ access_token: string; link: string }>(
            `/interviews/hr/${id}/regenerate-token`,
            { method: 'POST' },
            token,
        ),
}

export const session = {
    get: (token: string) =>
        request<InterviewSession>(`/interviews/candidate/${token}`),

    start: (token: string) =>
        request<{ message: string }>(`/interviews/candidate/${token}/start`, { method: 'POST' }),

    answer: (token: string, answer: string) =>
        request<{ message: string; turn: number; can_finish: boolean }>(`/interviews/candidate/${token}/answer`, {
            method: 'POST',
            body:   JSON.stringify({ answer }),
        }),

    finish: (token: string) =>
        request<AiEvaluation>(`/interviews/candidate${token}/finish`, { method: 'POST' }),
}
