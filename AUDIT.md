# Audit du projet — ft_verse (ft_transcendence)

> Date : 2026-06-12 · Périmètre : backend NestJS, frontend React/Three.js, nginx, Docker Compose.
> Méthode : revue du code, des filtres d'exception, des guards, builds (`tsc`/`nest build`/`vite build`),
> `npm audit`, et analyse des logs runtime des conteneurs.

## 1. Résumé exécutif

État global : **sain**. La base technique est solide — validation stricte des entrées, filtres
d'exception ciblés, guards d'authentification sur tous les controllers, 0 vulnérabilité npm en
production, `tsc` et `eslint` propres. 

Points à retenir :

- **Les 500 « évitables » sont déjà gérés** (courses Prisma, uploads, OAuth 42) et traduits en 4xx.
  Nest renvoie par défaut un 500 propre (`{"statusCode":500,"message":"Internal server error"}`) **sans
  fuiter de stack trace** au client.
- **Les 500 résiduels sont tous d'origine infrastructure** (base/redis indisponibles) ou des bugs de
  programmation — voir §3. On ne peut pas les « interdire », seulement les atténuer.
- **Warning de build Vite corrigé** (découpage des vendors + seuil ajusté). Restent des warnings
  runtime bénins (Redis/Postgres/nginx) expliqués en §4.
- **3 améliorations recommandées** : brancher le rate-limiter global, activer `helmet` (déjà installé
  mais non utilisé), ajouter des tests automatisés (actuellement **0**).

## 2. Architecture & stack

| Couche | Technologies |
| --- | --- |
| Backend | NestJS, Prisma + PostgreSQL, Redis (ioredis), Socket.io (2 gateways), JWT + refresh tokens |
| Frontend | React, Vite 8 (Rolldown), Three.js / @react-three, zustand, i18next (en/fr/es), shadcn/ui |
| Edge | nginx (TLS, reverse-proxy `/`, `/api`, `/ws`) |
| Infra | Docker Compose : postgres, redis, migrate (Prisma), backend, frontend, nginx, api-check |

Flux : navigateur → nginx (TLS) → `frontend` (SPA) / `backend` (`/api`, `/ws`). Postgres et Redis ne
sont jamais exposés hors du réseau Docker.

## 3. Erreurs 500 — vérification

### 3.1 Mécanismes en place

- **`ValidationPipe`** global (`main.ts`) : `whitelist`, `forbidNonWhitelisted`, `transform`. Toute
  entrée malformée → **400**, jamais 500. Tous les DTO utilisent `class-validator`.
- **`PrismaExceptionFilter`** : `P2002` (unique) → **409**, `P2025` (introuvable) → **404**, `P2003`
  (clé étrangère) → **400**. Les autres codes Prisma connus sont **loggés** côté serveur et renvoient
  un 500 générique sans détail.
- **`MulterExceptionFilter`** : upload trop gros (`LIMIT_FILE_SIZE`) → **413**, autres erreurs upload →
  **400**.
- **`FortyTwoOAuthFilter`** : un refus de consentement ou un code OAuth expiré (qui sortirait sinon en
  500 brut depuis passport) → **redirection** vers le front avec un code d'erreur stable.
- **Appels externes (API 42)** : entièrement défensifs — `timedFetch`/`safeJson` renvoient `null` sur
  timeout, erreur réseau ou corps non-JSON. Une panne de l'API 42 **ne casse jamais** la requête.
- **Cache Redis** : `JSON.parse` du cache est encapsulé dans un `try/catch` (entrée corrompue = cache
  miss, pas de crash).
- **Sécurité par défaut de Nest** : une exception non interceptée devient un 500 **sans stack trace
  dans la réponse** (la stack est seulement journalisée). Pas de fuite d'information.

### 3.2 Conclusion : 500 « évitables » → tous gérés

Aucune source de 500 *évitable* n'a été trouvée non traitée dans le code applicatif. Les erreurs
métier sont levées via les exceptions HTTP de Nest (`BadRequestException`, `NotFoundException`,
`ConflictException`, `UnauthorizedException`), donc en 4xx.

### 3.3 Les 500 qu'on NE PEUT PAS éliminer (et pourquoi)

Ces cas sont **par nature** des 500/503 : ils signalent que le serveur ne peut momentanément pas
répondre. On peut les *atténuer*, pas les *interdire*.

| # | Cause | Pourquoi inévitable | Atténuation |
| --- | --- | --- | --- |
| 1 | **PostgreSQL indisponible** (arrêt, réseau, redémarrage) → `PrismaClientInitializationError` / `P1001`. Ce **n'est pas** un `PrismaClientKnownRequestError`, donc non capté par le filtre Prisma → 500. | Sans base, aucune lecture/écriture n'est possible : la requête ne *peut* pas aboutir. | Healthcheck Docker (déjà présent), reconnexion Prisma automatique, et idéalement mapper vers **503** (voir §6). |
| 2 | **Redis indisponible** → rejet ioredis dans le `JwtAuthGuard` (`isTokenBlacklisted`) ou le limiteur de login. | La blacklist de tokens et le compteur anti-bruteforce dépendent de Redis ; une panne prolongée fait échouer ces étapes. | `enableOfflineQueue` (défaut ioredis) absorbe les coupures brèves ; healthcheck présent. |
| 3 | **Pool de connexions Prisma saturé** sous forte charge → `P2024` (timeout). | Limite de ressources, pas un bug : au-delà du pool, les requêtes patientent puis échouent. | Dimensionner `connection_limit`, rate-limiting global (§6). |
| 4 | **Requête Prisma malformée** → `PrismaClientValidationError`. | C'est un **bug de programmation**, pas une condition runtime : se prévient par la revue/les tests, pas par un filtre. | Tests automatisés (§6), `tsc` strict (déjà en place). |
| 5 | **Erreur vraiment imprévue** (OOM, bug non anticipé). | Par définition non catalogable a priori. | Filtre catch-all qui logge + renvoie un 500 propre (Nest le fait déjà ; voir §6 pour le durcir). |

> Note : un **502** apparaît côté nginx pendant un redémarrage du backend (logs : `connect() failed
> (111: Connection refused)`). Ce n'est pas un 500 applicatif mais une erreur de passerelle, transitoire
> par construction (le backend est down quelques secondes). Voir §4.

## 4. Warnings dans le terminal

### 4.1 Build — **corrigé**

- **Vite** : `Some chunks are larger than 500 kB`. Un seul bundle de 2,4 Mo.
  - **Correction appliquée** (`vite.config.ts`) : découpage des vendors lourds via `manualChunks`
    (`three`, `react`) → meilleurs caching/chargement, et `chunkSizeWarningLimit: 1500` (Three.js ≈ 600 kB
    minifié à lui seul ; le seuil de 500 kB n'a aucun sens pour une app WebGL). Résultat : plus aucun
    warning, chunks séparés (`react` 520 kB, `three` 883 kB, `index` 1,02 Mo).
- **`nest build`** : aucun warning.
- **`tsc --noEmit`** (back & front) : propre.
- **`eslint`** : propre (`--max-warnings 0`).

### 4.2 Runtime (logs conteneurs) — bénins, expliqués

| Source | Message | Sévérité | Explication / action |
| --- | --- | --- | --- |
| Redis | `WARNING Memory overcommit must be enabled` | Faible | Réglage **hôte** (`vm.overcommit_memory=1`), non modifiable depuis le conteneur. Sans impact en dev ; à appliquer sur l'hôte de prod si persistance Redis critique. |
| Postgres | `no usable system locales were found` | Très faible | L'image alpine n'embarque pas les locales. Inoffensif (encodage UTF-8 utilisé). Utiliser une image avec locales si du tri linguistique est requis. |
| Postgres | `enabling "trust" authentication for local connections` | Faible | Comportement par défaut de l'image officielle pour le **socket local uniquement**. Les connexions TCP (backend) utilisent bien un mot de passe. La base n'est pas exposée hors réseau Docker. |
| nginx | `connect() failed (111: Connection refused)` (502) | Faible | Transitoire : survient quand le backend redémarre (build/déploiement). Atténuable avec `proxy_next_upstream` / une fenêtre de grâce, mais disparaît dès que le backend est up. |

## 5. Sécurité & robustesse (constats annexes)

**Points forts**
- Guards d'auth (`JwtAuthGuard`, `RolesGuard`) sur **tous** les controllers ; routes publiques limitées
  à `register`/`login`/`refresh`/OAuth.
- JWT access + refresh, blacklist de tokens (Redis), `bcrypt` (coût 12), limiteur de tentatives de
  login (Redis, 15 min).
- CORS restreint à `FRONTEND_URL`, `cookie-parser`, throttle dédié sur l'envoi de messages.
- `.env` **non versionné** (présent dans `.gitignore`). `npm audit` : **0 vulnérabilité** (back & front).
- Frontend : error boundaries (WebGL + nouveau boundary global), reconnexion socket temporisée, 404
  shadcn.

**À améliorer** (aucun n'est un 500)
- **Rate-limiter global non branché** : `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` est
  configuré mais **aucun `APP_GUARD: ThrottlerGuard`** n'est enregistré → la limite globale n'est pas
  appliquée (seul `messages` est throttlé). Brute-force login déjà couvert séparément via Redis.
- **`helmet` installé mais non utilisé** : la dépendance est présente dans `package.json` mais
  `app.use(helmet())` n'est jamais appelé → pas d'en-têtes de sécurité côté API.
- **Aucun test automatisé** (`*.spec.ts` : 0). C'est le principal filet de sécurité manquant contre les
  régressions et les 500 de type « bug » (§3.3 #4).

## 6. Recommandations priorisées

| Priorité | Action | Bénéfice |
| --- | --- | --- |
| Haute | Brancher `ThrottlerGuard` en `APP_GUARD` global | Active réellement le rate-limiting déjà configuré |
| Haute | Ajouter des tests (services + e2e des controllers) | Prévient les 500 de type bug (§3.3 #4) et les régressions |
| Moyenne | Activer `helmet` (`app.use(helmet())`) | En-têtes de sécurité (dépendance déjà présente) |
| Moyenne | Filtre catch-all mappant l'infra → **503** | Statut plus correct que 500 quand DB/Redis sont down |
| Basse | `vm.overcommit_memory=1` sur l'hôte de prod | Supprime le warning Redis, fiabilise la persistance |
| Basse | `proxy_next_upstream` / page d'attente nginx | Adoucit les 502 pendant les redémarrages backend |

### Exemple — filtre catch-all (optionnel, §3.3 #1 & #5)

Pour transformer une panne d'infrastructure en **503** propre (au lieu d'un 500 générique) tout en
préservant les 4xx existants. À enregistrer **en dernier** dans `useGlobalFilters(...)` pour ne pas
court-circuiter les filtres spécifiques (Prisma/Multer) :

```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    // Laisse passer les exceptions HTTP métier (4xx) telles quelles.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res.status(status).json(exception.getResponse());
      return;
    }

    // Base injoignable → 503 plutôt que 500.
    const isInfra =
      exception instanceof Prisma.PrismaClientInitializationError ||
      (exception as { code?: string })?.code === 'ECONNREFUSED';
    const status = isInfra ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error('Unhandled exception', exception as Error);
    res.status(status).json({
      statusCode: status,
      message: isInfra ? 'Service temporarily unavailable' : 'Internal server error',
    });
  }
}
```

---

## 7. Suite donnée à l'audit (corrections appliquées)

Au-delà du warning de build Vite, les recommandations actionnables côté code ont été implémentées :

| Reco (§6) | Statut | Détail |
| --- | --- | --- |
| `ThrottlerGuard` global en `APP_GUARD` | ✅ Fait | `GlobalThrottlerGuard` (skip des contextes WebSocket) enregistré en `APP_GUARD` dans `AppModule`. Le rate-limit 100 req/60 s s'applique désormais à **toutes** les routes HTTP. |
| Activer `helmet` | ✅ Fait | `app.use(helmet(...))` dans `main.ts` (CRP en `cross-origin` pour servir les avatars). |
| Filtre catch-all infra → **503** | ✅ Fait | `AllExceptionsFilter` (`@Catch()`) enregistré **en premier** dans `useGlobalFilters` — donc évalué **en dernier** par Nest (résolution inversée). Laisse passer les `HttpException` (4xx) et les filtres Prisma/Multer ; mappe Postgres/Redis injoignables → 503. |
| Tests automatisés | ✅ Amorcé | Runner natif `node:test` (aucune nouvelle dépendance) : `npm test`. Specs pour `AllExceptionsFilter` et le chargement des clés JWT. Base à étendre (services + e2e). |
| `proxy_next_upstream` nginx | ✅ Fait | Retry sur erreurs de connexion (`/api/`) pour adoucir les 502 transitoires au redémarrage backend. |
| `vm.overcommit_memory=1` | ⏳ Hôte | Réglage **hôte de prod** (hors périmètre conteneur), à appliquer côté ops. |

### Durcissement supplémentaire — JWT signés en RS256 (asymétrique)

Les JWT (access **et** refresh) ne sont plus signés avec un secret HS256 partagé mais avec une
**paire de clés RSA** : signature par la **clé privée**, vérification par la **clé publique** seule
(`backend/src/auth/jwt-keys.ts`). Avantage : une fuite de la clé de vérification ne permet pas de
forger de token. Les clés sont générées par `scripts/gen-jwt-keys.sh` (cible `make jwt`) et stockées
dans `.env` en PEM base64 (`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`). Points de vérification migrés :
`JwtStrategy`, l'auth WebSocket (`friends/socket-auth.ts`).

---

*Audit réalisé sur la branche `main`. Corrections appliquées : voir §7 ci-dessus.*
