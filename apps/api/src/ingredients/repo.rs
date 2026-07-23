use sqlx::PgPool;
use ulid::Ulid;

use crate::{error::ApiError, types::ingredients::IngredientRow};

pub async fn list(db: &PgPool) -> Result<Vec<IngredientRow>, ApiError> {
    let rows = sqlx::query_as!(
        IngredientRow,
        r#"SELECT id, name, stock, created_at, updated_at FROM ingredients ORDER BY created_at"#
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

pub async fn get_by_id(db: &PgPool, id: &str) -> Result<IngredientRow, ApiError> {
    sqlx::query_as!(
        IngredientRow,
        r#"SELECT id, name, stock, created_at, updated_at FROM ingredients WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Ingredient not found".to_string()))
}

pub async fn create(db: &PgPool, name: &str, stock: bool) -> Result<IngredientRow, ApiError> {
    let id = Ulid::new().to_string();

    let row = sqlx::query_as!(
        IngredientRow,
        r#"INSERT INTO ingredients (id, name, stock) VALUES ($1, $2, $3)
           RETURNING id, name, stock, created_at, updated_at"#,
        id,
        name,
        stock
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

pub async fn update(
    db: &PgPool,
    id: &str,
    name: Option<&str>,
    stock: Option<bool>,
) -> Result<IngredientRow, ApiError> {
    sqlx::query_as!(
        IngredientRow,
        r#"UPDATE ingredients
           SET name = COALESCE($2, name),
               stock = COALESCE($3, stock),
               updated_at = now()
           WHERE id = $1
           RETURNING id, name, stock, created_at, updated_at"#,
        id,
        name,
        stock
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Ingredient introuvable".to_string()))
}

pub async fn delete(db: &PgPool, id: &str) -> Result<IngredientRow, ApiError> {
    sqlx::query_as!(
        IngredientRow,
        r#"DELETE FROM ingredients WHERE id = $1
           RETURNING id, name, stock, created_at, updated_at"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Ingredient introuvable".to_string()))
}
