use axum::{Json, Router, extract::State, routing::post};
use serde::Deserialize;
use ts_rs::TS;
use utoipa::ToSchema;

use crate::{
    error::{ApiError, ApiResult},
    state::AppState,
    types::auth::{AuthUser, LoginResponse},
};

use super::{jwt, password};

/// Miroir de `LoginDto` (`class-validator`: `@IsEmail()` / `@IsString() @MinLength(3)`).
#[derive(Debug, Deserialize, ToSchema, TS)]
#[ts(export, export_to = "auth.ts")]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

fn is_valid_email(value: &str) -> bool {
    match value.split_once('@') {
        Some((local, domain)) => !local.is_empty() && domain.contains('.'),
        None => false,
    }
}

struct UserRow {
    id: String,
    name: String,
    email: String,
    password: String,
    is_admin: bool,
    is_active: bool,
}

/// Miroir de `AuthController.login` / `AuthService.login`.
#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Connexion réussie", body = LoginResponse),
        (status = 400, description = "Email ou mot de passe invalide"),
        (status = 401, description = "Identifiants incorrects ou compte désactivé"),
    ),
    tag = "auth"
)]
pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> ApiResult<Json<LoginResponse>> {
    if !is_valid_email(&body.email) {
        return Err(ApiError::BadRequest("email must be an email".to_string()));
    }
    if body.password.len() < 3 {
        return Err(ApiError::BadRequest(
            "password must be longer than or equal to 3 characters".to_string(),
        ));
    }

    let row = sqlx::query_as!(
        UserRow,
        r#"SELECT id, name, email, password, is_admin, is_active FROM users WHERE email = $1"#,
        body.email
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| ApiError::Unauthorized("Invalid credentials".to_string()))?;

    if !row.is_active {
        return Err(ApiError::Unauthorized("User disabled".to_string()));
    }

    if !password::verify(&body.password, &row.password)? {
        return Err(ApiError::Unauthorized("Invalid credentials".to_string()));
    }

    let user = AuthUser {
        id: row.id,
        name: row.name,
        email: row.email,
        is_admin: row.is_admin,
    };

    let access_token = jwt::sign(&user, &state.jwt_secret)?;

    Ok(Json(LoginResponse { access_token, user }))
}

pub fn router() -> Router<AppState> {
    Router::new().route("/login", post(login))
}
