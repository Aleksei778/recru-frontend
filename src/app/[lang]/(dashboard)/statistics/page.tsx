// app/[lang]/(dashboard)/statistics/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import {
    vacancies as vacanciesApi,
    candidates as candidatesApi,
    interviews as interviewsApi,
} from '@/lib/api'
import type { Vacancy, Candidate, Interview, Paginated, CandidateGrade } from '@/types'
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'
import React from 'react'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const TOOLTIP_STYLE = {
    background: '#111827',
    border: 'none',
    borderRadius: 12,
    color: '#f9fafb',
    fontSize: 13,
}

async function fetchAll<T>(
    fetcher: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
    const first = await fetcher(1)
    const all = [...first.data]
    if (first.last_page > 1) {
        const rest = await Promise.all(
            Array.from({ length: first.last_page - 1 }, (_, i) => fetcher(i + 2))
        )
        rest.forEach(p => all.push(...p.data))
    }
    return all
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 p-6">
            <div className="text-3xl font-bold text-black dark:text-white mb-1">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-900 p-6">
            <h3 className="text-sm font-semibold text-black dark:text-white mb-5">{title}</h3>
            {children}
        </div>
    )
}

export default function StatisticsPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    const [loading, setLoading] = useState(true)
    const [allVacancies, setAllVacancies] = useState<Vacancy[]>([])
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([])
    const [allInterviews, setAllInterviews] = useState<Interview[]>([])

    useEffect(() => {
        if (!token) return
        Promise.all([
            fetchAll(p => vacanciesApi.list(token, p)),
            fetchAll(p => candidatesApi.list(token, p)),
            fetchAll(p => interviewsApi.list(token, p)),
        ]).then(([v, c, i]) => {
            setAllVacancies(v)
            setAllCandidates(c)
            setAllInterviews(i)
            setLoading(false)
        })
    }, [token])

    const vacancyStatusData = Object.entries(
        allVacancies.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] ?? 0) + 1
            return acc
        }, {} as Record<string, number>)
    ).map(([key, value], i) => ({
        name: t(`dashboard.vacancies.status.${key}`),
        value,
        fill: COLORS[i % COLORS.length],
    }))

    const gradeOrder: CandidateGrade[] = ['junior', 'middle', 'senior', 'lead']
    const candidateGradeData = gradeOrder
        .map(grade => ({
            name: grade.charAt(0).toUpperCase() + grade.slice(1),
            value: allCandidates.filter(c => c.grade === grade).length,
        }))
        .filter(d => d.value > 0)

    const sourceLabels: Record<string, string> = {
        hh: 'HH.ru', habr: 'Habr', social: 'Social',
        email: 'Email', resume_parsing: 'Resume', bulk_import: 'Import',
    }
    const candidateSourceData = Object.entries(
        allCandidates.reduce((acc, c) => {
            if (c.source) acc[c.source] = (acc[c.source] ?? 0) + 1
            return acc
        }, {} as Record<string, number>)
    ).map(([key, value]) => ({ name: sourceLabels[key] ?? key, value }))
        .sort((a, b) => b.value - a.value)

    const interviewStatusData = Object.entries(
        allInterviews.reduce((acc, i) => {
            acc[i.status] = (acc[i.status] ?? 0) + 1
            return acc
        }, {} as Record<string, number>)
    ).map(([key, value]) => ({ name: t(`dashboard.interviews.status.${key}`), value }))

    const evaluatedInterviews = allInterviews.filter(
        i => (i.status === 'evaluated' || i.status === 'closed') && i.grade > 0
    )
    const avgGrade = evaluatedInterviews.length > 0
        ? (evaluatedInterviews.reduce((s, i) => s + i.grade, 0) / evaluatedInterviews.length).toFixed(1)
        : null

    const gradeRanges = [
        { name: '1–4', min: 1, max: 4 },
        { name: '5–6', min: 5, max: 6 },
        { name: '7–8', min: 7, max: 8 },
        { name: '9–10', min: 9, max: 10 },
    ]
    const gradeDistData = gradeRanges.map(r => ({
        name: r.name,
        value: evaluatedInterviews.filter(i => i.grade >= r.min && i.grade <= r.max).length,
    }))

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
                <div className="mb-10">
                    <div className="h-8 w-44 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse mb-2" />
                    <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                    {t('dashboard.statistics.heading')}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {t('dashboard.statistics.subheading')}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label={t('dashboard.statistics.cards.vacancies')} value={allVacancies.length} />
                <StatCard label={t('dashboard.statistics.cards.candidates')} value={allCandidates.length} />
                <StatCard label={t('dashboard.statistics.cards.interviews')} value={allInterviews.length} />
                <StatCard
                    label={t('dashboard.statistics.cards.avgGrade')}
                    value={avgGrade ? `${avgGrade}/10` : '—'}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {vacancyStatusData.length > 0 && (
                    <ChartCard title={t('dashboard.statistics.charts.vacanciesByStatus')}>
                        <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                                <Pie
                                    data={vacancyStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {vacancyStatusData.map((d) => (
                                <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                                    {d.name} — <span className="text-black dark:text-white font-medium">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                )}

                {candidateGradeData.length > 0 && (
                    <ChartCard title={t('dashboard.statistics.charts.candidatesByGrade')}>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={candidateGradeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" name={t('dashboard.statistics.cards.candidates')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {candidateSourceData.length > 0 && (
                    <ChartCard title={t('dashboard.statistics.charts.candidatesBySource')}>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={candidateSourceData} layout="vertical" margin={{ top: 4, right: 8, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={65} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#22c55e" name={t('dashboard.statistics.cards.candidates')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {interviewStatusData.length > 0 && (
                    <ChartCard title={t('dashboard.statistics.charts.interviewsByStatus')}>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={interviewStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    axisLine={false} tickLine={false}
                                    angle={-30} textAnchor="end"
                                    interval={0}
                                />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#f59e0b" name={t('dashboard.statistics.cards.interviews')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                {evaluatedInterviews.length > 0 && (
                    <ChartCard title={t('dashboard.statistics.charts.gradeDistribution')}>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={gradeDistData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#8b5cf6" name={t('dashboard.statistics.cards.interviews')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

            </div>
        </div>
    )
}
