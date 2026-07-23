use chrono::NaiveDateTime;
use serde::Serialize;
use ts_rs::TS;
use utoipa::ToSchema;

/// Miroir de `domain/entities/code.ts` (`CodeRow`).
#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "codes.ts", rename_all = "camelCase")]
pub struct CodeRow {
    pub id: String,
    pub code: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
