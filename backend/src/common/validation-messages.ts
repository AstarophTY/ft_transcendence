/**
 * Stable, English validation messages shared across the user-facing DTOs.
 *
 * They are intentionally fixed strings (not class-validator defaults) so the
 * frontend can map them to localized text — see `frontend/src/lib/apiError.ts`
 * (`SERVER_ERROR_KEYS`). If you change a string here, update that map too.
 */
export const VALIDATION_MESSAGES = {
  EMAIL: 'Please enter a valid email address',
  USERNAME_LENGTH: 'Username must be 3 to 20 characters long',
  USERNAME_PATTERN: 'Username may only contain letters, numbers, _ and -',
  PASSWORD_LENGTH: 'Password must be 8 to 72 characters long',
  PASSWORD_PATTERN:
    'Password must contain an uppercase letter, a lowercase letter, a number and a special character',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required',
  DISPLAY_NAME_LENGTH: 'Display name is too long',
  BIO_LENGTH: 'Bio is too long',
  STATUS_MESSAGE_LENGTH: 'Status message is too long',
} as const;
