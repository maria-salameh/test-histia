# Stolos — authentication exercise

Starter for the front-end exercise. The back end is ready: you build the screens from the Figma file on top of it.

Stack: Next.js (App Router), Better Auth, Prisma + PostgreSQL, Tailwind. `react-hook-form` and `@tanstack/react-query` are installed.

## Setup

Requires [Bun](https://bun.sh) and Docker.

```bash
bun install
cp .env.example .env
bun run db:setup   # starts Postgres on port 5433, applies migrations, creates the test accounts
bun run dev
```

`bun run db:seed` puts the test accounts back in their initial state at any time.

> **`P1000: Authentication failed` on `db:migrate`?** Another PostgreSQL is probably already listening on port 5433 of your machine and answering instead of the container (check with `Get-NetTCPConnection -LocalPort 5433`). Stop it, or publish the container elsewhere with a `docker-compose.override.yml` (`ports: !override ["5434:5432"]`) and point `DATABASE_URL` in `.env` at that port.

## What is provided

| File | Role |
|---|---|
| `src/lib/auth.ts` | Better Auth server configuration |
| `src/lib/auth-client.ts` | Better Auth client (`authClient`), with the two-factor plugin |
| `src/app/api/auth/[...all]/route.ts` | All auth endpoints, under `/api/auth` |
| `src/app/code/page.tsx` | The `/code` helper page (see below) |
| `src/app/globals.css` | Stolos design tokens (colors, text sizes, spacing, radii) and the `glassmorphism` utility |
| `src/components/ui/` | `Button`, `Input`, `PasswordInput`, copied from the Stolos web app |
| `src/components/sectors/` | Company sectors from the Stolos web app: list, colours and icons (`sectors.ts`) and the `SectorTag` component. Sector names are not translated: that is part of the exercise. The rest of the company card is yours to build. |
| `src/components/company/company-status.ts` | Company statuses from the Stolos web app (`CompanyStatus`) |
| ~~`src/app/page.tsx`~~ | Start page that previewed these building blocks: replaced by the screens under `src/app/[locale]/` (see "What was built") |

The tokens redefine part of Tailwind's scale: `text-xs` … `text-xl` follow the Stolos sizes, and the spacing names (`xs`, `s`, `sm`, `m`, `l`, `xl`, `2xl`, `3xl`, `4xl`) also apply to sizing utilities, so `max-w-xl` is 1.5rem. Use explicit values such as `max-w-[36rem]` for widths.

No real email is sent and no authenticator app is needed. Open **`/code`** in another tab: for every account it shows the current authenticator code, the last code "sent by email", the recovery codes and the last password-reset link.

## Routes

| Path | What it is |
|---|---|
| `/{fr,en}/…` | The screens of the exercise, listed under "What was built" below. `/` and bare paths such as `/login` redirect to the visitor's language. |
| `/code` | Helper page: codes, recovery codes and reset links of every account (see above). Not localized. |
| `/api/auth/*` | Auth endpoints served by Better Auth, listed below. |

| Method | Path | Action |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Sign up |
| POST | `/api/auth/sign-in/email` | Sign in |
| POST | `/api/auth/two-factor/verify-totp` | Verify app code |
| POST | `/api/auth/two-factor/send-otp` | Send email code |
| POST | `/api/auth/two-factor/verify-otp` | Verify email code |
| POST | `/api/auth/two-factor/verify-backup-code` | Verify recovery code |
| POST | `/api/auth/request-password-reset` | Ask for a reset link |
| GET | `/api/auth/reset-password/:token` | The reset link itself: redirects to `redirectTo?token=…` |
| POST | `/api/auth/reset-password` | Set the new password |
| GET | `/api/auth/get-session` | Current session |
| POST | `/api/auth/sign-out` | Sign out |

## Test accounts

Password for all of them: `Stolos-Test-2026`

| Email | Second step at sign-in |
|---|---|
| `none@example.com` | none |
| `app@example.com` | authenticator app |
| `both@example.com` | authenticator app or email code |
| `email@example.com` | email code |

Every account with a second step also has recovery codes.

## Auth API

Use `authClient`; each method maps to an endpoint under `/api/auth`.

| Action | Client call | Notes |
|---|---|---|
| Sign up | `authClient.signUp.email({ name, email, password })` | Signs the user in. Password: 8 characters minimum. |
| Sign in | `authClient.signIn.email({ email, password })` | With a second step, returns `{ twoFactorRedirect: true, twoFactorMethods }` instead of a session. `twoFactorMethods` contains `"totp"` (app) and/or `"otp"` (email). |
| Verify app code | `authClient.twoFactor.verifyTotp({ code })` | |
| Send email code | `authClient.twoFactor.sendOtp()` | A new code cancels the previous one. Codes expire after 3 minutes. |
| Verify email code | `authClient.twoFactor.verifyOtp({ code })` | |
| Verify recovery code | `authClient.twoFactor.verifyBackupCode({ code })` | Each code works once. |
| Ask for a reset link | `authClient.requestPasswordReset({ email, redirectTo: "/your-page" })` | Same answer whether the account exists or not. A new link cancels the previous one. |
| Set the new password | `authClient.resetPassword({ newPassword, token })` | The link on `/code` redirects to `redirectTo?token=…`. |
| Current session | `authClient.useSession()` / `authClient.getSession()` | |
| Sign out | `authClient.signOut()` | |

### Errors to handle

Errors come back as `{ error: { status, code, message } }`.

| Case | Status | `code` |
|---|---|---|
| Wrong email or password | 401 | `INVALID_EMAIL_OR_PASSWORD` |
| Email already used at sign-up | 422 | `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` |
| Wrong or expired code | 401 | `INVALID_CODE` |
| Sign-in attempt expired (10 minutes) | 401 | `INVALID_TWO_FACTOR_COOKIE` |
| Reset link invalid, expired or already used | 400 | `INVALID_TOKEN` |
| Too many requests | 429 | — the `X-Retry-After` response header gives the seconds to wait |

The server refuses a new email code or a new reset link for **30 seconds** after the previous request (429). Sign-in is limited to 3 attempts per 10 seconds.

## What was built

Every page lives under a language prefix, `/fr/*` or `/en/*`. A bare path (`/login`, `/email`, `/`) redirects to the visitor's language (French when the browser says nothing). The language is in the URL, so there is no language switcher. Texts are in `src/content/*.content.ts` and handled by [Intlayer](https://intlayer.org) (`proxy.ts` does the redirect).

| Path | What it is |
|---|---|
| `/{fr,en}/login` | One card with the Connexion / Inscription tabs: switching is instant, no reload |
| `/{fr,en}/verify` | Second step. Adapts to the account: app code, email code, or both; six-cell input; recovery code |
| `/{fr,en}/forgot-password`, `/forgot-password/sent` | Ask for a reset link, then "check your inbox" with the resend countdown |
| `/{fr,en}/reset-password` | Where the reset link from `/code` lands. An expired or already used link says so |
| `/{fr,en}/account` | The page behind the login. Without a session the proxy redirects to the login, and the page checks the session again on the server |
| `/{fr,en}/email` | The reset email as designed, holding the latest reset link |
| `GET /api/companies?lang=fr\|en` | Content of the faded company cards behind the forms: name, description, sectors, status, logo |

### Behaviour worth knowing

- **Resend delays survive a reload.** The 30 s countdown (email code, reset link) is kept in `localStorage` from the moment the server accepted the request, and a 429 answer sets it from `X-Retry-After`. On an email-only account the code is sent when the screen opens, but not again on a reload within the delay. The verification screen itself comes back after a reload for as long as the server keeps the sign-in attempt (10 minutes).
- **The code input**: a pasted code is spread over the six cells whichever one has the focus, typing moves on, backspace goes back, and the sixth digit submits. With both methods the app code is tried first, then the email code if one was sent less than 3 minutes ago.
- **Errors from the server** (wrong credentials, wrong or expired code, used link, rate limit with the seconds to wait, no network) are shown in the current language. Rate-limited forms disable their button until the delay is over.
- **Not in the design, so designed here**: loading and error states, the rate-limit message, the "link refused" and "password updated" screens, the connected page.
- **Sign-up has no name field** in the design: the display name is the part of the address before the `@`.
- **The login button** reads "S'inscrire" in the Figma login frame, which looks like a slip: it says "Se connecter" here.
- **Company cards** follow the "Mode Carte" specs (552×160, 30% opacity); their positions are percentages of the viewport, so 1920×1080 and 1400×900 keep the same composition. Sector names and the "closed" / "sold" badges are translated from their identifiers. The "sold" badge colours were not specified (amber is used).
- **`/email` is not a fixture**: it shows the most recent reset link stored by the app (the same one `/code` lists), or a sample link before any was requested.

### Next 16 notes

- `cacheComponents` is on, so pages read the session or the request only behind `<Suspense>`, and the locale comes from the URL (`next/root-params`) rather than from request headers.
- Next keeps pages you left alive in the background. Forms therefore reset themselves on success, and their spinner follows the navigation (`useTransition`), not the mutation's success state; otherwise coming back to the login after signing out found a busy button and the previous password.
- Added dependencies: `intlayer`, `next-intlayer`, `zod`, `@hookform/resolvers`.
