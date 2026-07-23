use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{get, patch},
};
use serde::Deserialize;
use ts_rs::TS;
use utoipa::ToSchema;

use crate::{
    auth::extractors::AdminUser,
    error::{ApiError, ApiResult},
    state::AppState,
    types::ingredients::IngredientRow,
};

use super::repo;

fn validate_name(name: &str) -> ApiResult<()> {
    let len = name.chars().count();
    if len < 1 || len > 64 {
        return Err(ApiError::BadRequest(
            "name must be longer than or equal to 1 and shorter than or equal to 64 characters"
                .to_string(),
        ));
    }
    Ok(())
}

#[utoipa::path(
    get,
    operation_id = "list_ingredients",
    path = "/ingredients",
    responses((status = 200, description = "Liste des ingrédients", body = Vec<IngredientRow>)),
    tag = "ingredients"
)]
pub async fn list(State(state): State<AppState>) -> ApiResult<Json<Vec<IngredientRow>>> {
    Ok(Json(repo::list(&state.db).await?))
}

#[utoipa::path(
    get,
    operation_id = "get_ingredient_by_id",
    path = "/ingredients/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Ingrédient trouvé", body = IngredientRow),
        (status = 404, description = "Ingrédient introuvable"),
    ),
    tag = "ingredients"
)]
pub async fn get_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<IngredientRow>> {
    Ok(Json(repo::get_by_id(&state.db, &id).await?))
}

/// Miroir de `CreateIngredientDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[ts(export, export_to = "ingredients.ts")]
pub struct CreateIngredientRequest {
    name: String,
    stock: Option<bool>,
}

#[utoipa::path(
    post,
    operation_id = "create_ingredient",
    path = "/ingredients",
    request_body = CreateIngredientRequest,
    responses((status = 200, description = "Ingrédient créé", body = IngredientRow)),
    security(("bearer_auth" = [])),
    tag = "ingredients"
)]
pub async fn create(
    _admin: AdminUser,
    State(state): State<AppState>,
    Json(body): Json<CreateIngredientRequest>,
) -> ApiResult<Json<IngredientRow>> {
    let name = body.name.trim();
    validate_name(name)?;

    Ok(Json(
        repo::create(&state.db, name, body.stock.unwrap_or(true)).await?,
    ))
}

/// Miroir de `UpdateIngredientDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[ts(export, export_to = "ingredients.ts")]
pub struct UpdateIngredientRequest {
    name: Option<String>,
    stock: Option<bool>,
}

#[utoipa::path(
    patch,
    operation_id = "update_ingredient",
    path = "/ingredients/{id}",
    params(("id" = String, Path)),
    request_body = UpdateIngredientRequest,
    responses(
        (status = 200, description = "Ingrédient mis à jour", body = IngredientRow),
        (status = 404, description = "Ingrédient introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "ingredients"
)]
pub async fn update(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateIngredientRequest>,
) -> ApiResult<Json<IngredientRow>> {
    let trimmed_name = body.name.as_deref().map(str::trim);
    if let Some(name) = trimmed_name {
        validate_name(name)?;
    }

    Ok(Json(
        repo::update(&state.db, &id, trimmed_name, body.stock).await?,
    ))
}

#[utoipa::path(
    patch,
    path = "/ingredients/{id}/in-stock",
    params(("id" = String, Path)),
    responses((status = 200, description = "Ingrédient marqué en stock", body = IngredientRow)),
    security(("bearer_auth" = [])),
    tag = "ingredients"
)]
pub async fn set_in_stock(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<IngredientRow>> {
    Ok(Json(repo::update(&state.db, &id, None, Some(true)).await?))
}

#[utoipa::path(
    patch,
    path = "/ingredients/{id}/out-of-stock",
    params(("id" = String, Path)),
    responses((status = 200, description = "Ingrédient marqué hors stock", body = IngredientRow)),
    security(("bearer_auth" = [])),
    tag = "ingredients"
)]
pub async fn set_out_of_stock(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<IngredientRow>> {
    Ok(Json(repo::update(&state.db, &id, None, Some(false)).await?))
}

#[utoipa::path(
    delete,
    operation_id = "delete_ingredient",
    path = "/ingredients/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Ingrédient supprimé", body = IngredientRow),
        (status = 404, description = "Ingrédient introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "ingredients"
)]
pub async fn delete_ingredient(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<IngredientRow>> {
    Ok(Json(repo::delete(&state.db, &id).await?))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(get_by_id).patch(update).delete(delete_ingredient))
        .route("/{id}/in-stock", patch(set_in_stock))
        .route("/{id}/out-of-stock", patch(set_out_of_stock))
}
