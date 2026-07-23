mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};
use sqlx::PgPool;

async fn insert_ingredient(pool: &PgPool, name: &str, stock: bool) -> String {
    let id = ulid::Ulid::new().to_string();
    sqlx::query!(
        "INSERT INTO ingredients (id, name, stock) VALUES ($1, $2, $3)",
        id,
        name,
        stock
    )
    .execute(pool)
    .await
    .unwrap();
    id
}

#[sqlx::test]
async fn list_returns_all_ingredients(pool: PgPool) {
    insert_ingredient(&pool, "Rhum blanc", true).await;
    insert_ingredient(&pool, "Menthe", false).await;

    let app = common::app(pool);
    let request = common::json_request("GET", "/ingredients", None, None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body.as_array().unwrap().len(), 2);
}

#[sqlx::test]
async fn get_by_id_returns_404_when_missing(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request("GET", "/ingredients/does-not-exist", None, None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::NOT_FOUND);
}

#[sqlx::test]
async fn create_requires_admin(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/ingredients",
        Some(&common::user_token()),
        Some(json!({ "name": "Vodka" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::FORBIDDEN);
}

#[sqlx::test]
async fn create_requires_authentication(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/ingredients",
        None,
        Some(json!({ "name": "Vodka" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::UNAUTHORIZED);
}

#[sqlx::test]
async fn admin_can_create_an_ingredient(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/ingredients",
        Some(&common::admin_token()),
        Some(json!({ "name": "Vodka", "stock": true })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["name"], "Vodka");
    assert_eq!(body["stock"], true);
}

#[sqlx::test]
async fn admin_can_toggle_stock(pool: PgPool) {
    let id = insert_ingredient(&pool, "Menthe", true).await;

    let app = common::app(pool);
    let request = common::json_request(
        "PATCH",
        &format!("/ingredients/{id}/out-of-stock"),
        Some(&common::admin_token()),
        None,
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["stock"], false);
}

#[sqlx::test]
async fn admin_can_delete_an_ingredient(pool: PgPool) {
    let id = insert_ingredient(&pool, "Menthe", true).await;

    let app = common::app(pool.clone());
    let request = common::json_request(
        "DELETE",
        &format!("/ingredients/{id}"),
        Some(&common::admin_token()),
        None,
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let remaining = sqlx::query!("SELECT id FROM ingredients WHERE id = $1", id)
        .fetch_optional(&pool)
        .await
        .unwrap();
    assert!(remaining.is_none());
}
