use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utoipa::ToSchema;

/// Miroir de `domain/entities/ingredients.ts` (`IngredientRow`). Le JSON reste
/// en camelCase (`createdAt`/`updatedAt`) pour matcher le contrat existant du
/// frontend — seul le mapping sqlx (colonnes DB en snake_case) utilise les
/// noms de champs Rust littéraux.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "ingredients.ts", rename_all = "camelCase")]
pub struct IngredientRow {
    pub id: String,
    pub name: String,
    pub stock: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
