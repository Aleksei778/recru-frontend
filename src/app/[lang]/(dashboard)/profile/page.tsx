// src/app/[lang]/(dashboard)/profile/page.tsx

'use client'

import { useState } from 'react'
import { useAuth } from "@/contexts/auth-context"
import { useTranslation } from "@/hooks/useTranslation"
import type { UpdateProfileData, UpdateTenantData } from "@/types"
import React from 'react'
import { auth as api, ApiError } from "@/lib/api"
import { UserIcon, LockIcon, BuildingIcon, LogOutIcon, CheckIcon } from 'lucide-react'

const inputClass = `
    w-full px-5 py-3.5 bg-white dark:bg-black
    border border-gray-300 dark:border-gray-700 rounded-full
    text-gray-900 dark:text-white placeholder-gray-400 text-sm
    focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
    focus:border-transparent transition
`

const readonlyClass = `
    w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-950
    border border-gray-200 dark:border-gray-800 rounded-full
    text-gray-400 dark:text-gray-600 text-sm cursor-default select-none
`

type Tab = 'profile' | 'company' | 'password'

export default function ProfilePage() {
    const { t } = useTranslation()
    const {
        token,
        user,
        tenant,
        logout,
        updateUser,
    } = useAuth()

    const [tab, setTab] = useState<Tab>('profile')

    const [name, setName] = useState<string>(user?.name ?? '')
    const [email, setEmail] = useState(user?.email ?? '')
    const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null)
    const [profileSaving, setProfileSaving] = useState<boolean>(false)
    const [profileSuccess, setProfileSuccess] = useState<boolean>(false)
    const [profileError, setProfileError] = useState<string | null>(null)

    const [companyName, setCompanyName] = useState<string>(tenant?.name ?? '')
    const [website, setWebsite] = useState<string>(tenant?.website ?? '')
    const [industry, setIndustry] = useState<string>(tenant?.industry ?? '')
    const [companySaving, setCompanySaving] = useState<boolean>(false)
    const [companySuccess, setCompanySuccess] = useState<boolean>(false)
    const [companyError, setCompanyError] = useState<string | null>(null)

    const [currentPassword, setCurrentPassword] = useState<string>('')
    const [newPassword, setNewPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [passwordSaving, setPasswordSaving] = useState<boolean>(false)
    const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!token) return

        setProfileSaving(true)
        setProfileError(null)

        try {
            const updated = await api.updateProfile({name, email, avatar}, token)
            updateUser(updated)

            setTimeout(() => setProfileSuccess(true), 3000)
        } catch (err) {
            setProfileError(err instanceof ApiError
                ? err.message
                : t('dashboard.profile.profile.error'))
        } finally {
            setProfileSaving(false)
        }
    }

    const saveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!token) return;

        setCompanySaving(true)
        setCompanyError(null)

        try {
            await api.updateTenant({name: companyName, website, industry}, token)

            setCompanySuccess(true)
            setTimeout(() => setCompanySuccess(false), 3000)
        } catch (err) {
            setCompanyError(err instanceof ApiError
                ? err.message
                : t('dashboard.profile.company.error'))
        } finally {
            setCompanySaving(false)
        }
    }

    const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setPasswordError(t('dashboard.profile.password.mismatch'))

            return
        }

        if (newPassword.length < 8) {
            setPasswordError(t('dashboard.profile.password.short'))

            return
        }

        if (!token) return

        setPasswordSaving(true)
        setPasswordError(null)

        try {
            await api.updatePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            }, token)

            setPasswordSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err) {
            setPasswordError(err instanceof ApiError ? err.message : t('profile.error'))
        } finally {
            setPasswordSaving(false)
        }
    }

    const tabs: { id: Tab, label: string, icon: React.ElementType }[] = [
        {id: 'profile', label: t('dashboard.profile.profile.tab'), icon: UserIcon},
        {id: 'company', label: t('dashboard.profile.company.tab'), icon: BuildingIcon},
        {id: 'password', label: t('dashboard.profile.password.tab'), icon: LockIcon},
    ]

    const SubmitButton = ({saving, success, label, successLabel}: {
        saving: boolean,
        success: boolean,
        label: string,
        successLabel: string
    }) => (
        <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black
                       font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200 text-sm
                       flex items-center justify-center gap-2"
        >
            {success ? (
                <div>
                    <CheckIcon className="w-4 h-4"/>
                    {successLabel}
                </div>
            ) : saving ? (
                <span className="w-4 h-4 border-2 border-white/30 dark:border-black/30
                                 border-t-white dark:border-t-black rounded-full animate-spin"/>
            ) : label}
        </button>
    )

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">
            <div className="max-w-lg mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        {t('dashboard.profile.heading')}
                    </h1>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                </div>

                {/* Avatar + Summary */}
                <div className="flex items-center gap-5 p-6 rounded-3xl border border-black dark:border-white mb-8">
                    <div className="w-14 h-14 rounded-full border-2 border-black dark:border-white
                                    flex items-center justify-center bg-gray-50 dark:bg-gray-950 shrink-0">
                        {user?.avatar ?  (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full"/>
                        ) : (
                            <span className="text-lg font-bold text-black dark:text-white">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black dark:text-white truncate">
                            {user?.name}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {user?.role}
                        </p>

                        {tenant && (
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs border border-gray-300 dark:border-gray-700 rounded-full px-2.5 py-0.5">
                                    {tenant.name}
                                </span>

                                {tenant.industry && (
                                    <span className="text-xs border border-gray-300 dark:border-gray-700 rounded-full px-2.5 py-0.5">
                                        {tenant.industry}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-full border border-gray-200 dark:border-gray-800 mb-8 w-fit">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm
                                        font-medium transition-all duration-200
                                        ${tab === id
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab: Profile */}
                {tab === 'profile' && (
                    <div className="rounded-3xl border border-black dark:border-white p-8">
                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.profile.name')}
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={true}
                                    placeholder={t('dashboard.profile.profile.namePlaceholder')}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.profile.email')}
                                </label>
                                <input
                                    value={email}
                                    placeholder={t('dashboard.profile.profile.emailPlaceholder')}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required={true}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {t('dashboard.profile.profile.role')}
                                </label>
                                <div className={readonlyClass}>{user?.role}</div>
                            </div>

                            {profileError &&  (
                                <p className="text-red-500 text-xs text-center">
                                    {profileError}
                                </p>
                            )}

                            <div className="mt-4">
                                <SubmitButton
                                    saving={profileSaving}
                                    success={profileSuccess}
                                    label={t('dashboard.profile.profile.save')}
                                    successLabel={t('dashboard.profile.profile.saved')}
                                />
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab: Company */}
                {tab === 'company' && (
                    <div className="rounded-3xl border border-black dark:border-white p-8">
                        <form onSubmit={saveCompany} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.company.name')}
                                </label>
                                <input
                                    placeholder={t('dashboard.profile.company.namePlaceholder')}
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required={true}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.company.website')}
                                </label>
                                <input
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder={t('dashboard.profile.company.websitePlaceholder') + ' (https://company.com)'}
                                    required={true}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.company.industry')}
                                </label>
                                <input
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder={t('dashboard.profile.company.industryPlaceholder') + ' (IT, FinTech, HealthTech)'}
                                    required={true}
                                    className={inputClass}
                                />
                            </div>

                            {/* Tabs: Domains */}
                            {tenant?.domains && tenant.domains.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                        {t('dashboard.profile.company.domains')}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {tenant.domains.map((domain: string) => (
                                            <span
                                                key={domain}
                                                className="text-xs border border-gray-300 dark:border-gray-700
                                                           text-gray-500 dark:text-gray-400
                                                           px-3 py-1 rounded-full"
                                            >
                                                {domain}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {companyError && (
                                <p className="text-red-500 text-xs text-center">{companyError}</p>
                            )}

                            <div className="mt-4">
                                <SubmitButton
                                    saving={companySaving}
                                    success={companySuccess}
                                    label={t('dashboard.profile.company.save')}
                                    successLabel={t('dashboard.profile.company.saved')}
                                />
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab: Password */}
                {tab === 'password' && (
                    <div className="rounded-3xl border border-black dark:border-white p-8">
                        <form onSubmit={savePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.password.current')}
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required={true}
                                    placeholder={t('dashboard.profile.password.currentPlaceholder')}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.password.new')}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required={true}
                                    placeholder={t('dashboard.profile.password.newPlaceholder')}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500
                                              dark:text-gray-400 mb-1.5 ml-1">
                                    {t('dashboard.profile.password.confirm')}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder={t('dashboard.profile.password.confirmPlaceholder')}
                                    required
                                    className={inputClass}
                                />
                            </div>

                            {passwordError && (
                                <p className="text-red-500 text-xs text-center">{passwordError}</p>
                            )}

                            <div>
                                <SubmitButton
                                    saving={passwordSaving}
                                    success={passwordSuccess}
                                    label={t('dashboard.profile.password.save')}
                                    successLabel={t('dashboard.profile.password.saved')}
                                />
                            </div>
                        </form>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 t-8 text-l text-gray-400 mt-5
                               hover:text-black dark:hover:text-white transition-colors duration-200"
                >
                    <LogOutIcon className="w-6 h-6" />
                    {t('dashboard.profile.logout')}
                </button>
            </div>
        </div>
    )
}
