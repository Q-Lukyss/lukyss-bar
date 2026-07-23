use axum::{
    Json, Router,
    extract::{Path, State},
    routing::get,
};
use serde::Deserialize;
use ts_rs::TS;
use utoipa::ToSchema;

use crate::{
    auth::extractors::{AdminUser, AuthUser},
    error::{ApiError, ApiResult},
    state::AppState,
    types::{
        cocktails::DeleteMessage,
        commandes::{CommandeRow, CommandeStatus, CommandeView},
    },
};

use super::{repo, ws};

/// Miroir de `CreateCommandeItemDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "commandes.ts", rename_all = "camelCase")]
pub struct CreateCommandeItemRequest {
    cocktail_id: String,
    quantity: i32,
}

/// Miroir de `CreateCommandeDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "commandes.ts", rename_all = "camelCase")]
pub struct CreateCommandeRequest {
    customer_name: String,
    promo_code: String,
    items: Vec<CreateCommandeItemRequest>,
}

#[utoipa::path(
    post,
    path = "/commandes",
    request_body = CreateCommandeRequest,
    responses(
        (status = 200, description = "Commande créée", body = CommandeView),
        (status = 400, description = "Code promo invalide ou cocktail introuvable"),
    ),
    tag = "commandes"
)]
pub async fn create(
    State(state): State<AppState>,
    Json(body): Json<CreateCommandeRequest>,
) -> ApiResult<Json<CommandeView>> {
    if body.items.is_empty() {
        return Err(ApiError::BadRequest(
            "items must contain at least 1 elements".to_string(),
        ));
    }
    if body.items.iter().any(|i| i.quantity < 1) {
        return Err(ApiError::BadRequest(
            "quantity must not be less than 1".to_string(),
        ));
    }

    let items: Vec<repo::CreateItem> = body
        .items
        .into_iter()
        .map(|i| repo::CreateItem {
            cocktail_id: i.cocktail_id,
            quantity: i.quantity,
        })
        .collect();

    let view = repo::create(&state.db, &body.customer_name, &body.promo_code, &items).await?;

    Ok(Json(view))
}

#[utoipa::path(
    get,
    path = "/commandes/public/{token}",
    params(("token" = String, Path)),
    responses(
        (status = 200, description = "Commande (suivi public)", body = CommandeView),
        (status = 404, description = "Commande introuvable"),
    ),
    tag = "commandes"
)]
pub async fn get_by_public_token(
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> ApiResult<Json<CommandeView>> {
    Ok(Json(repo::get_by_public_token(&state.db, &token).await?))
}

#[utoipa::path(
    get,
    path = "/commandes",
    responses((status = 200, description = "Liste des commandes", body = Vec<CommandeRow>)),
    security(("bearer_auth" = [])),
    tag = "commandes"
)]
pub async fn list_all(
    _admin: AdminUser,
    State(state): State<AppState>,
) -> ApiResult<Json<Vec<CommandeRow>>> {
    Ok(Json(repo::list_all(&state.db).await?))
}

#[utoipa::path(
    get,
    path = "/commandes/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Commande", body = CommandeView),
        (status = 404, description = "Commande introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "commandes"
)]
pub async fn get_by_id(
    _user: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<CommandeView>> {
    Ok(Json(repo::get_view(&state.db, &id).await?))
}

#[utoipa::path(
    delete,
    path = "/commandes/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Commande supprimée", body = DeleteMessage),
        (status = 404, description = "Commande introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "commandes"
)]
pub async fn delete(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<DeleteMessage>> {
    Ok(Json(repo::delete(&state.db, &id).await?))
}

/// Miroir de `UpdateCommandeStatusDto` (`status` reçu en `String` plutôt que
/// désérialisé directement en enum, pour renvoyer une erreur 400 au même
/// format que le reste de l'API plutôt que le rejet JSON générique d'axum).
#[derive(Debug, Deserialize, ToSchema, TS)]
#[ts(export, export_to = "commandes.ts")]
pub struct UpdateCommandeStatusRequest {
    status: String,
}

#[utoipa::path(
    patch,
    path = "/commandes/{id}/status",
    params(("id" = String, Path)),
    request_body = UpdateCommandeStatusRequest,
    responses(
        (status = 200, description = "Statut mis à jour (diffusé via WebSocket)", body = CommandeRow),
        (status = 400, description = "Statut invalide"),
        (status = 404, description = "Commande introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "commandes"
)]
pub async fn update_status(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateCommandeStatusRequest>,
) -> ApiResult<Json<CommandeRow>> {
    let status = CommandeStatus::parse(&body.status).ok_or_else(|| {
        ApiError::BadRequest(format!(
            "status must be one of the following values: {}",
            CommandeStatus::ALL
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ))
    })?;

    let updated = repo::update_status(&state.db, &id, status).await?;

    state.broadcast_status(&updated.public_token, updated.status.as_str());
    if matches!(status, CommandeStatus::Completed) {
        state.forget_commande(&updated.public_token);
    }

    Ok(Json(updated))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_all).post(create))
        .route("/public/{token}", get(get_by_public_token))
        .route("/ws/{token}", get(ws::upgrade))
        .route("/{id}", get(get_by_id).delete(delete))
        .route("/{id}/status", axum::routing::patch(update_status))
}
