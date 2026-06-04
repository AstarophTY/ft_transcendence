import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, Lock, LogIn, Mail, Rocket, User, UserPlus, X } from 'lucide-react'

import { Button } from '@/components/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs'
import UserBadge from '@/components/hud/UserBadge'
import SettingsDialog from '@/components/hud/settings/SettingsDialog'
import AdminDialog from '@/components/hud/admin/AdminDialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { useFriends } from '@/store/friends'
import { useSettings } from '@/store/settings'
import { useAdmin } from '@/store/admin'
import { usePlanetStore } from '@/store/planetStore'

const PASSWORD_RULES = [
  { key: 'pwLength', test: (p: string) => p.length >= 8 },
  { key: 'pwUpper', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'pwLower', test: (p: string) => /[a-z]/.test(p) },
  { key: 'pwNumber', test: (p: string) => /\d/.test(p) },
  { key: 'pwSpecial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function FortyTwoButton() {
  const { t } = useTranslation()
  const loginWith42 = useAuth((s) => s.loginWith42)
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={loginWith42}
    >
      <img src="/42_Logo.svg" alt="" className="size-4 shrink-0" />
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
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

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password))
  const passwordInvalid = password.length > 0 && !passwordValid
  const passwordsMatch = password === confirm
  const confirmInvalid = confirm.length > 0 && !passwordsMatch

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValid || !passwordsMatch) return
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
          required
        />
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
        disabled={loading || !passwordValid || !passwordsMatch}
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
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="absolute pointer-events-auto flex left-5 top-5">
          <UserBadge user={{
              username: t('auth.signIn'),
              userId: "test",
              avatar: "",
              email: null,
              role: 'USER'
            }}/>
        </Button>
      </DialogTrigger>
      <DialogContent className="pointer-events-auto">
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
            <LoginForm onSuccess={close} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { incoming, togglePanel, refresh } = useFriends()
  const openSettings = useSettings((s) => s.setOpen)
  const openAdmin = useAdmin((s) => s.setOpen)

  // Load friends/requests once logged in so the badge is up to date.
  useEffect(() => {
    if (user) void refresh()
  }, [user, refresh])

  if (!user) return null

  return (
    <>
      <div className="pointer-events-auto absolute left-5 top-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="flex p-5">
              <UserBadge user={user} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => togglePanel()}>{t('friends.title')} {incoming.length > 0 && (incoming.length)}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSettings(true)}>{t('settings.title')}</DropdownMenuItem>
              {user.role === 'ADMIN' && (
                <DropdownMenuItem onSelect={() => openAdmin(true)}>{t('admin.title')}</DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={() => logout()}>{t('auth.logout')}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <SettingsDialog />
        {user.role === 'ADMIN' && <AdminDialog />}
      </div>
      <TakeOffButton />
    </>
  )
}

function TakeOffButton() {
  const sceneMode = usePlanetStore((s) => s.sceneMode)
  const setSceneMode = usePlanetStore((s) => s.setSceneMode)

  if (sceneMode !== 'world') return null

  return (
    <Button
      variant="secondary"
      size="icon"
      className="pointer-events-auto absolute right-5 top-5 transition-transform hover:-translate-y-1 hover:scale-110 active:translate-y-[-100vh] active:duration-1000"
      onClick={() => setSceneMode('selection')}
    >
      <Rocket className="size-5" />
    </Button>
  )
}

export default function AuthPanel() {
  const user = useAuth((s) => s.user)
  const sceneMode = usePlanetStore((s) => s.sceneMode)

  return (
    <>
      {user ? <UserMenu /> : <AuthDialog />}
      {(!user && sceneMode === 'world') && <TakeOffButton />}
    </>
  )
}
