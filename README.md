# Lukyss Bar

Il s'agit d'un projet comprenant un site web, une Api et une application mobile.   
Le bu de ce projet est de permettre à un administrateur d'afficher les cocktails qu'ils peut réaliser pour ses convives en fonction de son stock d'ingrédients.   
Les utilisateur prennent des commandes sur l'application web, l'administrateur les reçoit sur une application mobile et peut ainsi gérer les commandes.   
Ce Monorepo a été créé avec [TurboRepo](https://turborepo.com/).

## Maquettes

### Site Web

![Accueil](./.images-markdown/web/accueil.png "Page Accueil")
![Listes](./.images-markdown/web/list.png "Liste des Cocktail")
![Detail](./.images-markdown/web/detail.png "Page Detail")
![Panier](./.images-markdown/web/panier.png "Page Panier")

### Application Mobile

![Commandes](./.images-markdown/mobile/commandes.png "Page Commandes")
![Historique](./.images-markdown/mobile/historique.png "Page Historique")
![Codes](./.images-markdown/mobile/codes.png "Page Codes")
![Cocktails](./.images-markdown/mobile/liste-cocktail.png "Page Cocktails")
![Stocks](./.images-markdown/mobile/stock.png "Page Stocks")

## Apps and Packages

- `web`: une app [Next.js](https://nextjs.org/)
- `api`: une api [Rust](https://www.rust-lang.org/) ([axum](https://github.com/tokio-rs/axum) + [sqlx](https://github.com/launchbadge/sqlx) + [utoipa](https://github.com/juhaku/utoipa))
- `mobile`: une app [React Native](https://reactnative.dev/) et [Expo](https://expo.dev/)
- `@lukyss-bar/api-types`: types TS générés depuis l'API Rust ([ts-rs](https://github.com/Aleph-Alpha/ts-rs)) + client fetch
- `@lukyss-bar/eslint-config`: `eslint` configurations (inclu `eslint-config-next` et `eslint-config-prettier`)
- `@lukyss-bar/typescript-config`: `tsconfig.json`utilisée dans le monorepo
- Postgres

`web` et `mobile` sont en [TypeScript](https://www.typescriptlang.org/), `api` est en Rust.

## Utilities

- [TypeScript](https://www.typescriptlang.org/)
- [ESLint](https://eslint.org/) pour le linting du code
- [Prettier](https://prettier.io) pour le formattage du code

## Seed Data

up le container postgres

```
npm -w @lukyss-bar/api run db:migrate
npm -w @lukyss-bar/api run db:seed
```

## API

L'API (`apps/api`) est écrite en Rust : axum (routes/websocket), sqlx
(Postgres, requêtes vérifiées à la compilation), utoipa (Swagger sur `/docs`
et `/docs-json`), ts-rs (types partagés avec le frontend, exportés dans
`packages/api-types`), jsonwebtoken + bcrypt (auth). Voir
`docs/nestjs-legacy.md` pour l'ancienne implémentation NestJS (migration
terminée, conservée pour référence historique).

### fonctionnalités

- liste des cocktails - ok
- cocktails par id - ok
- créer un cocktail si users admin - ok
- générer des codes promo si user admin - ok
- modifier un coktail si user admin (image, nom, prix) - ok
- save image dans /upload - ok
- crud ingredient si user admin - ok
- ajouter/modifier/supprimer des ingrédients a un cocktail si user admin - ok
- gérer le stock si admin - ok
	- passer un ingrédient de false a true et inversement - ok
- creer et lire une commande - user - ok
- voir les commandes si user admin - ok 
- faire une commande si user normal + code promo pour valdier commande - ok
	-> retourne liste cocktails, code promo utilisé, puis objet commande avec statut et prix total
- Editer le Status d'une commande admin - ok
- types partagés + client front générés (ts-rs, `packages/api-types`) - ok
- temps reel pour suivi de commande (commande en attente d'acceptation, acceptee, en preparation, prete) - ok (WebSocket natif axum)
- auto doc swagger pour l'api - ok sur /docs et /docs-json
- Front Next
  - Page Accueil
  - Page cocktails
  - Page cocktails details
  - Page Commande
  - Page front suivi commande
- Front Mobile

### crates (Rust)

- sqlx pour accès db postgres
- jsonwebtoken + bcrypt pour authentification

## Tests

### API Rust (`apps/api`)

- **Unit tests** colocalisés (`#[cfg(test)] mod tests`) dans les modules à logique pure : `auth/jwt.rs`, `auth/password.rs`, `commandes/repo.rs` (`normalize_code`).
- **Integration tests** dans `apps/api/tests/*.rs` : montent le `Router` complet (`lukyss_bar_api::build_router`) et envoient de vraies requêtes HTTP via `tower::ServiceExt::oneshot`, sans binder de port. Chaque test tourne sur une DB Postgres isolée créée/droppée automatiquement par `#[sqlx::test]` (nécessite juste un `DATABASE_URL` valide, cf. `docker-compose.yml`). Hors scope volontaire : l'upload réel d'image vers R2 (nécessiterait un mock S3 type MinIO) et le WebSocket au-delà d'une connexion basique.
- `cargo test` (depuis `apps/api`, avec le Postgres de dev up) lance les deux.

**Cache offline sqlx** (`apps/api/.sqlx/`) : sqlx vérifie normalement chaque requête `query!`/`query_as!` contre une vraie DB à la compilation. Ce cache (généré par `cargo sqlx prepare -- --all-targets`) permet de compiler avec `SQLX_OFFLINE=true` à la place — indispensable pour le build Docker de l'API (aucune DB disponible pendant `docker build`) et pour accélérer la CI. **À régénérer et committer après toute modification d'une requête SQL**, sinon le build Docker/CI utilisera un cache périmé.

### Contrat web/mobile ↔ api (`packages/api-contract-tests`)

Suite [vitest](https://vitest.dev/) qui utilise le client HTTP généré (`packages/api-types/src/client.ts`) — le même que consommera l'app mobile plus tard — contre une vraie instance de l'API + Postgres migrée/seedée (`cargo run --bin seed`). Vérifie que le JSON réellement renvoyé par l'API correspond aux types `ts-rs`, ce que les tests Rust ne peuvent pas détecter côté client. Couvre : login, parcours commande complet (calcul du total, code promo), diffusion du statut via WebSocket.

```
npm run test -w @lukyss-bar/api-contract-tests
```

(nécessite l'API lancée en local sur `API_URL`, par défaut `http://localhost:3001`)

## CI/CD

### CI (`.github/workflows/ci.yml`)

Sur chaque PR et push (`main`, `dev`) :

- `api-test` : `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test` (service Postgres GitHub Actions).
- `api-types-drift` : régénère les bindings TS (`cargo run --bin export_types`) et échoue si `packages/api-types/generated` diffère de ce qui est committé — évite d'oublier de régénérer les types après avoir changé un type Rust.
- `web-build` : lint + check-types + build de `web` et de ses dépendances internes.
- `contract-tests` : démarre l'API (migrations auto au boot) + la seed, lance `packages/api-contract-tests`.
- `docker-build` : construit les deux images Docker (sans les pousser) pour détecter une régression de `Dockerfile` avant qu'elle n'arrive en CD.

### CD (`.github/workflows/cd.yml`)

**api et web se versionnent et se déploient indépendamment** — jamais sur un simple push sur `main`, seulement sur un tag préfixé par le service concerné :

```bash
git tag api-v1.2.0 && git push origin api-v1.2.0   # ne build/déploie que l'API
git tag web-v2.0.0 && git push origin web-v2.0.0   # ne build/déploie que le web
```

Chaque tag ne déclenche que le job du service correspondant (`build-and-push-api`/`deploy-api` ou `build-and-push-web`/`deploy-web`, filtrés par `startsWith(github.ref_name, 'api-v'|'web-v')`) : publier une nouvelle version de l'un ne touche jamais l'image ni le conteneur de l'autre. Chaque tag produit 3 images (`1.2.0`, `1.2`, `latest`) sur `ghcr.io/q-lukyss/lukyss-bar-{api,web}`. Le déploiement met à jour `IMAGE_TAG_API`/`IMAGE_TAG_WEB` directement dans le `.env` du serveur (pas juste en variable de commande) puis ne `pull`/`up -d` que le service concerné — un `docker compose up -d` manuel plus tard repart donc de la dernière version déployée, pas de `latest`.

Secrets/variables GitHub requis (Settings → Secrets and variables → Actions) : voir `TODO.md`.

## Déploiement (Docker)

`docker-compose.prod.yml` (à copier sur le VPS avec un `.env` dérivé de `env.prod`, cf. `TODO.md`) démarre :

- `postgres` — pas de port publié sur l'hôte (accès interne au réseau docker uniquement).
- `api` — image `apps/api/Dockerfile` (multi-stage `cargo-chef`, build en `SQLX_OFFLINE=true`). Les migrations sont embarquées dans le binaire (`sqlx::migrate!()`) et appliquées automatiquement au démarrage du conteneur : pas de `sqlx-cli` ni d'étape séparée à prévoir.
- `web` — image `apps/web/Dockerfile` (Next.js en mode `standalone`, buildée avec `turbo prune` pour un contexte Docker minimal). **`NEXT_PUBLIC_API_URL` est inlinée au build**, via `--build-arg` côté CD — la changer nécessite de republier une image, pas juste de redémarrer le conteneur.
- `postgres-backup` — dump quotidien + rotation (7j/4sem/6mois) via [`prodrigestivill/postgres-backup-local`](https://github.com/prodrigestivill/docker-postgres-backup-local), zéro code à écrire.

### Reverse proxy (Traefik)

Le routage HTTPS est délégué à une stack **Traefik existante sur le VPS, en dehors de ce projet** (pas de service Traefik dans `docker-compose.prod.yml`). `api` et `web` rejoignent le réseau docker externe de cette stack (`traefik-public` par défaut) en plus de leur réseau interne, et portent des labels Traefik plutôt qu'un fichier de config dédié :

```yaml
labels:
  - traefik.enable=true
  - traefik.docker.network=${TRAEFIK_NETWORK}
  - traefik.http.routers.lukyss-bar-web.rule=Host(`${DOMAIN}`)
  - traefik.http.routers.lukyss-bar-web.entrypoints=${TRAEFIK_ENTRYPOINT:-websecure}
  - traefik.http.routers.lukyss-bar-web.tls.certresolver=${TRAEFIK_CERTRESOLVER:-letsencrypt}
  - traefik.http.services.lukyss-bar-web.loadbalancer.server.port=3000
```

Trois variables dans `.env` (voir `env.prod`) doivent correspondre **exactement** à la stack Traefik déjà en place sur le serveur, pas à ce projet :

- `TRAEFIK_NETWORK` — nom du réseau docker externe que Traefik écoute (`docker network ls` sur le VPS pour le retrouver).
- `TRAEFIK_ENTRYPOINT` — nom de l'entrypoint HTTPS déclaré côté Traefik (souvent `websecure`).
- `TRAEFIK_CERTRESOLVER` — nom du resolver ACME/Let's Encrypt déclaré côté Traefik (souvent `letsencrypt`).

`DOMAIN`/`API_DOMAIN` (les noms de domaine réels) pilotent les règles `Host(...)`.

<!--### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```-->

<!--### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)-->
