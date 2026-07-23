use axum::{
    extract::{FromRef, FromRequestParts},
    http::{header, request::Parts},
};

use crate::{error::ApiError, state::AppState};

use super::jwt;

/// Utilisateur authentifié — miroir de `JwtAuthGuard` (extrait et vérifie le
/// Bearer token, peu importe le rôle).
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
}

impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let header_value = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| ApiError::Unauthorized("Missing authorization header".to_string()))?;

        let token = header_value
            .strip_prefix("Bearer ")
            .ok_or_else(|| ApiError::Unauthorized("Invalid authorization header".to_string()))?;

        let claims = jwt::verify(token, &app_state.jwt_secret)?;

        Ok(AuthUser {
            id: claims.id,
            name: claims.name,
            email: claims.email,
            is_admin: claims.is_admin,
        })
    }
}

/// Utilisateur admin — miroir de `RolesGuard` + `@Roles('admin')`.
#[derive(Debug, Clone)]
pub struct AdminUser(pub AuthUser);

impl<S> FromRequestParts<S> for AdminUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;

        if !user.is_admin {
            return Err(ApiError::Forbidden(
                "Admin privileges required".to_string(),
            ));
        }

        Ok(AdminUser(user))
    }
}
