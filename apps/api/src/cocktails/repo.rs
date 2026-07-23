use sqlx::PgPool;
use ulid::Ulid;

use crate::{
    error::ApiError,
    types::cocktails::{
        CocktailIngredientLinkRow, CocktailIngredientListItem, CocktailIngredientView,
        CocktailRow, CocktailView, DeleteMessage,
    },
};

pub async fn list(db: &PgPool) -> Result<Vec<CocktailRow>, ApiError> {
    let rows = sqlx::query_as!(
        CocktailRow,
        r#"SELECT id, name, description, image, price, created_at, updated_at FROM cocktails ORDER BY created_at"#
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

async fn get_row(db: &PgPool, id: &str) -> Result<CocktailRow, ApiError> {
    sqlx::query_as!(
        CocktailRow,
        r#"SELECT id, name, description, image, price, created_at, updated_at FROM cocktails WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Cocktail introuvable".to_string()))
}

pub async fn ensure_exists(db: &PgPool, id: &str) -> Result<(), ApiError> {
    get_row(db, id).await.map(|_| ())
}

async fn ingredients_for_cocktail(
    db: &PgPool,
    cocktail_id: &str,
) -> Result<Vec<CocktailIngredientView>, ApiError> {
    let rows = sqlx::query_as!(
        CocktailIngredientView,
        r#"SELECT ci.id, ci.ingredient_id, i.name, i.stock, ci.quantity, ci.unity, ci.created_at, ci.updated_at
           FROM cocktails_ingredients ci
           INNER JOIN ingredients i ON i.id = ci.ingredient_id
           WHERE ci.cocktail_id = $1"#,
        cocktail_id
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

pub async fn get_view(db: &PgPool, id: &str) -> Result<CocktailView, ApiError> {
    let cocktail = get_row(db, id).await?;
    let ingredients = ingredients_for_cocktail(db, id).await?;
    Ok(CocktailView::new(cocktail, ingredients))
}

pub async fn create(
    db: &PgPool,
    name: &str,
    price: i32,
    description: Option<&str>,
    image: Option<&str>,
) -> Result<CocktailRow, ApiError> {
    let id = Ulid::new().to_string();

    let row = sqlx::query_as!(
        CocktailRow,
        r#"INSERT INTO cocktails (id, name, description, image, price) VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, description, image, price, created_at, updated_at"#,
        id,
        name,
        description,
        image,
        price
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

#[allow(clippy::too_many_arguments)]
pub async fn update(
    db: &PgPool,
    id: &str,
    name: Option<&str>,
    price: Option<i32>,
    description: Option<&str>,
    image: Option<&str>,
) -> Result<CocktailRow, ApiError> {
    sqlx::query_as!(
        CocktailRow,
        r#"UPDATE cocktails
           SET name = COALESCE($2, name),
               price = COALESCE($3, price),
               description = COALESCE($4, description),
               image = COALESCE($5, image),
               updated_at = now()
           WHERE id = $1
           RETURNING id, name, description, image, price, created_at, updated_at"#,
        id,
        name,
        price,
        description,
        image
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Cocktail introuvable".to_string()))
}

pub async fn list_cocktail_ingredients(
    db: &PgPool,
    cocktail_id: &str,
) -> Result<Vec<CocktailIngredientListItem>, ApiError> {
    ensure_exists(db, cocktail_id).await?;

    let rows = sqlx::query_as!(
        CocktailIngredientListItem,
        r#"SELECT ci.id, ci.cocktail_id, ci.ingredient_id, ci.quantity, ci.unity, ci.created_at, ci.updated_at,
                  i.name as ingredient_name, i.stock as ingredient_stock
           FROM cocktails_ingredients ci
           INNER JOIN ingredients i ON i.id = ci.ingredient_id
           WHERE ci.cocktail_id = $1"#,
        cocktail_id
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

async fn ingredient_exists(db: &PgPool, ingredient_id: &str) -> Result<bool, ApiError> {
    let row = sqlx::query!(
        r#"SELECT id FROM ingredients WHERE id = $1"#,
        ingredient_id
    )
    .fetch_optional(db)
    .await?;

    Ok(row.is_some())
}

async fn find_link_by_ingredient(
    db: &PgPool,
    cocktail_id: &str,
    ingredient_id: &str,
) -> Result<Option<String>, ApiError> {
    let row = sqlx::query!(
        r#"SELECT id FROM cocktails_ingredients WHERE cocktail_id = $1 AND ingredient_id = $2"#,
        cocktail_id,
        ingredient_id
    )
    .fetch_optional(db)
    .await?;

    Ok(row.map(|r| r.id))
}

pub async fn add_ingredient(
    db: &PgPool,
    cocktail_id: &str,
    ingredient_id: &str,
    quantity: i32,
    unity: &str,
) -> Result<CocktailIngredientLinkRow, ApiError> {
    ensure_exists(db, cocktail_id).await?;

    if !ingredient_exists(db, ingredient_id).await? {
        return Err(ApiError::NotFound("Ingrédient introuvable".to_string()));
    }

    if find_link_by_ingredient(db, cocktail_id, ingredient_id)
        .await?
        .is_some()
    {
        return Err(ApiError::BadRequest(
            "Cet ingrédient est déjà associé à ce cocktail".to_string(),
        ));
    }

    let id = Ulid::new().to_string();

    let row = sqlx::query_as!(
        CocktailIngredientLinkRow,
        r#"INSERT INTO cocktails_ingredients (id, cocktail_id, ingredient_id, quantity, unity)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, cocktail_id, ingredient_id, quantity, unity, created_at, updated_at"#,
        id,
        cocktail_id,
        ingredient_id,
        quantity,
        unity
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

#[allow(clippy::too_many_arguments)]
pub async fn update_ingredient_link(
    db: &PgPool,
    cocktail_id: &str,
    link_id: &str,
    ingredient_id: Option<&str>,
    quantity: Option<i32>,
    unity: Option<&str>,
) -> Result<CocktailIngredientLinkRow, ApiError> {
    ensure_exists(db, cocktail_id).await?;

    let existing = sqlx::query!(
        r#"SELECT id FROM cocktails_ingredients WHERE id = $1 AND cocktail_id = $2"#,
        link_id,
        cocktail_id
    )
    .fetch_optional(db)
    .await?;

    if existing.is_none() {
        return Err(ApiError::NotFound(
            "Association cocktail / ingrédient introuvable".to_string(),
        ));
    }

    if let Some(new_ingredient_id) = ingredient_id {
        if !ingredient_exists(db, new_ingredient_id).await? {
            return Err(ApiError::NotFound("Ingrédient introuvable".to_string()));
        }

        if let Some(duplicate_id) =
            find_link_by_ingredient(db, cocktail_id, new_ingredient_id).await?
        {
            if duplicate_id != link_id {
                return Err(ApiError::BadRequest(
                    "Cet ingrédient est déjà associé à ce cocktail".to_string(),
                ));
            }
        }
    }

    sqlx::query_as!(
        CocktailIngredientLinkRow,
        r#"UPDATE cocktails_ingredients
           SET ingredient_id = COALESCE($2, ingredient_id),
               quantity = COALESCE($3, quantity),
               unity = COALESCE($4, unity),
               updated_at = now()
           WHERE id = $1
           RETURNING id, cocktail_id, ingredient_id, quantity, unity, created_at, updated_at"#,
        link_id,
        ingredient_id,
        quantity,
        unity
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Association cocktail / ingrédient introuvable".to_string()))
}

pub async fn delete_ingredient_link(
    db: &PgPool,
    cocktail_id: &str,
    link_id: &str,
) -> Result<DeleteMessage, ApiError> {
    ensure_exists(db, cocktail_id).await?;

    let result = sqlx::query!(
        r#"DELETE FROM cocktails_ingredients WHERE id = $1 AND cocktail_id = $2"#,
        link_id,
        cocktail_id
    )
    .execute(db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound(
            "Association cocktail / ingrédient introuvable".to_string(),
        ));
    }

    Ok(DeleteMessage {
        message: "Ingrédient supprimé du cocktail".to_string(),
    })
}
