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
