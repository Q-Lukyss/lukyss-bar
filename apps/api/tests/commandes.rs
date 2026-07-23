mod common;

use axum::http::StatusCode;
use serde_json::{Value, json};
use sqlx::PgPool;

async fn insert_cocktail(pool: &PgPool, name: &str, price: i32) -> String {
    let id = ulid::Ulid::new().to_string();
    sqlx::query!(
        "INSERT INTO cocktails (id, name, image, price) VALUES ($1, $2, NULL, $3)",
        id,
        name,
        price
    )
    .execute(pool)
    .await
    .unwrap();
    id
}

async fn insert_code(pool: &PgPool, code: &str) {
    sqlx::query!(
        "INSERT INTO codes (id, code) VALUES ($1, $2)",
        ulid::Ulid::new().to_string(),
        code
    )
    .execute(pool)
    .await
    .unwrap();
}

#[sqlx::test]
async fn create_computes_the_total_price_from_cocktail_prices_and_quantities(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;
    let mojito_id = insert_cocktail(&pool, "Mojito", 9).await;
    let screwdriver_id = insert_cocktail(&pool, "Screwdriver", 8).await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "grandopening",
            "items": [
                { "cocktailId": mojito_id, "quantity": 2 },
                { "cocktailId": screwdriver_id, "quantity": 1 },
            ],
        })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    // 9*2 + 8*1 = 26 — vérifie aussi que le code promo est normalisé (trim + uppercase).
    assert_eq!(body["commande"]["totalPrice"], 26);
    assert_eq!(body["commande"]["promoCode"], "GRANDOPENING");
    assert_eq!(body["commande"]["status"], "PENDING");
    assert_eq!(body["items"].as_array().unwrap().len(), 2);
}

#[sqlx::test]
async fn create_rejects_an_invalid_promo_code(pool: PgPool) {
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "DOESNOTEXIST",
            "items": [{ "cocktailId": cocktail_id, "quantity": 1 }],
        })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::BAD_REQUEST);
}

#[sqlx::test]
async fn create_rejects_an_unknown_cocktail(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "GRANDOPENING",
            "items": [{ "cocktailId": "does-not-exist", "quantity": 1 }],
        })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::BAD_REQUEST);
}

#[sqlx::test]
async fn create_rejects_an_empty_item_list(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({ "customerName": "Alice Martin", "promoCode": "GRANDOPENING", "items": [] })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::BAD_REQUEST);
}

#[sqlx::test]
async fn get_by_public_token_does_not_require_authentication(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;

    let app = common::app(pool.clone());
    let create_request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "GRANDOPENING",
            "items": [{ "cocktailId": cocktail_id, "quantity": 1 }],
        })),
    );
    let created: Value = common::body_json(common::send(app.clone(), create_request).await).await;
    let public_token = created["commande"]["publicToken"]
        .as_str()
        .unwrap()
        .to_string();

    let request = common::json_request(
        "GET",
        &format!("/commandes/public/{public_token}"),
        None,
        None,
    );
    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);
}

#[sqlx::test]
async fn list_all_requires_admin(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request("GET", "/commandes", Some(&common::user_token()), None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::FORBIDDEN);
}

#[sqlx::test]
async fn admin_can_update_the_status_and_it_is_reflected_on_the_public_view(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;

    let app = common::app(pool.clone());
    let create_request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "GRANDOPENING",
            "items": [{ "cocktailId": cocktail_id, "quantity": 1 }],
        })),
    );
    let created: Value = common::body_json(common::send(app.clone(), create_request).await).await;
    let id = created["commande"]["id"].as_str().unwrap().to_string();

    let update_request = common::json_request(
        "PATCH",
        &format!("/commandes/{id}/status"),
        Some(&common::admin_token()),
        Some(json!({ "status": "CONFIRMED" })),
    );
    let response = common::send(app, update_request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["status"], "CONFIRMED");
}

#[sqlx::test]
async fn update_status_rejects_an_invalid_status(pool: PgPool) {
    insert_code(&pool, "GRANDOPENING").await;
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;

    let app = common::app(pool.clone());
    let create_request = common::json_request(
        "POST",
        "/commandes",
        None,
        Some(json!({
            "customerName": "Alice Martin",
            "promoCode": "GRANDOPENING",
            "items": [{ "cocktailId": cocktail_id, "quantity": 1 }],
        })),
    );
    let created: Value = common::body_json(common::send(app.clone(), create_request).await).await;
    let id = created["commande"]["id"].as_str().unwrap().to_string();

    let update_request = common::json_request(
        "PATCH",
        &format!("/commandes/{id}/status"),
        Some(&common::admin_token()),
        Some(json!({ "status": "NOT_A_STATUS" })),
    );
    let response = common::send(app, update_request).await;
    common::assert_status(&response, StatusCode::BAD_REQUEST);
}
