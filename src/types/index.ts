export enum UserRole {
    Admin = 'admin',
    HR = 'hr',
}

export enum VacancyEmploymentType {
    Full_time = 'full_time',
    Part_time = 'part_time',
    Contract = 'contract',
    Internship = 'internship',
}

export enum VacancyStatus {
    Draft = 'draft',
    Published = 'published',
    Closed = 'closed',
}

export enum VacancyWorkMode {
    Office = 'office',
    Remote = 'remote',
    Hybrid = 'hybrid',
}

export enum CandidateEducationLevel {
    Secondary = 'secondary',
    Incomplete_higher = 'incomplete_higher',
    Bachelor = 'bachelor',
    Master = 'master',
    Specialist = 'specialist',
    Doctor = 'doctor',
}

export enum CandidateGrade {
    Junior = 'junior',
    Middle = 'middle',
    Senior = 'senior',
    Lead = 'lead',
}

export enum CandidateSource {
    HH = 'hh',
    Habr = 'habr',
    Social = 'Social',
    Email = 'email',
    Bulk_import = 'bulk_import',
}

export enum CandidateStatus {
    New = 'new',
    Screened = 'screened',
    Approved = 'approved',
    Rejected = 'rejected',
}

export interface Tenant {
    id: number
    name: string
    created_at: string
    updated_at: string
}

export interface User {
    id: number
    name: string
    email: string
    role: UserRole
    avatar: string | null
    settings: Record<string, unknown> | null
    email_verified_at: string | null
    created_at: string
    updated_at: string
    tenant?: Tenant
}

export interface Candidate {
    id: number
    tenant_id: number
    first_name: string
    last_name: string
    middle_name: string | null
    email: string | null
    phone: string | null
    resume_url: string | null
    linkedin_url: string | null
    github_url: string | null
    source: string | null
    status: CandidateStatus
    experience_years: number | null
    grade: string | null
    education_level: CandidateEducationLevel | null
    added_by_id: number | null
    created_at: string
    updated_at: string
    interviews?: Interview[]
    added_by?: User
    tenant?: Tenant
}

export interface CandidateForm {
    first_name: string
    last_name: string
    middle_name: string | null
    email: string
    phone: string
    resume_url: string
    linkedin_url: string | null
    github_url: string | null
    source: CandidateSource
    experience_years: number
    education_level: CandidateEducationLevel
}

export interface Vacancy {
    id: number
    tenant_id: number
    title: string
    required_skills: string[]
    description: string | null
    employment_type: VacancyEmploymentType
    work_mode: VacancyWorkMode
    salary_min: number | null
    salary_max: number | null
    salary_currency: string | null
    experience_years: number | null
    status: VacancyStatus
    location: string | null
    published_at: string | null
    closed_at: string | null
    created_by_id: number
    created_at: string
    updated_at: string
    tenant?: Tenant
    created_by?: User
}

export interface Interview {
    id: number
    candidate: Candidate
    vacancy: Vacancy
    ai_evaluation: AiEvaluation
    status: string
    created_at: string
    updated_at: string
}

export interface Paginated<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
}

export interface ResourceResponse<T> {
    data: T
}

export interface LoginData {
    email: string,
    password: string,
}

export interface RegisterData {
    subdomain: string,
    company: string,
    email: string,
    password: string,
    password_confirmation: string,
}

export interface AuthContext {
    user: User | null,
    token: string | null,
    tenant: Tenant | null,
    login: (loginData: LoginData) => Promise<void>
    register: (registerData: RegisterData) => Promise<void>
    logout: () => void
    loading: boolean
}

export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'cancel'

export type RecommendationType = 'hire' | 'maybe' | 'reject'

export type Phase = 'loading' | 'ready' | 'active' | 'finishing' | 'done' | 'error'

export interface AiEvaluation {
    recommendation: RecommendationType
    score: number
    summary: string
    strengths: string[]
    weaknesses: string[]
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}
