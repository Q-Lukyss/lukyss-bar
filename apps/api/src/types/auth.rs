use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utoipa::ToSchema;

/// Miroir de `domain/entities/auth.ts` (`AuthUser`).
#[derive(Debug, Clone, Serialize, Deserialize, TS, ToSchema)]
#[ts(export, export_to = "auth.ts")]
pub struct AuthUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
}

/// Miroir de `domain/entities/auth.ts` (`LoginResponse`).
#[derive(Debug, Serialize, TS, ToSchema)]
#[ts(export, export_to = "auth.ts")]
pub struct LoginResponse {
    pub access_token: String,
    pub user: AuthUser,
}
