import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, Lock, LogIn, LogOut, Mail, Rocket, User, UserPlus, X, Users, Settings as SettingsIcon, Shield, ShieldCheck, FileText, Trophy, HelpCircle } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu"
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import UserBadge from '@/ui/hud/UserBadge.tsx'
import SettingsDialog from '@/ui/hud/settings/SettingsDialog'
import SeasonDialog from '@/ui/hud/SeasonDialog'
import AdminDialog from '@/ui/hud/admin/AdminDialog'
import LegalDialog from '@/ui/hud/LegalDialog'
import { useLegal } from '@/store/legal'
import { cn, PASSWORD_RULES, validateUsername, validateEmail } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFriends } from '@/store/friends'
import { useSettings } from '@/store/settings'
import { useSeason } from '@/store/season'
import { useAdmin } from '@/store/admin'
import { usePlanetStore } from '@/store/planetStore'
import { useEditorStore } from '@/store/editorStore'


function FortyTwoButton() {
  const { t } = useTranslation()
  const { loginWith42, loading } = useAuth()
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={loginWith42}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <img src="/42_Logo.svg" alt="" className="mr-2 size-4 shrink-0" />
      )}
      {t('auth.continueWith42')}
    </Button>
  )
}

function Separator() {
  const { t } = useTranslation()
  return (
    <div className="relative my-1 flex items-center">
      <span className="grow border-t" />
      <span className="px-3 text-xs text-muted-foreground uppercase">
        {t('auth.or')}
      </span>
      <span className="grow border-t" />
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation()
  if (password.length === 0) return null
  return (
    <ul className="mt-1 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li
            key={rule.key}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              ok ? 'text-green-600' : 'text-muted-foreground',
            )}
          >
            {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {t(`auth.${rule.key}`)}
          </li>
        )
      })}
    </ul>
  )
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isEmailValid = validateEmail(email)
  const isPasswordValid = password.length >= 8
  const canSubmit = isEmailValid && isPasswordValid && !loading

  const emailInvalid = email.length > 0 && !isEmailValid
  const passwordInvalid = password.length > 0 && !isPasswordValid

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    if (await login(email, password)) onSuccess()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">
          <Mail className="size-4" /> {t('auth.email')}
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailInvalid || undefined}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">
          <Lock className="size-4" /> {t('auth.password')}
        </Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={passwordInvalid || undefined}
          required
        />
      </div>
      <Button type="submit" disabled={!canSubmit} className="w-full">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {t('auth.loginButton')}
      </Button>
      <Separator />
      <FortyTwoButton />
    </form>
  )
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const { register, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const usernameValid = validateUsername(username)
  const usernameInvalid = username.length > 0 && !usernameValid
  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password))
  const passwordInvalid = password.length > 0 && !passwordValid
  const passwordsMatch = password === confirm
  const confirmInvalid = confirm.length > 0 && !passwordsMatch

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValid || !passwordsMatch || !usernameValid) return
    if (await register(email, username, password)) onSuccess()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-username">
          <User className="size-4" /> {t('auth.username')}
        </Label>
        <Input
          id="register-username"
          autoComplete="username"
          placeholder={t('auth.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
          aria-invalid={usernameInvalid || undefined}
          required
        />
        {usernameInvalid && (
          <p className="text-xs text-destructive">
            {t('auth.usernameInvalid', { defaultValue: 'Username may only contain letters, numbers, _ and -' })}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-email">
          <Mail className="size-4" /> {t('auth.email')}
        </Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password">
          <Lock className="size-4" /> {t('auth.password')}
        </Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.newPasswordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={passwordInvalid || undefined}
          required
        />
        <PasswordChecklist password={password} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-confirm">
          <Lock className="size-4" /> {t('auth.confirmPassword')}
        </Label>
        <Input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={confirmInvalid || undefined}
          required
        />
        {confirmInvalid && (
          <p className="text-xs text-destructive">{t('auth.passwordMismatch')}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading || !passwordValid || !passwordsMatch || !usernameValid}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {t('auth.registerButton')}
      </Button>
      <Separator />
      <FortyTwoButton />
    </form>
  )
}

function AuthDialog() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const [dialogOpen, setDialogOpen] = useState(!user)

  const sceneMode = usePlanetStore((s) => s.sceneMode)
  const setSceneMode = usePlanetStore((s) => s.setSceneMode)
  const setTakingOff = usePlanetStore((s) => s.setTakingOff)
  const activeEditor = useEditorStore((s) => s.activeEditor)

  const showTakeoff = sceneMode === 'world'

  const handleTakeoff = () => {
    setTakingOff(true)
    activeEditor(false)
    setSceneMode('selection')
  }

  useEffect(() => {
    setDialogOpen(!user)
  }, [user])

  const handleOpenChange = (open: boolean) => {
    if (!user) {
      setDialogOpen(true)
    } else {
      setDialogOpen(open)
    }
  }

  return (
    <div className="pointer-events-auto absolute z-50 right-3 top-3 md:right-5 md:top-5">
      {user && (showTakeoff ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-12 p-0 rounded-full justify-center items-center hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-none shadow-none">
              <UserBadge user={user} onlyAvatar />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            sideOffset={8}
            className="w-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LogIn className="mr-1.5 size-4" />
                {t('auth.signIn')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleTakeoff}>
                <Rocket className="mr-1.5 size-4" />
                {t('auth.takeoff')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setDialogOpen(true)}
          className="flex size-12 p-0 rounded-full justify-center items-center hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-none shadow-none"
        >
          <UserBadge user={user} onlyAvatar />
        </Button>
      ))}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn("pointer-events-auto", !user && "[&>button]:hidden")}
          onInteractOutside={!user ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={!user ? (e) => e.preventDefault() : undefined}
        >
          <DialogHeader>
            <DialogTitle>{t('auth.title')}</DialogTitle>
            <DialogDescription>{t('auth.description')}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="login">
            <TabsList>
              <TabsTrigger value="login">{t('auth.tabLogin')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.tabRegister')}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => setDialogOpen(false)} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={() => setDialogOpen(false)} />
            </TabsContent>
          </Tabs>
          <LegalLinks />
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Privacy Policy / Terms of Service links opening the legal pop-up. */
function LegalLinks() {
  const { t } = useTranslation()
  const openLegal = useLegal((s) => s.openLegal)
  return (
    <div className="flex justify-center gap-4 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => openLegal('privacy')}
        className="underline underline-offset-2 hover:text-foreground"
      >
        {t('legal.privacyTitle')}
      </button>
      <button
        type="button"
        onClick={() => openLegal('terms')}
        className="underline underline-offset-2 hover:text-foreground"
      >
        {t('legal.termsTitle')}
      </button>
    </div>
  )
}

function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { incoming, togglePanel, refresh } = useFriends()
  const openSettings = useSettings((s) => s.setOpen)
  const openSeason = useSeason((s) => s.setOpen)
  const loadSeason = useSeason((s) => s.loadCurrent)
  const openAdmin = useAdmin((s) => s.setOpen)
  const openLegal = useLegal((s) => s.openLegal)

  const sceneMode = usePlanetStore((s) => s.sceneMode)
  const setSceneMode = usePlanetStore((s) => s.setSceneMode)
  const setTakingOff = usePlanetStore((s) => s.setTakingOff)
  const setShowTutorial = usePlanetStore((s) => s.setShowTutorial)
  const activeEditor = useEditorStore((s) => s.activeEditor)

  const showTakeoff = sceneMode === 'world'

  const handleTakeoff = () => {
    setTakingOff(true)
    activeEditor(false)
    setSceneMode('selection')
  }

  // Load friends/requests once logged in so the badge is up to date.
  useEffect(() => {
    if (user) void refresh()
  }, [user, refresh])

  // Keep the running season fresh so world-edit gating knows the current phase.
  // Phases change on minute boundaries, so a slow poll keeps the HUD in sync.
  useEffect(() => {
    if (!user) return
    void loadSeason()
    const id = setInterval(() => void loadSeason(), 60_000)
    return () => clearInterval(id)
  }, [user, loadSeason])

  if (!user) return null

  return (
    <>
      <div className="pointer-events-auto absolute z-50 right-3 top-3 md:right-5 md:top-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex size-12 p-0 rounded-full justify-center items-center hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-none shadow-none">
              <UserBadge user={user} onlyAvatar />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            sideOffset={8}
            className="w-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => togglePanel()}>
                <Users className="mr-1.5 size-4" />
                {t('friends.title')} {incoming.length > 0 && `(${incoming.length})`}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSeason(true)}>
                <Trophy className="mr-1.5 size-4" />
                {t('season.menu')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSettings(true)}>
                <SettingsIcon className="mr-1.5 size-4" />
                {t('settings.title')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowTutorial(true)}>
                <HelpCircle className="mr-1.5 size-4" />
                {t('tutorial.replay_btn', { defaultValue: 'Replay Tutorial' })}
              </DropdownMenuItem>
              {user.role === 'ADMIN' && (
                <DropdownMenuItem onSelect={() => openAdmin(true)}>
                  <Shield className="mr-1.5 size-4" />
                  {t('admin.title')}
                </DropdownMenuItem>
              )}
              {showTakeoff && (
                <DropdownMenuItem onSelect={handleTakeoff}>
                  <Rocket className="mr-1.5 size-4" />
                  {t('auth.takeoff')}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openLegal('privacy')}>
                <ShieldCheck className="mr-1.5 size-4" />
                {t('legal.privacyTitle')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openLegal('terms')}>
                <FileText className="mr-1.5 size-4" />
                {t('legal.termsTitle')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
                <LogOut className="mr-1.5 size-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsDialog />
        <SeasonDialog />
        {user.role === 'ADMIN' && <AdminDialog />}
      </div>
    </>
  )
}

export default function AuthPanel() {
  const user = useAuth((s) => s.user)

  return (
    <>
      {user ? <UserMenu /> : <AuthDialog />}
      <LegalDialog />
    </>
  )
}
