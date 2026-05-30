import { AxiosError } from 'axios'
import i18n from '@/i18n'

/** Extracts a human-readable message from an API/network error. */
export function toMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined
    const message = data?.message
    if (Array.isArray(message)) return message[0]
    if (message) return message
  }
  return i18n.t('auth.errorFallback')
}
