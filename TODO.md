## Bloquants

1. **Variables d'environnement** — `NEXT_PUBLIC_API_URL` doit pointer sur l'API prod (pas localhost:3001). Idem pour `DATABASE_URL` et `JWT_SECRET` côté `apps/api` (voir `apps/api/.env`, actuellement des valeurs de dev).
2. **CORS côté API** — déjà restreint à `FRONTEND_URL` (pas de wildcard) dans `apps/api/src/lib.rs::build_cors`, mais vérifier que `FRONTEND_URL` est bien réglée sur le domaine de prod exact au déploiement.
3. **`remotePatterns` dans `next.config.js`** — le wildcard `https://**` fonctionne mais est permissif. À remplacer par le hostname exact de l'API prod une fois connu.


