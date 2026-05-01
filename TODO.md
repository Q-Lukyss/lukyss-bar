## Bloquants

1. **Variables d'environnement** — `NEXT_PUBLIC_API_URL` doit pointer sur l'API prod (pas localhost:3001). Idem pour la DB connection string, le secret JWT, et l'URL Convex.

2. **Migration DB prod** — la colonne `description` a été ajoutée via le workaround `apply-migration.ts` en local. Il faut s'assurer qu'elle existe sur la base de prod avant le déploiement.

3. **CORS côté API** — l'API NestJS autorise probablement `*` ou `localhost`. Il faut la restreindre au domaine de prod du frontend.

4. **`remotePatterns` dans `next.config.js`** — le wildcard `https://**` fonctionne mais est permissif. À remplacer par le hostname exact de l'API prod une fois connu.

## Important mais non bloquant

5. **Régénérer le SDK nestia** — l'endpoint `DELETE /commandes/:id` a été ajouté mais le SDK n'a pas été regénéré (`npm run sdk` ou équivalent). Le front utilise un `fetch` natif en contournement, ce qui fonctionne mais casse la cohérence typée.

6. **Secret JWT fort** — vérifier que le secret JWT en prod n'est pas une valeur par défaut/dev.

7. Virer Convex

---

## Cosmétique / dette

8. La fonction `imageUrl()` est dupliquée dans `cocktail-card.tsx` et `cocktails/[id]/page.tsx` — peut être factorisée dans `lib/` mais ça ne bloque pas.

9. La page home a `export const dynamic = "force-dynamic"` — correct pour un bar dont le contenu change, mais à valider que c'est bien voulu.
