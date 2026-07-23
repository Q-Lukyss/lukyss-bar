use utoipa::{
    Modify, OpenApi,
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
};

use crate::{auth, cocktails, codes, commandes, ingredients};

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }
}

/// Miroir de la doc Swagger auto-générée par Nestia (`/docs`, `/docs-json`).
#[derive(OpenApi)]
#[openapi(
    paths(
        auth::routes::login,
        ingredients::routes::list,
        ingredients::routes::get_by_id,
        ingredients::routes::create,
        ingredients::routes::update,
        ingredients::routes::set_in_stock,
        ingredients::routes::set_out_of_stock,
        ingredients::routes::delete_ingredient,
        cocktails::routes::list,
        cocktails::routes::get_by_id,
        cocktails::routes::create,
        cocktails::routes::update,
        cocktails::routes::get_cocktail_ingredients,
        cocktails::routes::add_ingredient,
        cocktails::routes::update_ingredient,
        cocktails::routes::delete_ingredient,
        codes::routes::create,
        codes::routes::delete_code,
        codes::routes::list,
        commandes::routes::create,
        commandes::routes::get_by_public_token,
        commandes::routes::list_all,
        commandes::routes::get_by_id,
        commandes::routes::delete,
        commandes::routes::update_status,
    ),
    components(schemas(
        crate::types::auth::AuthUser,
        crate::types::auth::LoginResponse,
        auth::routes::LoginRequest,
        crate::types::ingredients::IngredientRow,
        ingredients::routes::CreateIngredientRequest,
        ingredients::routes::UpdateIngredientRequest,
        crate::types::cocktails::CocktailRow,
        crate::types::cocktails::CocktailView,
        crate::types::cocktails::CocktailIngredientView,
        crate::types::cocktails::CocktailIngredientLinkRow,
        crate::types::cocktails::CocktailIngredientListItem,
        crate::types::cocktails::DeleteMessage,
        cocktails::routes::CocktailMultipartForm,
        cocktails::routes::AddCocktailIngredientRequest,
        cocktails::routes::UpdateCocktailIngredientRequest,
        crate::types::codes::CodeRow,
        codes::routes::CreateCodeRequest,
        crate::types::commandes::CommandeStatus,
        crate::types::commandes::CommandeRow,
        crate::types::commandes::CommandeItem,
        crate::types::commandes::CommandeView,
        commandes::routes::CreateCommandeItemRequest,
        commandes::routes::CreateCommandeRequest,
        commandes::routes::UpdateCommandeStatusRequest,
    )),
    tags(
        (name = "auth", description = "Authentification JWT"),
        (name = "ingredients", description = "Gestion des ingrédients et du stock"),
        (name = "cocktails", description = "Catalogue de cocktails et recettes"),
        (name = "codes", description = "Codes promo"),
        (name = "commandes", description = "Commandes et suivi temps réel"),
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;
