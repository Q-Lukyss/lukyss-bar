# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Lukyss Bar: a home-bar ordering system. Admin manages cocktails/ingredients/stock, customers order on the web app, admin receives and manages orders on the mobile app with real-time status updates over WebSocket. Turborepo monorepo, npm workspaces (`apps/*`, `packages/*`).

- `apps/api` — Rust API (axum + sqlx + utoipa + ts-rs). This used to be a NestJS API; the migration to Rust is complete. Never reintroduce NestJS/Express patterns here.
- `apps/web` — Next.js 16 (App Router).
- `apps/mobile` — Expo/React Native, not yet built out (default scaffold only).
- `packages/api-types` — TS types generated from Rust (`ts-rs`) + a hand-written fetch client (`src/client.ts`). This is the single source of truth for how any TS consumer (web now, mobile later) talks to the API.
- `packages/api-contract-tests` — vitest suite hitting a *real* running API with `packages/api-types`' client. Not app-specific: whatever it covers is validated for every future consumer of the API, not just web.
- `packages/ui`, `packages/shared`, `packages/typescript-config`, `packages/eslint-config` — shared workspace packages.

## Commands

### Root (all commands run from repo root unless noted)

```bash
npm install                      # after adding/renaming any workspace package
npx turbo run dev                # everything in dev mode
npx turbo run build              # everything
npx turbo run lint check-types build   # what CI runs repo-wide
npx turbo run <task> --filter=<pkg>... # scope to one package + its deps
```

Package names: `@lukyss-bar/web`, `@lukyss-bar/mobile`, `@lukyss-bar/api-types`, `@lukyss-bar/api-contract-tests`, `@lukyss-bar/ui`, `@lukyss-bar/shared`, `@lukyss-bar/typescript-config`. The eslint-config package is the one exception still scoped `@repo/eslint-config` — don't "fix" it to `@lukyss-bar/*`, its package.json name really is `@repo/eslint-config`.

### API (`apps/api`, Rust)

```bash
cargo run                        # dev server, needs Postgres up (docker-compose.yml) and apps/api/.env
cargo test                       # unit + integration tests
cargo test --test commandes      # one integration test file
cargo test some_test_name        # by name, across lib+integration tests
cargo clippy --all-targets --all-features -- -D warnings   # must be warning-free (also enforced in CI)
cargo fmt                        # apply formatting; `cargo fmt --check` in CI
npm run db:migrate -w @lukyss-bar/api   # sqlx migrate run
npm run db:seed -w @lukyss-bar/api      # seeds an admin user (quentin.lkss@gmail.com) + demo data — needs SEED_ADMIN_PASSWORD in env (never hardcoded, see apps/api/src/bin/seed.rs)
npm run db:reset -w @lukyss-bar/api     # drop, create, migrate, seed
npm run sdk -w @lukyss-bar/api          # cargo run --bin export_types — regenerate packages/api-types/generated
```

**sqlx offline cache** (`apps/api/.sqlx/`): every `sqlx::query!`/`query_as!` is normally checked against a live DB at compile time. This repo commits a cache so `SQLX_OFFLINE=true` builds work without one (needed for Docker builds and to speed up CI). **After changing any SQL query, regenerate and commit it**, or the Docker/CI build will compile against a stale cache:

```bash
cargo sqlx prepare -- --all-targets   # from apps/api, with DATABASE_URL pointing at a live Postgres
```

### Web (`apps/web`)

```bash
npm run dev -w @lukyss-bar/web
npm run build -w @lukyss-bar/web
npm run check-types -w @lukyss-bar/web   # runs `next typegen` first, then tsc
```

### Contract tests (`packages/api-contract-tests`)

```bash
npm run test -w @lukyss-bar/api-contract-tests
```

Needs a real API reachable at `API_URL` (default `http://localhost:3001`) with a migrated + seeded DB (`cargo run --bin seed`) — it logs in as the seeded admin, then creates its own ingredient/cocktail/code fixtures through the API rather than relying on seed data for those.

## Architecture

### API module layout

Each domain lives in its own module under `apps/api/src/`: `auth`, `ingredients`, `cocktails`, `codes`, `commandes`. Within a module: `routes.rs` (axum handlers + request DTOs, `#[utoipa::path]` for OpenAPI, `#[ts(export)]` for TS bindings), `repo.rs` (sqlx queries), `mod.rs`. Shared response shapes are in `types/<module>.rs`.

- `lib.rs::build_router(state: AppState) -> Router` builds the full app from a ready `AppState` — used by both `run()` (real server) and integration tests (`apps/api/tests/common/mod.rs`), which construct a test `AppState` around an ephemeral `#[sqlx::test]` pool instead of going through `Config`/`main`.
- `error.rs::ApiError` is the single error type for all handlers, `IntoResponse` maps it to the `{ message, error, statusCode }` shape the frontend expects.
- `auth/extractors.rs` has two axum extractors: `AuthUser` (any authenticated user) and `AdminUser` (wraps `AuthUser`, 403s if not admin) — used as handler parameters to gate routes, not as middleware.
- `state.rs::AppState.ws_registry` is a `DashMap<public_token, broadcast::Sender<StatusEvent>>`, populated lazily when a client opens the WebSocket for that commande (`commandes/ws.rs`). `AppState::broadcast_status` only sends if a channel already exists — **a WS client must connect before a status update happens**, or the message is silently dropped (the client is expected to re-fetch `GET /commandes/public/:token` on connect to catch up). Entries are purged on `COMPLETED` or when the last subscriber disconnects.
- Migrations (`apps/api/migrations/`) are embedded in the binary via `sqlx::migrate!()` and run automatically at startup (`lib.rs::run()`), before the server starts listening — no separate migration step needed in Docker/prod.
- `storage.rs::R2Storage` wraps Cloudflare R2 (S3-compatible). Images are **never** served from R2 directly: `uploads.rs` proxies them through the API's own `/uploads/:key` route (bucket stays private). Its constructor makes no network call, so tests can construct a dummy one freely as long as they don't hit upload/`/uploads` routes.

### JSON casing is inconsistent by design across modules — check before assuming

`auth` types (`AuthUser`, `LoginResponse`) have **no** `#[serde(rename_all)]`, so fields are literal snake_case (`is_admin`, `access_token`). Every other module (`ingredients`, `cocktails`, `codes`, `commandes`) uses `#[serde(rename_all = "camelCase")]`. Don't assume one convention repo-wide; check the specific struct in `types/`.

### Type generation flow (Rust → TS)

`ts-rs` `#[ts(export)]` attributes on Rust structs write to `apps/api/bindings/` and also generate a `#[test] fn export_bindings_*` per type (these run as a side effect of `cargo test`, but are **not** the source of truth for `packages/api-types/generated/` — deliberately, since that mechanism was deemed non-deterministic for CI). The actual regeneration path is the dedicated `export_types` binary (`npm run sdk -w @lukyss-bar/api`), which copies from `bindings/` into `packages/api-types/generated/`. CI's `api-types-drift` job runs it and fails the build if the output differs from what's committed — always run it after changing a `#[ts(export)]` struct.

`packages/api-types/src/client.ts` is a hand-written fetch wrapper (no codegen for the client itself, only the types) — when adding an API route, add the corresponding function here too.

### Testing strategy (three layers, don't blur them)

1. Rust unit tests — pure logic only (jwt sign/verify, bcrypt, `normalize_code`).
2. Rust integration tests (`apps/api/tests/*.rs`) — full HTTP round-trip through `build_router`, one ephemeral DB per test via `#[sqlx::test]`, using helpers in `tests/common/mod.rs` (`admin_token()`/`user_token()` mint JWTs directly rather than logging in, `json_request`/`body_json` for the HTTP plumbing).
3. `packages/api-contract-tests` — the *only* layer that exercises the real generated TS client against a real running API. This is what would catch e.g. a serialization mismatch between what Rust actually sends and what ts-rs claims the shape is. When mobile is built, it reuses this same package rather than growing its own contract suite; mobile-specific UI tests are a separate, later concern.

### CI/CD

- `.github/workflows/ci.yml`: `api-test` (fmt/clippy/test against a Postgres service), `api-types-drift`, `web-build`, `contract-tests` (boots the API with migrations+seed, runs the vitest suite), `docker-build` (builds both images without pushing, to catch Dockerfile breakage before it hits CD).
- `.github/workflows/cd.yml`: **api and web version and deploy independently**, never on a plain push to `main`. A `api-vX.Y.Z` tag only runs `build-and-push-api`/`deploy-api`; a `web-vX.Y.Z` tag only runs the web equivalents (gated by `startsWith(github.ref_name, 'api-v'|'web-v')`) — releasing one never touches the other's image or container. Each pushes `ghcr.io/q-lukyss/lukyss-bar-{api,web}` tagged `X.Y.Z`, `X.Y`, `latest`, then SSHes to the VPS, rewrites `IMAGE_TAG_API`/`IMAGE_TAG_WEB` directly in the server's `.env` (so a later manual `docker compose up -d` still uses the last deployed version, not `latest`), and runs `docker compose pull <service> && up -d <service>` for just that service.
- Production reverse proxy is **Traefik**, run as a separate pre-existing stack on the VPS, outside this repo — `docker-compose.prod.yml` has no Traefik service, `api`/`web` just join its external docker network (`TRAEFIK_NETWORK` env var) and carry Traefik labels. Don't reintroduce Caddy or add a Traefik service to this compose file.
- `NEXT_PUBLIC_API_URL` is inlined into the `web` image **at Docker build time** (`--build-arg` in `cd.yml`, from the `NEXT_PUBLIC_API_URL` repo variable) — changing it requires rebuilding/republishing the image, not just restarting the container.
- There is no signup route (`POST /auth/login` only). The `api` image includes the `seed` binary (`apps/api/Dockerfile`) precisely so a first admin can be created in prod via `docker compose exec -e SEED_ADMIN_PASSWORD='...' api seed` — it is never run automatically (`CMD` stays `lukyss-bar-api`), and the password is deliberately read from env at runtime (`apps/api/src/bin/seed.rs`), never hardcoded, so prod can use a real password without touching code.

See `README.md` ("Tests", "CI/CD", "Déploiement") and `TODO.md` for the full narrative and the one-time VPS/secrets setup checklist.
