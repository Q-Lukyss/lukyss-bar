# syntax=docker/dockerfile:1
#
# Build à lancer depuis la racine du monorepo (contexte = racine, pas
# apps/web) : `docker build -f apps/web/Dockerfile .` — nécessaire pour que
# `turbo prune` voie tout le workspace (packages/api-types, packages/ui, ...).
#
# Debian (pas Alpine/musl) : lightningcss (utilisé par Tailwind v4 via
# @tailwindcss/postcss) n'expose pas de binaire natif linux-musl, le build
# échoue sur Alpine avec "Cannot find module '../lightningcss.linux-x64-musl.node'".

FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@2.6.3
COPY . .
# --docker sépare out/json (uniquement les package.json, pour un cache
# `npm ci` qui ne casse pas à chaque changement de code source) de
# out/full (le code source réellement nécessaire à `web`).
RUN turbo prune @lukyss-bar/web --docker

FROM node:22-bookworm-slim AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
# `npm install` plutôt que `npm ci` : le lockfile est committé depuis un poste
# de dev Windows et ne référence donc que le binaire natif lightningcss
# win32 (dépendance optionnelle de Tailwind v4) — `ci` refuserait d'ajouter
# la variante linux-x64-gnu manquante, `install` va la chercher normalement.
RUN npm install --no-audit --no-fund
# Contournement d'un bug npm workspaces + optionalDependencies : même en
# install propre (sans lockfile), le binaire natif linux-x64-gnu de
# lightningcss (utilisé par Tailwind v4) n'est pas installé automatiquement
# dans ce monorepo hoisté. On le réinstalle explicitement à la version
# résolue par npm, sinon `next build` échoue en conteneur (glibc/Debian).
RUN LIGHTNINGCSS_VERSION=$(node -p "require('/app/node_modules/lightningcss/package.json').version") \
    && npm install --no-save --no-audit --no-fund "lightningcss-linux-x64-gnu@${LIGHTNINGCSS_VERSION}"

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=installer /app .
COPY --from=pruner /app/out/full/ .
# NEXT_PUBLIC_API_URL est inlinée au build par Next.js : elle doit donc être
# passée en --build-arg avec l'URL prod exacte de l'API (résout le bloquant
# du TODO.md — cf. plan DevOps, phase 0/3).
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
RUN npx turbo run build --filter=@lukyss-bar/web...

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
