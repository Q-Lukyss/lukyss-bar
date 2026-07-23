use chrono::NaiveDateTime;
use serde::Serialize;
use ts_rs::TS;
use utoipa::ToSchema;

/// Miroir de `domain/entities/cocktails.ts`. Le JSON reste en camelCase pour
/// matcher le contrat existant du frontend — seul le mapping sqlx (colonnes
/// DB en snake_case) utilise les noms de champs Rust littéraux.
#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct CocktailRow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub image: Option<String>,
    pub price: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct CocktailIngredientView {
    pub id: String,
    pub ingredient_id: String,
    pub name: String,
    pub stock: bool,
    pub quantity: i32,
    pub unity: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

/// `CocktailRow` + ses ingrédients — les champs sont dupliqués (plutôt que
/// `#[serde(flatten)]`) car ts-rs ne génère pas un type TS correct pour les
/// structs aplaties.
#[derive(Debug, Clone, Serialize, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct CocktailView {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub image: Option<String>,
    pub price: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub ingredients: Vec<CocktailIngredientView>,
}

impl CocktailView {
    pub fn new(cocktail: CocktailRow, ingredients: Vec<CocktailIngredientView>) -> Self {
        Self {
            id: cocktail.id,
            name: cocktail.name,
            description: cocktail.description,
            image: cocktail.image,
            price: cocktail.price,
            created_at: cocktail.created_at,
            updated_at: cocktail.updated_at,
            ingredients,
        }
    }
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct CocktailIngredientLinkRow {
    pub id: String,
    pub cocktail_id: String,
    pub ingredient_id: String,
    pub quantity: i32,
    pub unity: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow, TS, ToSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct CocktailIngredientListItem {
    pub id: String,
    pub cocktail_id: String,
    pub ingredient_id: String,
    pub quantity: i32,
    pub unity: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub ingredient_name: String,
    pub ingredient_stock: bool,
}

#[derive(Debug, Clone, Serialize, TS, ToSchema)]
#[ts(export, export_to = "cocktails.ts")]
pub struct DeleteMessage {
    pub message: String,
}
