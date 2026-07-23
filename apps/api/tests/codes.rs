mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};
use sqlx::PgPool;

async fn insert_code(pool: &PgPool, code: &str) -> String {
    let id = ulid::Ulid::new().to_string();
    sqlx::query!("INSERT INTO codes (id, code) VALUES ($1, $2)", id, code)
        .execute(pool)
        .await
        .unwrap();
    id
}

#[sqlx::test]
async fn list_requires_admin(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request("GET", "/codes", Some(&common::user_token()), None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::FORBIDDEN);
}

#[sqlx::test]
async fn admin_can_list_codes(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;

    let app = common::app(pool);
    let request = common::json_request("GET", "/codes", Some(&common::admin_token()), None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body.as_array().unwrap().len(), 1);
    assert_eq!(body[0]["code"], "GRANDOPENING");
}

#[sqlx::test]
async fn admin_can_create_a_code_with_an_explicit_value(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/codes",
        Some(&common::admin_token()),
        Some(json!({ "code": "HAPPYHOUR" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["code"], "HAPPYHOUR");
}

#[sqlx::test]
async fn admin_can_create_a_code_without_a_value(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/codes",
        Some(&common::admin_token()),
        Some(json!({ "code": null })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert!(body["code"].as_str().is_some_and(|c| !c.is_empty()));
}

#[sqlx::test]
async fn admin_can_delete_a_code(pool: PgPool) {
    let id = insert_code(&pool, "GRANDOPENING").await;

    let app = common::app(pool.clone());
    let request = common::json_request(
        "DELETE",
        &format!("/codes/{id}"),
        Some(&common::admin_token()),
        None,
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let remaining = sqlx::query!("SELECT id FROM codes WHERE id = $1", id)
        .fetch_optional(&pool)
        .await
        .unwrap();
    assert!(remaining.is_none());
}

#[sqlx::test]
async fn delete_returns_404_when_missing(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "DELETE",
        "/codes/does-not-exist",
        Some(&common::admin_token()),
        None,
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::NOT_FOUND);
}
