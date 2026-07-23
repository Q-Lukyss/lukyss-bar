# syntax=docker/dockerfile:1

FROM rust:1-slim-bookworm AS chef
WORKDIR /app
RUN for i in 1 2 3 4 5; do \
        apt-get update && apt-get install -y --no-install-recommends \
            cmake perl pkg-config curl \
        && break || sleep 2; \
    done \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef --locked

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# SQLX_OFFLINE : les requêtes sqlx sont vérifiées contre le cache .sqlx/
# (généré par `cargo sqlx prepare`, cf. apps/api/tests) plutôt que contre une
# vraie base — aucune DB disponible pendant le build.
ENV SQLX_OFFLINE=true
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin lukyss-bar-api

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --uid 1000 appuser
WORKDIR /app
COPY --from=builder /app/target/release/lukyss-bar-api /usr/local/bin/lukyss-bar-api
USER appuser
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1
# Les migrations sont embarquées dans le binaire (sqlx::migrate! dans lib.rs)
# et appliquées automatiquement au démarrage : DATABASE_URL suffit, pas de
# sqlx-cli ni d'étape de migration séparée en prod.
CMD ["lukyss-bar-api"]
