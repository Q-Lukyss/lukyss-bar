// Chaque fichier tests/*.rs compile ce module dans son propre binaire — une
// fonction inutilisée dans l'un d'eux (ex: admin_token dans auth.rs) reste
// utilisée par les autres, donc pas de dead_code réel malgré ce qu'un seul
// binaire peut laisser penser.
#![allow(dead_code)]

use std::sync::Arc;

use axum::{
    body::{Body, to_bytes},
    http::{Request, Response, StatusCode, header},
};
use dashmap::DashMap;
use lukyss_bar_api::{
    auth::jwt, build_router, state::AppState, storage::R2Storage, types::auth::AuthUser,
};
use serde::de::DeserializeOwned;
use sqlx::PgPool;
use tower::ServiceExt;

pub const JWT_SECRET: &str = "test-secret";
pub const FRONTEND_URL: &str = "http://localhost:3000";

/// Monte l'app complète sur un pool de test (une DB isolée par test grâce à
/// `#[sqlx::test]`), avec un `R2Storage` factice — son constructeur ne fait
/// aucun appel réseau, il ne peut donc jamais être sollicité que par les
/// routes d'upload (hors scope de ces tests, cf. plan).
pub fn app(db: PgPool) -> axum::Router {
    let storage = R2Storage::new(
        "test-account",
        "test-access-key",
        "test-secret-key",
        "test-bucket",
    );

    let state = AppState {
        db,
        ws_registry: Arc::new(DashMap::new()),
        jwt_secret: JWT_SECRET.into(),
        frontend_url: FRONTEND_URL.into(),
        storage,
    };

    build_router(state).expect("build_router should succeed with a valid FRONTEND_URL")
}

fn token_for(id: &str, name: &str, email: &str, is_admin: bool) -> String {
    let user = AuthUser {
        id: id.to_string(),
        name: name.to_string(),
        email: email.to_string(),
        is_admin,
    };
    jwt::sign(&user, JWT_SECRET).expect("signing a test token should succeed")
}

pub fn admin_token() -> String {
    token_for("admin-test-id", "Admin Test", "admin@test.local", true)
}

pub fn user_token() -> String {
    token_for("user-test-id", "User Test", "user@test.local", false)
}

pub fn json_request(
    method: &str,
    path: &str,
    token: Option<&str>,
    body: Option<serde_json::Value>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(path);

    if let Some(token) = token {
        builder = builder.header(header::AUTHORIZATION, format!("Bearer {token}"));
    }

    let body = match body {
        Some(value) => {
            builder = builder.header(header::CONTENT_TYPE, "application/json");
            Body::from(serde_json::to_vec(&value).unwrap())
        }
        None => Body::empty(),
    };

    builder.body(body).unwrap()
}

pub async fn body_json<T: DeserializeOwned>(response: Response<Body>) -> T {
    let bytes = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("reading the response body should succeed");
    serde_json::from_slice(&bytes).expect("the response body should be valid JSON matching T")
}

pub async fn send(app: axum::Router, request: Request<Body>) -> Response<Body> {
    app.oneshot(request)
        .await
        .expect("the request should be handled")
}

pub fn assert_status(response: &Response<Body>, expected: StatusCode) {
    assert_eq!(
        response.status(),
        expected,
        "unexpected status code (body not shown, check with body_json)"
    );
}
