export type UserRole = 'admin' | 'hr'

export type VacancyEmploymentType =
    'full_time' |
    'part_time' |
    'contract' |
    'internship'

export type VacancyStatus =
    'draft' |
    'published' |
    'closed'

export type VacancyWorkMode =
    'office' |
    'remote' |
    'hybrid'

export type CandidateEducationLevel =
    'secondary' |
    'incomplete_higher' |
    'bachelor' |
    'master' |
    'specialist' |
    'doctor'

export type CandidateGrade =
    'junior' |
    'middle' |
    'senior' |
    'lead'

export type CandidateSource =
    'hh' |
    'habr' |
    'social' |
    'email' |
    'resume_parsing' |
    'bulk_import'

export type CandidateStatus =
    'new' |
    'screened' |
    'approved' |
    'rejected'

export interface Tenant {
    id: number
    name: string
    website: string | null
    industry: string | null
    subdomain: string
    created_at: string
    updated_at: string
}

export interface User {
    id: number
    name: string
    email: string
    role: UserRole
    locale?: Locale
    email_verified_at: string | null
    created_at: string
    updated_at: string
    tenant?: Tenant
}

export interface Workplace {
    company_name: string
    position: string
    description: string
    started_at: string
    ended_at: string | null
}

export interface Social {
    name: string
    url: string
}

export interface Candidate {
    id: number
    tenant_id: number
    first_name: string
    last_name: string
    middle_name: string | null
    email: string | null
    phone: string | null
    source: CandidateSource | null
    grade: CandidateGrade | null
    status: string | null
    experience_years: number
    education_level: CandidateEducationLevel | null
    locale?: Locale
    interviews?: Interview[]
    workplaces?: Workplace[]
    socials?: Social[]
    skills?: Skill[]
}

export interface CandidateData {
    first_name: string
    last_name: string
    middle_name: string | null
    email: string
    phone: string
    source: CandidateSource
    grade: CandidateGrade | null
    experience_years: number
    education_level: CandidateEducationLevel
    locale: Locale
    workplaces: Workplace[]
    socials: Social[]
    skills: Skill[]
}

export type NextQuestionResponse = { is_completed: boolean; question: Question | null; audio_url: string | null; total_questions?: number }

export type InterviewStage = 'intro' | 'loading' | 'question' | 'recording' | 'submitting' | 'completed' | 'error'

export interface ParsedCandidate {
    candidateData: CandidateData
    text_grade: string
    grade: number
}

export interface UploadResumeResult {
    resume_id: number
    parse_operation_id: number
    evaluate_operation_id: number
}

export interface VacancyForm {
    title: string
    description: string | null
    employment_type: VacancyEmploymentType
    work_mode: VacancyWorkMode
    salary_min: number | null
    salary_max: number | null
    salary_currency: string | null
    experience_years: number | null
    status: VacancyStatus
    location: string | null
    grade: CandidateGrade | null
    education_level: CandidateEducationLevel | null
    skills: Skill[]
}

export interface Vacancy {
    id: number
    tenant_id: number
    title: string
    skills: Skill[]
    description: string | null
    employment_type: VacancyEmploymentType
    work_mode: VacancyWorkMode
    salary_min: number | null
    salary_max: number | null
    salary_currency: string | null
    experience_years: number | null
    status: VacancyStatus
    location: string | null
    grade: CandidateGrade | null
    education_level: CandidateEducationLevel | null
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
    questions: Question[]
    token: string
    grade: number
    text_grade: string
    status: InterviewStatus
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

export interface LoginData {
    email: string,
    password: string,
    password_confirmation: string,
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
    locale: Locale,
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
    setTokenAndUser: (token: string, user: User, tenant: Tenant) => void
    setUser: (user: User) => void
    setTenant: (tenant: Tenant) => void
}

export type InterviewStatus = 'pending' | 'generating_questions' | 'questions_review' |
    'synthesizing' | 'ready' | 'in_progress' | 'processing' |
    'evaluating' | 'evaluated' | 'closed'

export type RecommendationType = 'hire' | 'maybe' | 'reject'

export interface AiEvaluation {
    recommendation: RecommendationType
    summary: string
    strengths: string[]
    weaknesses: string[]
    skills_assessment: string[]
    score: number
}

export type EmailRecipient =
    | { recipient_type: 'candidate'; recipient: Candidate }
    | { recipient_type: 'user'; recipient: User }

export type Email = EmailRecipient & {
    id: number
    interview?: Interview
    sender?: User
    type: EmailType
    locale: Locale
    subject: string
    body: string
    sent_at: string | null
}

export type EmailType = 'interview_invite' | 'questions_ready' | 'results' | 'decision';

export type Locale = 'ru' | 'en'

export type InterviewDecision = 'approve'|'reject';

export interface Question {
    id: number
    number: number,
    text: string,
    answer: Answer | null
}

export interface Answer {
    question: Question,
    text: string
}

export type Skill = {
    id: number
    name: string
    slug: string
    aliases: string[]
    category: SkillCategory
}

export type SkillCategory = {
    id: number
    name: string
    slug: string
}

export interface CandidateFilters {
    search?: string
    status?: string
    grade?: string
    source?: string
    sort?: string
    order?: string
    page?: number
}

export interface VacancyFilters {
    search?: string
    status?: string
    employment_type?: string
    work_mode?: string
    grade?: string
    sort?: string
    order?: string
    page?: number
}
