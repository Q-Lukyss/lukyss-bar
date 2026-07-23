pub mod auth;
pub mod cocktails;
pub mod codes;
pub mod commandes;
pub mod config;
pub mod error;
pub mod ingredients;
pub mod openapi;
pub mod routes;
pub mod state;
pub mod storage;
pub mod telemetry;
pub mod types;
pub mod uploads;

use std::sync::Arc;

use axum::{
    Router,
    extract::DefaultBodyLimit,
    http::{HeaderValue, Method, header},
    routing::get,
};
use dashmap::DashMap;
use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::{config::Config, openapi::ApiDoc, state::AppState, storage::R2Storage};

pub async fn run() -> anyhow::Result<()> {
    telemetry::init();

    let config = Config::from_env()?;

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    // Migrations embarquées dans le binaire à la compilation (macro `migrate!`)
    // et appliquées au démarrage : pas de `sqlx-cli` ni d'étape séparée
    // nécessaire en conteneur, juste `DATABASE_URL` pointant vers la prod.
    sqlx::migrate!().run(&db).await?;

    let storage = R2Storage::new(
        &config.r2_account_id,
        &config.r2_access_key_id,
        &config.r2_secret_access_key,
        &config.r2_bucket_name,
    );

    let state = AppState {
        db,
        ws_registry: Arc::new(DashMap::new()),
        jwt_secret: config.jwt_secret.into(),
        frontend_url: config.frontend_url.into(),
        storage,
    };

    let app = build_router(state)?;

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port)).await?;
    tracing::info!("LukyssBar API (Rust) écoute sur le port {}", config.port);
    tracing::info!("Documentation Swagger disponibles sur /docs");
    axum::serve(listener, app).await?;

    Ok(())
}

/// Construit le `Router` complet à partir d'un `AppState` déjà prêt — utilisé
/// par `run()` ainsi que par les tests d'intégration (`tests/common`), qui
/// montent l'app avec un pool/état de test sans passer par `main`/`Config`.
pub fn build_router(state: AppState) -> anyhow::Result<Router> {
    let cors = build_cors(&state.frontend_url)?;

    Ok(Router::new()
        .route("/", get(routes::root))
        .route("/health", get(routes::health))
        .nest("/auth", auth::routes::router())
        .nest("/ingredients", ingredients::routes::router())
        .nest("/cocktails", cocktails::routes::router())
        .nest("/codes", codes::routes::router())
        .nest("/commandes", commandes::routes::router())
        .merge(SwaggerUi::new("/docs").url("/docs-json", ApiDoc::openapi()))
        .nest("/uploads", uploads::router())
        .layer(DefaultBodyLimit::max(6 * 1024 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state))
}

fn build_cors(frontend_url: &str) -> anyhow::Result<CorsLayer> {
    let origin: HeaderValue = frontend_url.parse()?;

    Ok(CorsLayer::new()
        .allow_origin(origin)
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]))
}
