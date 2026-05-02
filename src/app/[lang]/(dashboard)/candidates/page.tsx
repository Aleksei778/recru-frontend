// src/app/[lang]/(dashboard)/candidates/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { candidates as cApi, interviews as iApi, vacancies as vApi } from '@/lib/api'
import {
    Candidate, CandidateEducationLevel, CandidateSource,
    CandidateData, Vacancy, Skill
} from '@/types'
import { PlusIcon, LinkIcon, CheckIcon, XIcon, ChevronRightIcon } from 'lucide-react'
import SkillsInput from '@/components/skills/SkillsInput'

const EMPTY_FORM: CandidateData = {
    first_name: '', last_name: '', middle_name: null,
    email: '', phone: '', source: 'hh',
    experience_years: 0, education_level: 'bachelor',
    workplaces: [], socials: [], skills: [],
}

const inputClass = `
    w-full px-5 py-3 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

const selectClass = `
    w-full px-5 py-3 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white text-sm appearance-none
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

type ModalStep = null | 'basic' | 'details'

export default function CandidatePage() {
    const { token } = useAuth()

    const [items, setItems] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState<ModalStep>(null)
    const [form, setForm] = useState<CandidateData>(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [linkModal, setLinkModal] = useState<Candidate | null>(null)
    const [allVacancies, setAllVacancies] = useState<Vacancy[]>([])
    const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
    const [generatedLink, setGeneratedLink] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!token) return
        Promise.all([cApi.list(token), vApi.list(token)]).then(([c, v]) => {
            setItems(c.data)
            setAllVacancies(v.data)
            setLoading(false)
        })
    }, [token])

    const closeModals = () => {
        setStep(null)
        setForm(EMPTY_FORM)
        setLinkModal(null)
        setGeneratedLink('')
        setSelectedVacancy(null)
    }

    const createCandidate = async () => {
        if (!token) return
        setSaving(true)
        try {
            const candidate = await cApi.create(form, token)
            setItems(prev => [candidate, ...prev])
            closeModals()
        } finally {
            setSaving(false)
        }
    }

    const createInterview = async () => {
        if (!token || !linkModal || !selectedVacancy) return
        const result = await iApi.create({
            vacancy_id: selectedVacancy.id,
            candidate_id: linkModal.id,
        }, token)
        setGeneratedLink(result.link)
    }

    const copyLink = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(generatedLink)
            } else {
                const input = document.createElement('input')
                input.value = generatedLink
                input.style.position = 'fixed'
                input.style.opacity  = '0'
                document.body.appendChild(input)
                input.focus()
                input.select()
                document.execCommand('copy')
                document.body.removeChild(input)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const updateWorkplace = (idx: number, field: string, value: string) => {
        setForm(f => {
            const updated = [...f.workplaces]
            updated[idx] = { ...updated[idx], [field]: value }
            return { ...f, workplaces: updated }
        })
    }

    const updateSocial = (idx: number, field: string, value: string) => {
        setForm(f => {
            const updated = [...f.socials]
            updated[idx] = { ...updated[idx], [field]: value }
            return { ...f, socials: updated }
        })
    }

    const canProceed = form.first_name.trim() && form.last_name.trim()

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">

            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">Candidates</h1>
                    <p className="text-sm text-gray-400 mt-1">{items.length} candidates</p>
                </div>
                <button
                    onClick={() => setStep('basic')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add candidate
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">No candidates</p>
                    <button
                        onClick={() => setStep('basic')}
                        className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                    >
                        Add first candidate →
                    </button>
                </div>
            ) : (
                <div className="rounded-3xl border border-black dark:border-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-black dark:border-white">
                            {['Candidate', 'Contacts', 'Skills', 'Last position', 'Interview', ''].map(h => (
                                <th key={h} className="text-left px-6 py-4 text-xs font-semibold
                                        text-black dark:text-white uppercase tracking-widest">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((c, idx) => (
                            <tr key={c.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-950
                                    ${idx !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-black dark:text-white">
                                        {c.last_name} {c.first_name}
                                    </p>
                                    {c.middle_name && (
                                        <p className="text-xs text-gray-400 mt-0.5">{c.middle_name}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-gray-600 dark:text-gray-400">{c.email ?? '—'}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? '—'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(c.skills ?? []).slice(0, 3).map(s => (
                                            <span key={s.slug} className="text-xs border border-gray-200
                                                    dark:border-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                                {s.name}
                                            </span>
                                        ))}
                                        {(c.skills?.length ?? 0) > 3 && (
                                            <span className="text-xs text-gray-400">+{c.skills!.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {c.workplaces?.[0] ? (
                                        <div>
                                            <p className="text-sm text-black dark:text-white">
                                                {c.workplaces[0].position}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {c.workplaces[0].company_name}
                                            </p>
                                        </div>
                                    ) : '—'}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {c.interviews?.length ?? 0} interviews
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => { setLinkModal(c); setGeneratedLink(''); setSelectedVacancy(null) }}
                                        className="flex items-center gap-1.5 text-xs px-3.5 py-1.5
                                                border border-black dark:border-white rounded-full
                                                text-black dark:text-white hover:bg-black hover:text-white
                                                dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Interview
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal: Step 1 — basic info */}
            {step === 'basic' && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">New candidate</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-7">Step 1 of 2 — basic info</p>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={form.last_name}
                                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                                    placeholder="Last name *"
                                    className={inputClass}
                                />
                                <input
                                    value={form.first_name}
                                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                    placeholder="First name *"
                                    className={inputClass}
                                />
                            </div>

                            <input
                                value={form.middle_name ?? ''}
                                onChange={e => setForm(f => ({ ...f, middle_name: e.target.value || null }))}
                                placeholder="Middle name"
                                className={inputClass}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="Email"
                                className={inputClass}
                            />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="Phone"
                                className={inputClass}
                            />

                            <div className="border-t border-gray-100 dark:border-gray-900" />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.experience_years}
                                    onChange={e => setForm(f => ({ ...f, experience_years: +e.target.value }))}
                                    placeholder="Experience (years)"
                                    className={inputClass}
                                />
                                <div className="relative">
                                    <select
                                        value={form.source}
                                        onChange={e => setForm(f => ({ ...f, source: e.target.value as CandidateSource }))}
                                        className={selectClass}
                                    >
                                        {(['hh', 'habr', 'social', 'email', 'resume_parsing', 'bulk_import'] as CandidateSource[]).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={form.education_level}
                                    onChange={e => setForm(f => ({ ...f, education_level: e.target.value as CandidateEducationLevel }))}
                                    className={selectClass}
                                >
                                    <option value="">Education</option>
                                    {(['secondary', 'incomplete_higher', 'bachelor', 'master', 'specialist', 'doctor'] as CandidateEducationLevel[]).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-7">
                            <button
                                onClick={() => setStep('details')}
                                disabled={!canProceed}
                                className="w-full flex items-center justify-center gap-2 py-3.5
                                           bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full disabled:opacity-40
                                           disabled:cursor-not-allowed transition-all duration-200 text-sm"
                            >
                                Next — skills & experience
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={closeModals}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Step 2 — skills & experience */}
            {step === 'details' && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">Skills & experience</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-7">
                            Step 2 of 2 —{' '}
                            <button
                                onClick={() => setStep('basic')}
                                className="underline hover:text-black dark:hover:text-white transition"
                            >
                                go back
                            </button>
                        </p>

                        <div className="mb-6">
                            <p className="text-sm font-medium text-black dark:text-white mb-3">Skills</p>
                            <SkillsInput
                                value={form.skills}
                                onChange={(skills: Skill[]) => setForm(f => ({ ...f, skills }))}
                            />
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-900 mb-6" />

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-black dark:text-white">Work experience</p>
                                <button
                                    onClick={() => setForm(f => ({
                                        ...f,
                                        workplaces: [...f.workplaces, {
                                            company_name: '', position: '',
                                            description: '', started_at: '', ended_at: null,
                                        }]
                                    }))}
                                    className="text-xs text-black dark:text-white underline hover:opacity-60 transition"
                                >
                                    + add
                                </button>
                            </div>

                            {form.workplaces.length === 0 && (
                                <p className="text-xs text-gray-400">No work experience added</p>
                            )}

                            {form.workplaces.map((w, idx) => (
                                <div key={idx} className="space-y-2 mb-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-gray-400">Position {idx + 1}</p>
                                        <button
                                            onClick={() => setForm(f => ({
                                                ...f,
                                                workplaces: f.workplaces.filter((_, i) => i !== idx)
                                            }))}
                                            className="text-gray-300 hover:text-red-500 transition"
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input className={inputClass} placeholder="Company"
                                           value={w.company_name} onChange={e => updateWorkplace(idx, 'company_name', e.target.value)} />
                                    <input className={inputClass} placeholder="Position"
                                           value={w.position} onChange={e => updateWorkplace(idx, 'position', e.target.value)} />
                                    <input className={inputClass} placeholder="Description"
                                           value={w.description} onChange={e => updateWorkplace(idx, 'description', e.target.value)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className={inputClass} type="date"
                                               value={w.started_at} onChange={e => updateWorkplace(idx, 'started_at', e.target.value)} />
                                        <input className={inputClass} type="date"
                                               value={w.ended_at ?? ''} onChange={e => updateWorkplace(idx, 'ended_at', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-900 mb-6" />

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-black dark:text-white">Socials</p>
                                <button
                                    onClick={() => setForm(f => ({
                                        ...f,
                                        socials: [...f.socials, { name: '', url: '' }]
                                    }))}
                                    className="text-xs text-black dark:text-white underline hover:opacity-60 transition"
                                >
                                    + add
                                </button>
                            </div>

                            {form.socials.length === 0 && (
                                <p className="text-xs text-gray-400">No socials added</p>
                            )}

                            {form.socials.map((s, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-center">
                                    <input className={inputClass} placeholder="tg, linkedin..."
                                           value={s.name} onChange={e => updateSocial(idx, 'name', e.target.value)} />
                                    <input className={inputClass} placeholder="URL"
                                           value={s.url} onChange={e => updateSocial(idx, 'url', e.target.value)} />
                                    <button
                                        onClick={() => setForm(f => ({
                                            ...f,
                                            socials: f.socials.filter((_, i) => i !== idx)
                                        }))}
                                        className="text-gray-300 hover:text-red-500 transition shrink-0"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={createCandidate}
                                disabled={saving}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full disabled:opacity-40
                                           disabled:cursor-not-allowed transition-all duration-200 text-sm"
                            >
                                {saving ? 'Saving...' : 'Add candidate'}
                            </button>
                            <button
                                onClick={closeModals}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: create interview link */}
            {linkModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-black dark:text-white">Create interview</h2>
                            <button onClick={closeModals} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-7">
                            {linkModal.last_name} {linkModal.first_name}
                        </p>

                        {!generatedLink ? (
                            <>
                                <div className="relative mb-7">
                                    <select
                                        value={selectedVacancy?.id ?? ''}
                                        onChange={e => setSelectedVacancy(allVacancies.find(v => v.id === +e.target.value) ?? null)}
                                        className={selectClass}
                                    >
                                        <option value="">Select vacancy</option>
                                        {allVacancies
                                            .filter(v => v.status === 'published')
                                            .map(v => <option key={v.id} value={v.id}>{v.title}</option>)
                                        }
                                    </select>
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={createInterview}
                                        disabled={!selectedVacancy}
                                        className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                                   font-medium rounded-full disabled:opacity-40 transition-all text-sm"
                                    >
                                        Generate link
                                    </button>
                                    <button onClick={closeModals}
                                            className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                                   text-gray-500 rounded-full text-sm hover:border-black
                                                   hover:text-black dark:hover:border-white dark:hover:text-white transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-400 mb-4">Link ready — send it to the candidate:</p>
                                <div className="flex gap-2 mb-2">
                                    <input readOnly value={generatedLink}
                                           className="flex-1 px-4 py-3 text-xs bg-gray-50 dark:bg-gray-950 rounded-full
                                                   border border-gray-200 dark:border-gray-800 text-gray-600 focus:outline-none" />
                                    <button onClick={copyLink}
                                            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-medium
                                                   bg-black dark:bg-white text-white dark:text-black transition-all">
                                        {copied
                                            ? <><CheckIcon className="w-3.5 h-3.5" /> Copied</>
                                            : <><LinkIcon className="w-3.5 h-3.5" /> Copy</>
                                        }
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-7">Link is valid for 7 days.</p>
                                <button onClick={closeModals}
                                        className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                               text-gray-500 rounded-full text-sm hover:border-black
                                               hover:text-black dark:hover:border-white dark:hover:text-white transition-all">
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
