import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * True when the keyboard event originates from an editable field (input,
 * textarea, select or contenteditable). Used to stop game controls from firing
 * while the user is typing.
 */
export function isEditableTarget(e: KeyboardEvent): boolean {
  const target = (e.target as HTMLElement | null) ?? (document.activeElement as HTMLElement | null)
  if (!target) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * Request pointer lock without the console noise three-stdlib's `controls.lock()`
 * produces. The browser rejects the request — firing `pointerlockerror` (logged
 * as "Unable to use Pointer Lock API") and rejecting the `requestPointerLock`
 * promise ("NotAllowedError: A user gesture is required") — when the page is not
 * focused (e.g. DevTools holds focus) or during the brief cooldown after exiting
 * lock with Escape. Skip those doomed attempts, and swallow the rejection from
 * any that still slip through so it doesn't surface as an uncaught error.
 */
export function safeLockPointer(
  controls: { isLocked: boolean; domElement?: HTMLElement } | null | undefined,
): void {
  if (!controls || controls.isLocked || !document.hasFocus()) return
  const el = controls.domElement
  if (!el) return
  const result = el.requestPointerLock() as unknown as Promise<void> | undefined
  result?.catch(() => {})
}

export const PASSWORD_RULES = [
  { key: 'pwLength', test: (p: string) => p.length >= 8 },
  { key: 'pwUpper', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'pwLower', test: (p: string) => /[a-z]/.test(p) },
  { key: 'pwNumber', test: (p: string) => /\d/.test(p) },
  { key: 'pwSpecial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

