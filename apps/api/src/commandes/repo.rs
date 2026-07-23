use std::collections::HashMap;

use sqlx::PgPool;
use ulid::Ulid;
use uuid::Uuid;

use crate::{
    error::ApiError,
    types::{
        cocktails::DeleteMessage,
        commandes::{CommandeItem, CommandeRow, CommandeStatus, CommandeView},
    },
};

pub struct CreateItem {
    pub cocktail_id: String,
    pub quantity: i32,
}

fn normalize_code(input: &str) -> String {
    input.trim().to_uppercase()
}

async fn code_exists(db: &PgPool, code: &str) -> Result<bool, ApiError> {
    let row = sqlx::query!(r#"SELECT id FROM codes WHERE code = $1"#, code)
        .fetch_optional(db)
        .await?;

    Ok(row.is_some())
}

struct CocktailPrice {
    id: String,
    price: i32,
}

/// Miroir de `CommandesService.create`.
pub async fn create(
    db: &PgPool,
    customer_name: &str,
    promo_code: &str,
    items: &[CreateItem],
) -> Result<CommandeView, ApiError> {
    let promo_code = normalize_code(promo_code);

    if !code_exists(db, &promo_code).await? {
        return Err(ApiError::BadRequest("Code promo invalide".to_string()));
    }

    let cocktail_ids: Vec<String> = items.iter().map(|i| i.cocktail_id.clone()).collect();

    let cocktail_rows = sqlx::query_as!(
        CocktailPrice,
        r#"SELECT id, price FROM cocktails WHERE id = ANY($1)"#,
        &cocktail_ids
    )
    .fetch_all(db)
    .await?;

    if cocktail_rows.len() != cocktail_ids.len() {
        return Err(ApiError::BadRequest(
            "Un ou plusieurs cocktails sont introuvables".to_string(),
        ));
    }

    let price_by_id: HashMap<&str, i32> = cocktail_rows
        .iter()
        .map(|c| (c.id.as_str(), c.price))
        .collect();

    let mut total_price = 0i32;
    for item in items {
        let price = price_by_id
            .get(item.cocktail_id.as_str())
            .copied()
            .ok_or_else(|| {
                ApiError::BadRequest(format!("Cocktail introuvable: {}", item.cocktail_id))
            })?;
        total_price += price * item.quantity;
    }

    let commande_id = Ulid::new().to_string();
    let public_token = Uuid::new_v4().simple().to_string();

    sqlx::query!(
        r#"INSERT INTO commandes (id, customer_name, promo_code, public_token, status, total_price)
           VALUES ($1, $2, $3, $4, 'PENDING'::commande_status, $5)"#,
        commande_id,
        customer_name,
        promo_code,
        public_token,
        total_price
    )
    .execute(db)
    .await?;

    for item in items {
        sqlx::query!(
            r#"INSERT INTO cocktails_commandes (id, commande_id, cocktail_id, quantity) VALUES ($1, $2, $3, $4)"#,
            Ulid::new().to_string(),
            commande_id,
            item.cocktail_id,
            item.quantity
        )
        .execute(db)
        .await?;
    }

    get_view(db, &commande_id).await
}

async fn get_row(db: &PgPool, id: &str) -> Result<CommandeRow, ApiError> {
    sqlx::query_as!(
        CommandeRow,
        r#"SELECT id, customer_name, promo_code, public_token, total_price, created_at, updated_at,
                  status as "status: CommandeStatus"
           FROM commandes WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Commande introuvable".to_string()))
}

async fn items_for_commande(db: &PgPool, commande_id: &str) -> Result<Vec<CommandeItem>, ApiError> {
    let rows = sqlx::query_as!(
        CommandeItem,
        r#"SELECT cc.id, cc.cocktail_id, cc.quantity, c.name as cocktail_name, c.image as cocktail_image,
                  c.price as unit_price, (c.price * cc.quantity) as "line_total!"
           FROM cocktails_commandes cc
           INNER JOIN cocktails c ON c.id = cc.cocktail_id
           WHERE cc.commande_id = $1"#,
        commande_id
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

pub async fn get_view(db: &PgPool, id: &str) -> Result<CommandeView, ApiError> {
    let commande = get_row(db, id).await?;
    let items = items_for_commande(db, id).await?;
    Ok(CommandeView { commande, items })
}

pub async fn get_by_public_token(db: &PgPool, token: &str) -> Result<CommandeView, ApiError> {
    let row = sqlx::query!(r#"SELECT id FROM commandes WHERE public_token = $1"#, token)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| ApiError::NotFound("Commande introuvable".to_string()))?;

    get_view(db, &row.id).await
}

pub async fn list_all(db: &PgPool) -> Result<Vec<CommandeRow>, ApiError> {
    let rows = sqlx::query_as!(
        CommandeRow,
        r#"SELECT id, customer_name, promo_code, public_token, total_price, created_at, updated_at,
                  status as "status: CommandeStatus"
           FROM commandes ORDER BY created_at"#
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

pub async fn delete(db: &PgPool, id: &str) -> Result<DeleteMessage, ApiError> {
    get_row(db, id).await?;

    sqlx::query!(
        r#"DELETE FROM cocktails_commandes WHERE commande_id = $1"#,
        id
    )
    .execute(db)
    .await?;
    sqlx::query!(r#"DELETE FROM commandes WHERE id = $1"#, id)
        .execute(db)
        .await?;

    Ok(DeleteMessage {
        message: "Commande supprimée".to_string(),
    })
}

pub async fn update_status(
    db: &PgPool,
    id: &str,
    status: CommandeStatus,
) -> Result<CommandeRow, ApiError> {
    sqlx::query_as!(
        CommandeRow,
        r#"UPDATE commandes SET status = $2, updated_at = now() WHERE id = $1
           RETURNING id, customer_name, promo_code, public_token, total_price, created_at, updated_at,
                     status as "status: CommandeStatus""#,
        id,
        status as CommandeStatus
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Commande introuvable".to_string()))
}

#[cfg(test)]
mod tests {
    use super::normalize_code;

    #[test]
    fn normalize_code_trims_and_uppercases() {
        assert_eq!(normalize_code("  grandOpening  "), "GRANDOPENING");
    }

    #[test]
    fn normalize_code_is_idempotent() {
        assert_eq!(normalize_code("GRANDOPENING"), "GRANDOPENING");
    }
}
