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
    Resume_parsing = 'resume_parsing',
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
    website: string | null
    industry: string | null
    domains: string[]
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

export interface CandidateData {
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
    grade: CandidateGrade
    education_level: CandidateEducationLevel
    skills: string[]
}

export interface Candidate {
    id: number
    tenant_id: number
    candidateData: CandidateData
    status: CandidateStatus
    added_by_id: number | null
    created_at: string
    updated_at: string
    interviews?: Interview[]
    added_by?: User
    tenant?: Tenant
}

export interface ParsedCandidate {
    candidateData: CandidateData
    summary: string
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
    status: InterviewStatus
    conversation: Message[]
    created_at: string
    updated_at: string
}

export interface InterviewSession {
    id: number
    status: InterviewStatus
    turn: number
    can_finish: boolean
    conversation: Message[]
    ai_evaluation: AiEvaluation | null
    vacancy: Vacancy
    candidate: Candidate
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

export interface UpdateProfileData {
    name: string,
    email: string,
    avatar: string | null,
}

export interface UpdateTenantData {
    name: string,
    website: string,
    industry: string,
}

export interface UpdatePasswordData {
    current_password: string,
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
    summary: string
    strengths: string[]
    weaknesses: string[]
    skills_assessment: string[]
    score: number
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export type ResumeParsingStage = 'upload' | 'parsing' | 'review' | 'saving' | 'done'

export interface Email {
    to: string;
    subject: string;
    body: string;
}

export type EmailStatus = 'sent' | 'draft' | 'failed'
