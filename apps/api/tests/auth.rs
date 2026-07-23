mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};
use sqlx::PgPool;

async fn insert_user(pool: &PgPool, email: &str, password: &str, is_admin: bool, is_active: bool) {
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();
    sqlx::query!(
        "INSERT INTO users (id, name, email, password, is_admin, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
        ulid::Ulid::new().to_string(),
        "Quentin",
        email,
        hash,
        is_admin,
        is_active,
    )
    .execute(pool)
    .await
    .unwrap();
}

#[sqlx::test]
async fn login_succeeds_with_valid_credentials(pool: PgPool) {
    insert_user(&pool, "quentin@test.local", "masterbarman", true, true).await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/auth/login",
        None,
        Some(json!({ "email": "quentin@test.local", "password": "masterbarman" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["user"]["email"], "quentin@test.local");
    assert_eq!(body["user"]["is_admin"], true);
    assert!(body["access_token"].as_str().is_some_and(|s| !s.is_empty()));
}

#[sqlx::test]
async fn login_rejects_the_wrong_password(pool: PgPool) {
    insert_user(&pool, "quentin@test.local", "masterbarman", true, true).await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/auth/login",
        None,
        Some(json!({ "email": "quentin@test.local", "password": "wrong-password" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::UNAUTHORIZED);
}

#[sqlx::test]
async fn login_rejects_an_unknown_email(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/auth/login",
        None,
        Some(json!({ "email": "ghost@test.local", "password": "whatever" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::UNAUTHORIZED);
}

#[sqlx::test]
async fn login_rejects_a_disabled_user(pool: PgPool) {
    insert_user(&pool, "quentin@test.local", "masterbarman", true, false).await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/auth/login",
        None,
        Some(json!({ "email": "quentin@test.local", "password": "masterbarman" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::UNAUTHORIZED);
}

#[sqlx::test]
async fn login_rejects_a_malformed_email(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/auth/login",
        None,
        Some(json!({ "email": "not-an-email", "password": "whatever" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::BAD_REQUEST);
}
