## Bloquants

1. **Variables d'environnement** — `NEXT_PUBLIC_API_URL` doit pointer sur l'API prod (pas localhost:3001). Idem pour la DB connection string, le secret JWT, et l'URL Convex.
2. **CORS côté API** — l'API NestJS autorise probablement `*` ou `localhost`. Il faut la restreindre au domaine de prod du frontend.
3. **`remotePatterns` dans `next.config.js`** — le wildcard `https://**` fonctionne mais est permissif. À remplacer par le hostname exact de l'API prod une fois connu.


## Important mais non bloquant

7. Virer Convex
