## Bloquants prod

1. **Variables d'environnement** — `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` doivent pointer sur les valeurs prod (pas les valeurs de dev de `apps/api/.env`). Ces valeurs seront injectées via les secrets GitHub Actions au déploiement (CD, cf. `.github/workflows/cd.yml`), jamais commitées. `NEXT_PUBLIC_API_URL` est inlinée **au build** de l'image `web` (`--build-arg`), les autres sont lues à l'exécution par l'API.
2. **CORS côté API** — restreint à `FRONTEND_URL` (pas de wildcard) dans `apps/api/src/lib.rs::build_cors`. Vérifier que `FRONTEND_URL` est bien réglée sur le domaine de prod exact au déploiement.
3. ~~**`remotePatterns` dans `next.config.js`**~~ — fait : dérivé dynamiquement de `NEXT_PUBLIC_API_URL` (plus de wildcard `https://**`).

## Mise en place du déploiement (une fois, avant le premier `git tag` de release)

- **Secrets du repo GitHub** (Settings → Secrets and variables → Actions → Secrets), utilisés par `.github/workflows/cd.yml` :
  - `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (clé privée SSH), `DEPLOY_PATH` (dossier sur le VPS contenant `docker-compose.prod.yml`).
- **Variable du repo** (mêmes réglages, onglet Variables) : `NEXT_PUBLIC_API_URL` (ex: `https://api.exemple.fr`) — inlinée au build de l'image `web`.
- **Sur le VPS**, avant le premier déploiement : installer Docker + Docker Compose, s'assurer que la stack Traefik existante tourne déjà et note son réseau docker externe (`docker network ls`), copier `docker-compose.prod.yml` dans `DEPLOY_PATH`, créer `.env` à partir de `env.prod` (jamais commité) avec les vraies valeurs (mots de passe, `JWT_SECRET`, credentials R2, domaines, `TRAEFIK_NETWORK`/`TRAEFIK_ENTRYPOINT`/`TRAEFIK_CERTRESOLVER` — cf. README "Reverse proxy (Traefik)"), configurer le DNS de `DOMAIN`/`API_DOMAIN` vers ce serveur, puis `docker compose -f docker-compose.prod.yml up -d` une première fois manuellement.
- **Protection de la branche `main`** (Settings → Branches) : exiger que `ci.yml` passe avant de merger — `cd.yml` se déclenche sur un tag `api-vX.Y.Z` ou `web-vX.Y.Z` (cf. README "CI/CD", versionnage indépendant des deux services), donc s'assurer que le tag est bien créé depuis un `main` où la CI est verte.
