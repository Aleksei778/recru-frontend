import type {
    User,
    UserRole,
    Vacancy,
    VacancyForm,
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
    Email,
    Question,
    InterviewDecision,
    Skill,
    UploadResumeResult,
    NextQuestionResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://recru.local:80/api';

function getApiBase(): string {
    if (typeof window === 'undefined') return API_BASE

    const host = window.location.hostname
    const centralDomain = process.env.NEXT_PUBLIC_CENTRAL_DOMAIN ?? 'recru.local'
    const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? '80'
    const port = apiPort !== '80' ? `:${apiPort}` : ''

    if (host !== centralDomain && host !== 'localhost') {
        return `${window.location.protocol}//${host}${port}/api`
    }

    return API_BASE
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
): Promise<T> {
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers as Record<string, string>),
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getApiBase()}${path}`, { ...options, headers })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new ApiError(res.status, err?.error ?? err?.message ?? 'Server Error', err)
    }

    const text = await res.text()
    return text ? JSON.parse(text) : ({} as T)
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
}

export const profile = {
    updateProfile: (updateProfileData: UpdateProfileData, token: string) =>
        request<{ user?: User }>('/profile/user/data', {
            method: 'PATCH',
            body: JSON.stringify(updateProfileData),
        }, token),

    updateTenant: (updateTenantData: UpdateTenantData, token: string) =>
        request<{ tenant?: Tenant }>('/profile/tenant', {
            method: 'PATCH',
            body: JSON.stringify(updateTenantData)
        }, token),

    updatePassword: (updateProfileData: UpdatePasswordData, token: string) =>
        request<{ message?: string }>('/profile/user/password', {
            method: 'PATCH',
            body: JSON.stringify(updateProfileData),
        }, token),
}

export const emails = {
    inbox: (token: string, page: number = 1) =>
        request<Paginated<Email>>(`/emails/inbox?page=${page}`, {}, token),

    sent: (token: string, page: number = 1) =>
        request<Paginated<Email>>(`/emails/sent?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Email>(`/emails/${id}`, {}, token),
}

export const vacancies = {
    list: (token: string, page: number = 1) =>
        request<Paginated<Vacancy>>(`/vacancies?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Vacancy>(`/vacancies/${id}`, {}, token),

    create: (data: VacancyForm, skill_ids: number[], token: string) =>
        request<Vacancy>('/vacancies', {
            method: 'POST',
            body: JSON.stringify({...data, skill_ids: skill_ids}),
        }, token),

    update: (id: number, data: Partial<VacancyForm>, skill_ids: number[], token: string) =>
        request<Vacancy>(`/vacancies/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({...data, skill_ids: skill_ids}),
        }, token),

    delete: (id: number, token: string) =>
        request<Vacancy>(`/vacancies/${id}`, { method: 'DELETE' }, token),
}

export const candidates = {
    list: (token: string, page: number = 1) =>
        request<Paginated<Candidate>>(`/candidates?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<Candidate>(`/candidates/${id}`, {}, token),

    create: (form: CandidateData, skill_ids: number[], token: string) =>
        request<Candidate>('/candidates', {
            method: 'POST',
            body: JSON.stringify({...form, skill_ids: skill_ids}),
        }, token),

    update: (id: number, data: Partial<CandidateData>, skill_ids: number[], token: string) =>
        request<Candidate>(`/candidates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({...data, skill_ids: skill_ids}),
        }, token),

    delete: (id: number, token: string) =>
        request<Candidate>(`/candidates/${id}`, { method: 'DELETE' }, token),

    search: (q: string, token: string) =>
        request<Candidate[]>(`/candidates/search?q=${encodeURIComponent(q)}`, {}, token),
}

export const skills = {
    search: (q: string, token: string) =>
        request<Skill[]>(`/skills/search?q=${encodeURIComponent(q)}`, {}, token),
}

export const resume = {
    file: (FormData: FormData, token: string) =>
        request<UploadResumeResult>('/resume/parse/file', {
            method: 'POST',
            body: FormData,
        }, token),

    text: (text: string, token: string) =>
        request<UploadResumeResult>('/resume/parse/string', {
            method: 'POST',
            body: JSON.stringify({ resume: text }),
        }, token),

    save: (resumeId: number, candidateId: number|undefined, mode: 'new'|'existing', token: string) =>
        request<Candidate>(`/resume/save`, {
            method: 'POST',
            body: JSON.stringify({
                resume_id: resumeId,
                candidate_id: candidateId,
                mode: mode,
            }),
        }, token)
}

export const operations = {
    status: (id: number, token: string) =>
        request<{ id: number, status: string, result: any }>(`/operations/${id}/status`, {}, token),
}

export const team = {
    list: (token: string) =>
        request<User[]>('/team', {}, token),

    invite: (data: { email: string; role: UserRole }, token: string) =>
        request<User>('/team/invite', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    updateRole: (id: number, role: UserRole, token: string) =>
        request<User>(`/team/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }, token),

    remove: (id: number, token: string) =>
        request<{ message: string }>(`/team/${id}`, { method: 'DELETE' }, token),
}

export const interviews = {
    list: (token: string, page = 1) =>
        request<Paginated<Interview>>(`/hr/interviews?page=${page}`, {}, token),

    get: (id: number, token: string) =>
        request<{ interview: Interview } | Interview>(`/hr/interviews/${id}`, {}, token)
            .then(r => ('interview' in r ? r.interview : r)),

    create: (data: { vacancy_id: number; candidate_id: number, questions_number: number }, token: string) =>
        request<{ interview: Interview; access_token: string; link: string }>('/hr/interviews', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    regenerateToken: (id: number, token: string) =>
        request<{ access_token: string; link: string }>(
            `/hr/interviews/${id}/regenerate`,
            { method: 'POST' },
            token,
        ),

    approveQuestions: (data: { questions: Question[] }, id: number, token: string) =>
        request<{ interview: Interview }>(`/hr/interviews/${id}/questions/approve`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token),

    close: (decision: InterviewDecision, id: number, token: string) =>
        request<{message: string}>(`/hr/interviews/${id}/close`, {
            method: 'POST',
            body: JSON.stringify({decision: decision})
        }, token),

    sendInvite: (id: number, token: string) =>
        request<{ message: string }>(`/emails/send/invitation`, {
            method: 'POST',
            body: JSON.stringify({interview_id: id})
        }, token),

    nextQuestion: (token: string) =>
        request<NextQuestionResponse>(`/candidate/interviews/${token}/questions/next`, {}),

    submitAnswer: (token: string, questionId: number, formData: FormData) =>
        request<{ status: string }>(`/candidate/interviews/${token}/questions/${questionId}/answer`, {
            method: 'POST',
            body:   formData,
        }),
}
