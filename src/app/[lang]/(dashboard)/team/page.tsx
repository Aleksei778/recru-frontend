'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/language-context'
import { team as teamApi } from '@/lib/api'
import { User, UserRole } from '@/types'
import { PlusIcon, XIcon, ShieldIcon, UserIcon, Trash2Icon } from 'lucide-react'

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

export default function TeamPage() {
    const { token, user: me } = useAuth()
    const { t } = useTranslation()
    const { language } = useLanguage()

    const [members, setMembers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<UserRole>('hr')
    const [saving, setSaving] = useState(false)
    const [confirmRemove, setConfirmRemove] = useState<User | null>(null)
    const [removing, setRemoving] = useState(false)

    const isAdmin = me?.role === 'admin'

    useEffect(() => {
        if (!token) return
        teamApi.list(token).then(data => {
            setMembers(data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [token])

    const closeInvite = () => {
        setShowInvite(false)
        setInviteEmail('')
        setInviteRole('hr')
    }

    const invite = async () => {
        if (!token || !inviteEmail.trim()) return
        setSaving(true)
        try {
            const newMember = await teamApi.invite({ email: inviteEmail.trim(), role: inviteRole }, token)
            setMembers(prev => [...prev, newMember])
            closeInvite()
        } finally {
            setSaving(false)
        }
    }

    const changeRole = async (member: User, role: UserRole) => {
        if (!token) return
        const updated = await teamApi.updateRole(member.id, role, token)
        setMembers(prev => prev.map(m => m.id === member.id ? updated : m))
    }

    const removeMember = async () => {
        if (!token || !confirmRemove) return
        setRemoving(true)
        try {
            await teamApi.remove(confirmRemove.id, token)
            setMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
            setConfirmRemove(null)
        } finally {
            setRemoving(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">

            <div className="flex items-center justify-between mb-6 sm:mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">{t('dashboard.team.heading')}</h1>
                    <p className="text-sm text-gray-400 mt-1">{t('dashboard.team.total', { count: members.length })}</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-black dark:bg-white
                                   text-white dark:text-black text-sm font-medium rounded-full
                                   hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('dashboard.team.invite')}</span>
                    </button>
                )}
            </div>

            {!isAdmin && (
                <div className="mb-6 px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-800
                                text-sm text-gray-400">
                    {t('dashboard.team.adminOnly')}
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">{t('dashboard.team.empty')}</p>
                    {isAdmin && (
                        <button
                            onClick={() => setShowInvite(true)}
                            className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                        >
                            {t('dashboard.team.inviteFirst')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-3xl border border-black dark:border-white overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[580px]">
                        <thead>
                        <tr className="border-b border-black dark:border-white">
                            {[
                                t('dashboard.team.headers.member'),
                                t('dashboard.team.headers.email'),
                                t('dashboard.team.headers.role'),
                                t('dashboard.team.headers.joined'),
                                ...(isAdmin ? [''] : [])
                            ].map((h, i) => (
                                <th key={i} className="text-left px-6 py-4 text-xs font-semibold
                                        text-black dark:text-white uppercase tracking-widest">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {members.map((member, idx) => {
                            const isSelf = member.id === me?.id
                            return (
                                <tr key={member.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-950
                                        ${idx !== members.length - 1 ? 'border-b border-gray-100 dark:border-gray-900' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900
                                                            flex items-center justify-center shrink-0">
                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-black dark:text-white">
                                                    {member.first_name} {member.last_name}
                                                    {isSelf && (
                                                        <span className="ml-2 text-xs text-gray-400 font-normal">{t('dashboard.team.you')}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isAdmin && !isSelf ? (
                                            <div className="relative w-36">
                                                <select
                                                    value={member.role}
                                                    onChange={e => changeRole(member, e.target.value as UserRole)}
                                                    className="w-full pl-4 pr-7 py-1.5 text-xs rounded-full
                                                               border border-gray-200 dark:border-gray-800
                                                               bg-white dark:bg-black text-black dark:text-white
                                                               appearance-none focus:outline-none
                                                               focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                                                >
                                                    <option value="admin">{t('dashboard.team.roles.admin')}</option>
                                                    <option value="hr">{t('dashboard.team.roles.hr')}</option>
                                                </select>
                                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full
                                                ${member.role === 'admin'
                                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                                    : 'border border-gray-200 dark:border-gray-800 text-gray-500'}`}>
                                                {member.role === 'admin'
                                                    ? <ShieldIcon className="w-3 h-3" />
                                                    : <UserIcon className="w-3 h-3" />}
                                                {t(`dashboard.team.roles.${member.role}`)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {new Date(member.created_at).toLocaleDateString(language, {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            {!isSelf && (
                                                <button
                                                    onClick={() => setConfirmRemove(member)}
                                                    className="text-gray-300 hover:text-red-500 dark:text-gray-700
                                                               dark:hover:text-red-500 transition"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Invite modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-black dark:text-white">{t('dashboard.team.modal.title')}</h2>
                            <button onClick={closeInvite} className="text-gray-400 hover:text-black dark:hover:text-white transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-7">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="Email *"
                                className={inputClass}
                                onKeyDown={e => e.key === 'Enter' && invite()}
                            />
                            <div className="relative">
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as UserRole)}
                                    className={selectClass}
                                >
                                    <option value="hr">{t('dashboard.team.roles.hr')}</option>
                                    <option value="admin">{t('dashboard.team.roles.admin')}</option>
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={invite}
                                disabled={saving || !inviteEmail.trim()}
                                className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                                           font-medium rounded-full disabled:opacity-40
                                           disabled:cursor-not-allowed transition-all duration-200 text-sm"
                            >
                                {saving ? t('dashboard.team.modal.sending') : t('dashboard.team.modal.send')}
                            </button>
                            <button
                                onClick={closeInvite}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.team.modal.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm remove modal */}
            {confirmRemove && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-black rounded-3xl border border-black dark:border-white
                                    shadow-2xl w-full max-w-sm p-8">
                        <h2 className="text-xl font-bold text-black dark:text-white mb-2">{t('dashboard.team.remove.title')}</h2>
                        <p className="text-sm text-gray-400 mb-7">
                            {t('dashboard.team.remove.hint', { name: `${confirmRemove.first_name} ${confirmRemove.last_name}` })}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={removeMember}
                                disabled={removing}
                                className="w-full py-3.5 bg-red-500 text-white font-medium rounded-full
                                           disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm
                                           hover:bg-red-600"
                            >
                                {removing ? t('dashboard.team.remove.removing') : t('dashboard.team.remove.confirm')}
                            </button>
                            <button
                                onClick={() => setConfirmRemove(null)}
                                className="w-full py-3.5 border border-gray-300 dark:border-gray-700
                                           text-gray-500 rounded-full text-sm hover:border-black
                                           hover:text-black dark:hover:border-white dark:hover:text-white transition-all"
                            >
                                {t('dashboard.team.remove.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
