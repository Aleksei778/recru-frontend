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
    source: CandidateSource
    experience_years: number
    education_level: CandidateEducationLevel
    skills: Skill[]
    workplaces: Workplace[]
    socials: Social[]
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
    candidateData: CandidateData
    interviews?: Interview[]
    created_at: string
}

export type WorkPlaceForm = {
    company_name: string,
    position: string,
    description: string
}

export type SocialForm = {
    type: string
    url: string
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
    questions: Question[]
    grade: number
    text_grade: string
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

export type InterviewStatus = 'pending' | 'generating_questions' | 'questions_review' |
    'synthesizing' | 'ready' | 'in_progress' | 'processing' |
    'evaluating' | 'evaluated' | 'closed'

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

export type EmailRecipient =
    | { recipient_type: 'candidate'; recipient: Candidate }
    | { recipient_type: 'user'; recipient: User }

export type Email = EmailRecipient & {
    id: number
    interview?: Interview
    sender?: User
    type: EmailType
    status: EmailStatus
    locale: Locale
    subject: string
    sent_at: string | null
}

export type EmailStatus = 'pending' | 'sent' | 'failed'

export type EmailType = 'interview_invite' | 'questions_ready' | 'results' | 'decision';

export type Locale = 'ru' | 'en'

export type InterviewDecision = 'approve'|'reject';

export interface Question {
    id: number,
    interview: Interview,
    number: number,
    text: string,
    answer: Answer|null,
}

export interface Answer {
    question: Question,
    text: string
}

export interface VoiceLog {
    subject: Answer|Question,
    audio_path: string,
}

export type Skill = {
    id: number
    name: string
    slug: string
    category: SkillCategory
}

export type SkillCategory =
    | 'frontend'
    | 'backend'
    | 'fullstack'
    | 'mobile'
    | 'devops'
    | 'database'
    | 'cloud'
    | 'testing'
    | 'architecture'
    | 'security'
    | 'ai_ml'
    | 'data'
    | 'analytics'
    | 'design'
    | 'product'
    | 'management'
    | 'soft'
    | 'other'
