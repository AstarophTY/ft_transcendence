# Feature notes — `do.md`

Friends, real-time presence/chat, account settings and an admin panel. Built on
NestJS + Prisma (backend) and React + zustand + shadcn (frontend).

## How to run

```bash
make                              # ssl + docker compose up -d --build
docker compose up -d --build backend     # rebuild one service after changes
docker compose up -d --build frontend
```

App is served on `https://localhost:8443`.

---

## Friends

Module `backend/src/friends/`, guarded by `JwtAuthGuard`.

| Method & route | Purpose |
| --- | --- |
| `GET /api/friends` | my friends (public profiles, no email) |
| `GET /api/friends/:id` | a friend's public profile |
| `GET /api/friends/requests/incoming` \| `outgoing` | pending requests |
| `POST /api/friends/requests` | send by `{ username }` (auto-accepts reciprocal) |
| `POST /api/friends/requests/:id/accept` | accept |
| `DELETE /api/friends/requests/:id` | decline / cancel |
| `DELETE /api/friends/:id` | remove a friend |
| `GET \| POST /api/friends/:id/messages` | conversation / send (rate-limited) |

**No email leaks** — every "other user" payload uses `PUBLIC_USER_SELECT`
(`backend/src/users/users.select.ts`); add a field there to expose it.

### Real-time (WebSocket)

Socket.IO gateway `friends.gateway.ts`, mounted at `path: '/ws/socket.io'` (the
nginx `/ws/` location forwards the upgrade headers). Authenticates with the JWT.
Client `frontend/src/lib/socket.ts`, opened/closed with the session in
`App.tsx`. Events: `presence:init`, `friend:online`/`offline`,
`friend:request`, `friend:accepted`, `friend:removed`, `message:new`.

### Anti-spam

- `@Throttle({ default: { limit: 5, ttl: 10000 } })` on message send.
- Chat reads new messages via the socket (no polling).
- New friendship syncs presence immediately (`gateway.syncNewFriendship`).

---

## Account settings

Gear button in the user menu → dialog with 4 tabs (`components/hud/settings/`),
backed by `GET/PATCH /api/users/me`:

- **Profile** — display name, bio, status (`ONLINE/AWAY/DND/OFFLINE`), status
  message.
- **Account** — username (**30-day cooldown**, enforced in
  `profile.service.ts`), email, campus (read-only, synced from 42), 42 login.
- **Security** — change password (verifies the current one).
- **Preferences** — language and theme.

Campus is captured from the 42 API on every login
(`auth.service.validateFortyTwoUser` + `forty-two.strategy.ts`).

**Add an editable field fast**: column in `schema.prisma` (+ migration) →
`SELF_USER_SELECT` + `UpdateProfileDto` (backend) → `SelfUser`/`ProfileUpdate`
+ a `<Field>` in the matching tab (frontend). The service persists whatever the
DTO validates.

---

## Admin panel

Visible only to `role = ADMIN` (shield button). Module `backend/src/admin/`,
guarded by `JwtAuthGuard + RolesGuard` with `@Roles(Role.ADMIN)`.

- `GET /api/admin/stats` — totals: users, admins, 42 vs local, new in 7 days.
- `GET /api/admin/users` — every account.
- `PATCH /api/admin/users/:id/role` — promote/demote (not your own).
- `DELETE /api/admin/users/:id` — delete (not your own).

UI in `components/hud/admin/` (stats grid + user table).

### How to become admin

The role is carried in the JWT, so promote yourself in the DB then **log out
and back in**:

```bash
docker compose exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "UPDATE \"User\" SET role='ADMIN' WHERE username='YOUR_USERNAME';"
```

After re-login the shield button appears and `/api/admin/*` is authorised.

---

## Branch workflow

Each feature was built on its own branch off `feat/frontend/friends` and merged
back with `--no-ff`: `feat/backend/account-settings`,
`feat/frontend/account-settings`, `feat/backend/admin`, `feat/frontend/admin`.

## TODO / next steps

- [ ] Mark messages as read (`Message.isRead` is unused) + unread badges.
- [ ] Block / unblock users.
- [ ] Pagination for long conversations.
- [ ] Apply saved `theme`/`language` on app load (currently applied on change).
