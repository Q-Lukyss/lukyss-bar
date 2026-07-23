// Les routes create/update de cocktails prennent un formulaire multipart
// (upload d'image vers R2) — hors scope de ces tests d'intégration (cf. plan
// DevOps, phase 1 : nécessiterait un mock S3 type MinIO, pas rentable ici).
// On couvre donc uniquement les routes JSON : lecture et liaison ingrédients.
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

async fn insert_ingredient(pool: &PgPool, name: &str) -> String {
    let id = ulid::Ulid::new().to_string();
    sqlx::query!(
        "INSERT INTO ingredients (id, name, stock) VALUES ($1, $2, true)",
        id,
        name
    )
    .execute(pool)
    .await
    .unwrap();
    id
}

#[sqlx::test]
async fn list_returns_all_cocktails(pool: PgPool) {
    insert_cocktail(&pool, "Mojito", 9).await;

    let app = common::app(pool);
    let request = common::json_request("GET", "/cocktails", None, None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body.as_array().unwrap().len(), 1);
    assert_eq!(body[0]["name"], "Mojito");
    assert_eq!(body[0]["price"], 9);
}

#[sqlx::test]
async fn get_by_id_returns_the_cocktail_with_its_ingredients(pool: PgPool) {
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;
    let ingredient_id = insert_ingredient(&pool, "Rhum blanc").await;
    sqlx::query!(
        "INSERT INTO cocktails_ingredients (id, cocktail_id, ingredient_id, quantity, unity) VALUES ($1, $2, $3, $4, $5)",
        ulid::Ulid::new().to_string(),
        cocktail_id,
        ingredient_id,
        5,
        "cl"
    )
    .execute(&pool)
    .await
    .unwrap();

    let app = common::app(pool);
    let request = common::json_request("GET", &format!("/cocktails/{cocktail_id}"), None, None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["name"], "Mojito");
    let ingredients = body["ingredients"].as_array().unwrap();
    assert_eq!(ingredients.len(), 1);
    assert_eq!(ingredients[0]["name"], "Rhum blanc");
    assert_eq!(ingredients[0]["quantity"], 5);
}

#[sqlx::test]
async fn get_by_id_returns_404_when_missing(pool: PgPool) {
    let app = common::app(pool);
    let request = common::json_request("GET", "/cocktails/does-not-exist", None, None);

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::NOT_FOUND);
}

#[sqlx::test]
async fn admin_can_link_an_ingredient_to_a_cocktail(pool: PgPool) {
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;
    let ingredient_id = insert_ingredient(&pool, "Menthe").await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        &format!("/cocktails/{cocktail_id}/ingredients"),
        Some(&common::admin_token()),
        Some(json!({ "ingredientId": ingredient_id, "quantity": 10, "unity": "feuilles" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);

    let body: Value = common::body_json(response).await;
    assert_eq!(body["quantity"], 10);
    assert_eq!(body["unity"], "feuilles");
}

#[sqlx::test]
async fn linking_an_ingredient_requires_admin(pool: PgPool) {
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;
    let ingredient_id = insert_ingredient(&pool, "Menthe").await;

    let app = common::app(pool);
    let request = common::json_request(
        "POST",
        &format!("/cocktails/{cocktail_id}/ingredients"),
        Some(&common::user_token()),
        Some(json!({ "ingredientId": ingredient_id, "quantity": 10, "unity": "feuilles" })),
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::FORBIDDEN);
}

#[sqlx::test]
async fn admin_can_remove_an_ingredient_link(pool: PgPool) {
    let cocktail_id = insert_cocktail(&pool, "Mojito", 9).await;
    let ingredient_id = insert_ingredient(&pool, "Menthe").await;
    let link_id = ulid::Ulid::new().to_string();
    sqlx::query!(
        "INSERT INTO cocktails_ingredients (id, cocktail_id, ingredient_id, quantity, unity) VALUES ($1, $2, $3, $4, $5)",
        link_id,
        cocktail_id,
        ingredient_id,
        10,
        "feuilles"
    )
    .execute(&pool)
    .await
    .unwrap();

    let app = common::app(pool);
    let request = common::json_request(
        "DELETE",
        &format!("/cocktails/{cocktail_id}/ingredients/{link_id}"),
        Some(&common::admin_token()),
        None,
    );

    let response = common::send(app, request).await;
    common::assert_status(&response, StatusCode::OK);
}
