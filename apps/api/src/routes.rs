use axum::{Json, response::IntoResponse};
use serde_json::json;

/// Miroir de `app.controller.ts` / `app.service.ts`.
pub async fn root() -> impl IntoResponse {
    Json(json!({
        "message": "Bienvenue dans mon Bar, le LukyssBar!",
        "author": "Quentin Lachery",
        "routes": {
            "cocktails": "/cocktails pour la liste des cocktails",
            "ingredients": "/ingredients pour la liste des ingrédients",
        }
    }))
}

pub async fn health() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().timestamp_millis(),
    }))
}
