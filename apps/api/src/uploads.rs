use axum::{
    Router,
    body::Body,
    extract::{Path, State},
    http::header,
    response::{IntoResponse, Response},
    routing::get,
};

use crate::{error::ApiError, state::AppState};

/// Sert un fichier stocké dans R2 en proxy (le bucket reste privé). Les clés
/// sont des ULID générés à l'upload et jamais réécrits : le fichier à une clé
/// donnée est donc immuable, d'où le cache long côté client/CDN pour éviter
/// de re-solliciter R2 à chaque requête.
async fn serve(State(state): State<AppState>, Path(key): Path<String>) -> Result<Response, ApiError> {
    let (bytes, content_type) = state
        .storage
        .get(&key)
        .await?
        .ok_or_else(|| ApiError::NotFound("Image introuvable".to_string()))?;

    let content_type = content_type
        .and_then(|ct| header::HeaderValue::from_str(&ct).ok())
        .unwrap_or_else(|| header::HeaderValue::from_static("application/octet-stream"));

    let mut response = Body::from(bytes).into_response();
    response.headers_mut().insert(header::CONTENT_TYPE, content_type);
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static("public, max-age=31536000, immutable"),
    );

    Ok(response)
}

pub fn router() -> Router<AppState> {
    Router::new().route("/{*key}", get(serve))
}
