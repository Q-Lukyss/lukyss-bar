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
pub mod telemetry;
pub mod types;

use std::sync::Arc;

use axum::{
    Router,
    extract::DefaultBodyLimit,
    http::{HeaderValue, Method, header},
    routing::get,
};
use dashmap::DashMap;
use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, services::ServeDir, trace::TraceLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::{config::Config, openapi::ApiDoc, state::AppState};

pub async fn run() -> anyhow::Result<()> {
    telemetry::init();

    let config = Config::from_env()?;

    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    let upload_dir = std::env::current_dir()?.join("uploads");
    std::fs::create_dir_all(upload_dir.join("cocktails"))?;

    let cors = build_cors(&config.frontend_url)?;

    let state = AppState {
        db,
        ws_registry: Arc::new(DashMap::new()),
        jwt_secret: config.jwt_secret.into(),
        frontend_url: config.frontend_url.into(),
        upload_dir: Arc::new(upload_dir.clone()),
    };

    let app = Router::new()
        .route("/", get(routes::root))
        .route("/health", get(routes::health))
        .nest("/auth", auth::routes::router())
        .nest("/ingredients", ingredients::routes::router())
        .nest("/cocktails", cocktails::routes::router())
        .nest("/codes", codes::routes::router())
        .nest("/commandes", commandes::routes::router())
        .merge(SwaggerUi::new("/docs").url("/docs-json", ApiDoc::openapi()))
        .nest_service("/uploads", ServeDir::new(upload_dir))
        .layer(DefaultBodyLimit::max(6 * 1024 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", config.port)).await?;
    tracing::info!("LukyssBar API (Rust) écoute sur le port {}", config.port);
    tracing::info!("Documentation Swagger disponibles sur /docs");
    axum::serve(listener, app).await?;

    Ok(())
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
