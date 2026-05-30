# Friends system — `do.md`

End-to-end friends feature: add / accept / remove friends, send direct
messages, view a friend's public profile (avatar, username, role, join date —
**never the email**), with real-time presence and notifications.

---

## How to run

```bash
# from the repo root (uses docker compose: postgres, redis, backend, nginx, frontend)
make            # generates ssl + docker compose up -d --build
# or rebuild a single service after changes:
docker compose up -d --build backend
docker compose up -d --build frontend
```

The Friends panel opens from the user menu in the HUD (the 👥 button next to
logout). It only renders once the user is logged in. App is served on
`https://localhost:8443`.

---

## Backend

NestJS module at `backend/src/friends/`, wired in `app.module.ts`. All HTTP
routes are guarded by `JwtAuthGuard` and act on the authenticated user.

| Method & route | Body | Purpose |
| --- | --- | --- |
| `GET /api/friends` | — | List my friends (public profiles) |
| `GET /api/friends/:friendId` | — | A friend's public profile (no email) |
| `GET /api/friends/requests/incoming` | — | Requests I received |
| `GET /api/friends/requests/outgoing` | — | Requests I sent |
| `POST /api/friends/requests` | `{ username }` | Send a request (auto-accepts a reciprocal one) |
| `POST /api/friends/requests/:id/accept` | — | Accept an incoming request |
| `DELETE /api/friends/requests/:id` | — | Decline incoming / cancel sent |
| `DELETE /api/friends/:friendId` | — | Remove a friend |
| `GET /api/friends/:friendId/messages` | — | Conversation with a friend |
| `POST /api/friends/:friendId/messages` | `{ content }` | Send a message (rate-limited) |

**Data model** — `schema.prisma`: `Friendship` (`requesterId` → `addresseeId`,
`status` `PENDING`/`ACCEPTED`, unique per pair). Direct messages reuse the
existing `Message` model.

**No email leaks** — every "other user" payload goes through one select,
`backend/src/users/users.select.ts`:

```ts
export const PUBLIC_USER_SELECT = {
  id: true, username: true, avatar: true, role: true, createdAt: true,
} satisfies Prisma.UserSelect  // email & passwordHash deliberately omitted
```

---

## Real-time (WebSocket)

Socket.IO gateway `friends.gateway.ts`, mounted at `path: '/ws/socket.io'` —
the nginx `/ws/` location is the one that forwards the WebSocket upgrade
headers. The socket authenticates with the JWT access token
(`io({ auth: { token } })`); client in `frontend/src/lib/socket.ts`, opened and
closed with the session in `App.tsx`, driven by the friends store.

Server → client events:

| Event | When | Client reaction |
| --- | --- | --- |
| `presence:init` | on connect | seed the online-friends list |
| `friend:online` / `friend:offline` | a friend (dis)connects | green/grey dot on `Avatar` + toast |
| `friend:request` | someone adds you | refresh + toast |
| `friend:accepted` | your request is accepted | refresh friends + toast |
| `friend:removed` | a friend removes you | refresh |
| `message:new` | a friend messages you | append if chat open, else toast |

Presence is tracked per-user (multi-tab aware) in `presence.service.ts`. When a
new friendship is created, `gateway.syncNewFriendship` immediately syncs both
sides' online status so an online friend shows the green dot right away.

---

## Anti-spam

- Messages are rate-limited server-side: `@Throttle({ default: { limit: 5,
  ttl: 10000 } })` on `POST /friends/:id/messages` (5 msgs / 10 s).
- The chat no longer polls — new messages arrive only via the socket.

---

## Code layout

Split so no file exceeds ~100 lines:

- Backend `backend/src/friends/`: `friends.repository.ts` (shared
  `findBetween`/`ensureFriends`), `requests.service.ts`, `friends.service.ts`,
  `messages.service.ts`, `presence.service.ts` + `socket-auth.ts` (gateway
  internals), and one controller per concern (`requests`, `messages`,
  `friends`).
- Frontend store `src/store/friends/`: `list.ts`, `chat.ts`, `socket.ts`
  slices combined in `index.ts`.
- Frontend UI `src/components/hud/friends/`: panel, list, requests, chat and
  their sub-parts (`MessageList`, `RequestRow`, `RequestSection`, `Avatar`, …).

---

## How to extend

- **Expose another public field**: add it to `PUBLIC_USER_SELECT` — it flows to
  every list, profile and request payload, and the `PublicUser` type updates
  automatically. Still no email.
- **Add a friendship action** (e.g. block): add to the `FriendshipStatus` enum
  + migration, a service method, a controller route, an `api.ts` function, a
  store action, then a button.
- **Add a panel tab**: extend the `Tab` union in `types/Social.ts`, add an
  entry to the `tabs` array in `FriendsPanel`, render your component.

---

## TODO / next steps

- [ ] Mark messages as read (`Message.isRead` exists but is unused) + unread
      badges per conversation.
- [ ] Block / unblock users.
- [ ] Pagination for long conversations.
