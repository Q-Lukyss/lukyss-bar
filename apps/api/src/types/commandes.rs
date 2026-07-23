use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utoipa::ToSchema;

/// Miroir de `commandes.constants.ts` (`COMMANDE_STATUS`) et du type Postgres
/// `commande_status`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, TS, ToSchema)]
#[sqlx(type_name = "commande_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[ts(export, export_to = "commandes.ts", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CommandeStatus {
    Pending,
    Confirmed,
    InPreparation,
    Ready,
    Completed,
}

impl CommandeStatus {
    pub const ALL: [CommandeStatus; 5] = [
        CommandeStatus::Pending,
        CommandeStatus::Confirmed,
        CommandeStatus::InPreparation,
        CommandeStatus::Ready,
        CommandeStatus::Completed,
    ];

    pub fn as_str(&self) -> &'static str {
        match self {
            CommandeStatus::Pending => "PENDING",
            CommandeStatus::Confirmed => "CONFIRMED",
            CommandeStatus::InPreparation => "IN_PREPARATION",
            CommandeStatus::Ready => "READY",
            CommandeStatus::Completed => "COMPLETED",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|s| s.as_str() == value)
    }
}

/// Miroir de `domain/entities/commandes.ts` (`CommandeRow`).
#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "commandes.ts", rename_all = "camelCase")]
pub struct CommandeRow {
    pub id: String,
    pub customer_name: String,
    pub promo_code: String,
    pub public_token: String,
    pub total_price: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub status: CommandeStatus,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "commandes.ts", rename_all = "camelCase")]
pub struct CommandeItem {
    pub id: String,
    pub cocktail_id: String,
    pub quantity: i32,
    pub cocktail_name: String,
    pub cocktail_image: Option<String>,
    pub unit_price: i32,
    pub line_total: i32,
}

/// Contrairement à `CocktailView`, la structure n'est pas aplatie côté Nest
/// (`{ commande: CommandeRow; items: CommandeItem[] }`) — un champ imbriqué
/// classique suffit ici.
#[derive(Debug, Clone, Serialize, TS, ToSchema)]
#[ts(export, export_to = "commandes.ts")]
pub struct CommandeView {
    pub commande: CommandeRow,
    pub items: Vec<CommandeItem>,
}
