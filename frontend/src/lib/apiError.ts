import { AxiosError } from 'axios'
import i18n from '@/i18n'

/**
 * Maps the backend's (English) exception messages to localized `errors.*` i18n
 * keys, so users never see raw English server errors. Keys must match the
 * backend strings exactly. Unmapped messages (e.g. field validation) fall back
 * to the raw text.
 */
const SERVER_ERROR_KEYS: Record<string, string> = {
  '42 accounts cannot change their email': 'fortyTwoNoEmailChange',
  '42 accounts have no password': 'fortyTwoNoPassword',
  'A campus with this name already exists': 'campusNameExists',
  'Build end must be after build start': 'buildEndAfterStart',
  'Campus members vote for an island, not a campus': 'campusMembersVoteIsland',
  'Campus not found': 'campusNotFound',
  'Current password is incorrect': 'currentPasswordIncorrect',
  'Email already in use': 'emailInUse',
  'Email or username already in use': 'emailOrUsernameInUse',
  'Friend request already sent': 'friendRequestAlreadySent',
  'Friend request not found': 'friendRequestNotFound',
  'Friendship not found': 'friendshipNotFound',
  'Invalid credentials': 'invalidCredentials',
  'Invalid or expired refresh token': 'invalidRefreshToken',
  'No active season': 'noActiveSeason',
  'No file uploaded': 'noFileUploaded',
  'Season not found': 'seasonNotFound',
  "The next season must start after the current season's vote ends":
    'nextSeasonAfterVote',
  'That campus does not exist': 'campusDoesNotExist',
  'That member has no island to vote for': 'memberNoIsland',
  'This account has no password set': 'noPasswordSet',
  'Token revoked': 'tokenRevoked',
  'Unsupported image type': 'unsupportedImageType',
  'Too many attempts, try again in 15 minutes': 'tooManyAttempts',
  'Username already taken': 'usernameTaken',
  'User not found': 'userNotFound',
  'Voting is not open': 'votingNotOpen',
  'You are already friends': 'alreadyFriends',
  'You are not friends with this user': 'notFriends',
  'You cannot add yourself': 'cannotAddYourself',
  'You cannot change your own role': 'cannotChangeOwnRole',
  'You cannot delete your own account': 'cannotDeleteOwnAccount',
  'You can only vote within your own campus': 'voteOwnCampusOnly',
  'You cannot vote for your own island': 'cannotVoteOwnIsland',
  'You must belong to a campus to vote': 'mustBelongCampusToVote',
}

/** Extracts a localized, human-readable message from an API/network error. */
export function toMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined
    const raw = Array.isArray(data?.message) ? data?.message[0] : data?.message
    if (raw) {
      const key = SERVER_ERROR_KEYS[raw]
      return key ? i18n.t(`errors.${key}`) : raw
    }
  }
  return i18n.t('auth.errorFallback')
}
