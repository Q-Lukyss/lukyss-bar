use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get},
};
use serde::Deserialize;
use ts_rs::TS;
use utoipa::ToSchema;

use crate::{
    auth::extractors::AdminUser,
    error::{ApiError, ApiResult},
    state::AppState,
    types::codes::CodeRow,
};

use super::repo;

/// Miroir de `CreateCodeDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[ts(export, export_to = "codes.ts")]
pub struct CreateCodeRequest {
    code: Option<String>,
}

#[utoipa::path(
    post,
    path = "/codes",
    request_body = CreateCodeRequest,
    responses((status = 200, description = "Code promo créé (ou auto-généré)", body = CodeRow)),
    security(("bearer_auth" = [])),
    tag = "codes"
)]
pub async fn create(
    _admin: AdminUser,
    State(state): State<AppState>,
    Json(body): Json<CreateCodeRequest>,
) -> ApiResult<Json<CodeRow>> {
    if let Some(code) = &body.code {
        let len = code.trim().chars().count();
        if len < 1 || len > 64 {
            return Err(ApiError::BadRequest(
                "code must be longer than or equal to 1 and shorter than or equal to 64 characters"
                    .to_string(),
            ));
        }
    }

    Ok(Json(repo::create(&state.db, body.code.as_deref()).await?))
}

#[utoipa::path(
    delete,
    path = "/codes/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Code supprimé", body = CodeRow),
        (status = 404, description = "Code introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "codes"
)]
pub async fn delete_code(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<CodeRow>> {
    Ok(Json(repo::delete_by_id(&state.db, &id).await?))
}

#[utoipa::path(
    get,
    path = "/codes",
    responses((status = 200, description = "Liste des codes promo", body = Vec<CodeRow>)),
    security(("bearer_auth" = [])),
    tag = "codes"
)]
pub async fn list(_admin: AdminUser, State(state): State<AppState>) -> ApiResult<Json<Vec<CodeRow>>> {
    Ok(Json(repo::list(&state.db).await?))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", delete(delete_code))
}
