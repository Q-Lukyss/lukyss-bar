use axum::{
    Json, Router,
    extract::{Multipart, Path, State},
    routing::get,
};
use serde::Deserialize;
use ts_rs::TS;
use utoipa::ToSchema;

use crate::{
    auth::extractors::AdminUser,
    error::{ApiError, ApiResult},
    state::AppState,
    types::cocktails::{
        CocktailIngredientLinkRow, CocktailIngredientListItem, CocktailRow, CocktailView,
        DeleteMessage,
    },
};

use super::{repo, upload};

struct CocktailForm {
    name: Option<String>,
    price: Option<i32>,
    description: Option<String>,
    image: Option<upload::UploadedImage>,
}

async fn parse_cocktail_form(mut multipart: Multipart) -> ApiResult<CocktailForm> {
    let mut name = None;
    let mut price = None;
    let mut description = None;
    let mut image = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| ApiError::BadRequest("Formulaire invalide".to_string()))?
    {
        match field.name() {
            Some("name") => {
                name = Some(
                    field
                        .text()
                        .await
                        .map_err(|_| ApiError::BadRequest("name invalide".to_string()))?,
                );
            }
            Some("price") => {
                let text = field
                    .text()
                    .await
                    .map_err(|_| ApiError::BadRequest("price invalide".to_string()))?;
                price = Some(text.parse::<i32>().map_err(|_| {
                    ApiError::BadRequest("price must be an integer number".to_string())
                })?);
            }
            Some("description") => {
                let text = field
                    .text()
                    .await
                    .map_err(|_| ApiError::BadRequest("description invalide".to_string()))?;
                description = if text.trim().is_empty() {
                    None
                } else {
                    Some(text.trim().to_string())
                };
            }
            Some("image") => {
                image = Some(upload::extract_image_field(field).await?);
            }
            _ => {}
        }
    }

    Ok(CocktailForm {
        name,
        price,
        description,
        image,
    })
}

#[utoipa::path(
    get,
    operation_id = "list_cocktails",
    path = "/cocktails",
    responses((status = 200, description = "Liste des cocktails", body = Vec<CocktailRow>)),
    tag = "cocktails"
)]
pub async fn list(State(state): State<AppState>) -> ApiResult<Json<Vec<CocktailRow>>> {
    Ok(Json(repo::list(&state.db).await?))
}

#[utoipa::path(
    get,
    operation_id = "get_cocktail_by_id",
    path = "/cocktails/{id}",
    params(("id" = String, Path)),
    responses(
        (status = 200, description = "Cocktail avec ses ingrédients", body = CocktailView),
        (status = 404, description = "Cocktail introuvable"),
    ),
    tag = "cocktails"
)]
pub async fn get_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<CocktailView>> {
    Ok(Json(repo::get_view(&state.db, &id).await?))
}

/// Représentation purement documentaire du formulaire multipart (le parsing
/// réel se fait manuellement via `parse_cocktail_form`, voir `Multipart`).
#[derive(ToSchema)]
#[allow(dead_code)]
pub struct CocktailMultipartForm {
    name: String,
    price: i32,
    description: Option<String>,
    #[schema(value_type = String, format = Binary)]
    image: Option<Vec<u8>>,
}

#[utoipa::path(
    post,
    operation_id = "create_cocktail",
    path = "/cocktails",
    request_body(content = CocktailMultipartForm, content_type = "multipart/form-data"),
    responses((status = 200, description = "Cocktail créé", body = CocktailRow)),
    security(("bearer_auth" = [])),
    tag = "cocktails"
)]
pub async fn create(
    _admin: AdminUser,
    State(state): State<AppState>,
    multipart: Multipart,
) -> ApiResult<Json<CocktailRow>> {
    let form = parse_cocktail_form(multipart).await?;

    let name = form
        .name
        .filter(|n| !n.trim().is_empty())
        .ok_or_else(|| ApiError::BadRequest("name is required".to_string()))?;
    let price = form
        .price
        .ok_or_else(|| ApiError::BadRequest("price is required".to_string()))?;
    if price < 0 {
        return Err(ApiError::BadRequest(
            "price must not be less than 0".to_string(),
        ));
    }

    let image_path = match form.image {
        Some(img) => Some(upload::save_image(&state.storage, img).await?),
        None => None,
    };

    Ok(Json(
        repo::create(
            &state.db,
            name.trim(),
            price,
            form.description.as_deref(),
            image_path.as_deref(),
        )
        .await?,
    ))
}

#[utoipa::path(
    patch,
    operation_id = "update_cocktail",
    path = "/cocktails/{id}",
    params(("id" = String, Path)),
    request_body(content = CocktailMultipartForm, content_type = "multipart/form-data"),
    responses(
        (status = 200, description = "Cocktail mis à jour", body = CocktailRow),
        (status = 404, description = "Cocktail introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "cocktails"
)]
pub async fn update(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
    multipart: Multipart,
) -> ApiResult<Json<CocktailRow>> {
    let form = parse_cocktail_form(multipart).await?;

    if let Some(price) = form.price {
        if price < 0 {
            return Err(ApiError::BadRequest(
                "price must not be less than 0".to_string(),
            ));
        }
    }

    let old_image = if form.image.is_some() {
        repo::get_image(&state.db, &id).await?
    } else {
        None
    };

    let image_path = match form.image {
        Some(img) => Some(upload::save_image(&state.storage, img).await?),
        None => None,
    };

    let updated = repo::update(
        &state.db,
        &id,
        form.name.as_deref(),
        form.price,
        form.description.as_deref(),
        image_path.as_deref(),
    )
    .await?;

    if let Some(old) = old_image {
        if let Err(err) = upload::delete_image(&state.storage, &old).await {
            tracing::warn!(error = ?err, "échec de la suppression de l'ancienne image R2");
        }
    }

    Ok(Json(updated))
}

#[utoipa::path(
    get,
    path = "/cocktails/{cocktail_id}/ingredients",
    params(("cocktail_id" = String, Path)),
    responses((status = 200, description = "Ingrédients du cocktail", body = Vec<CocktailIngredientListItem>)),
    tag = "cocktails"
)]
pub async fn get_cocktail_ingredients(
    State(state): State<AppState>,
    Path(cocktail_id): Path<String>,
) -> ApiResult<Json<Vec<CocktailIngredientListItem>>> {
    Ok(Json(
        repo::list_cocktail_ingredients(&state.db, &cocktail_id).await?,
    ))
}

/// Miroir de `AddCocktailIngredientDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct AddCocktailIngredientRequest {
    ingredient_id: String,
    quantity: i32,
    unity: String,
}

#[utoipa::path(
    post,
    path = "/cocktails/{cocktail_id}/ingredients",
    params(("cocktail_id" = String, Path)),
    request_body = AddCocktailIngredientRequest,
    responses(
        (status = 200, description = "Ingrédient associé au cocktail", body = CocktailIngredientLinkRow),
        (status = 400, description = "Ingrédient déjà associé"),
        (status = 404, description = "Cocktail ou ingrédient introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "cocktails"
)]
pub async fn add_ingredient(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(cocktail_id): Path<String>,
    Json(body): Json<AddCocktailIngredientRequest>,
) -> ApiResult<Json<CocktailIngredientLinkRow>> {
    if body.quantity < 1 {
        return Err(ApiError::BadRequest(
            "quantity must not be less than 1".to_string(),
        ));
    }

    Ok(Json(
        repo::add_ingredient(
            &state.db,
            &cocktail_id,
            &body.ingredient_id,
            body.quantity,
            &body.unity,
        )
        .await?,
    ))
}

/// Miroir de `UpdateCocktailIngredientDto`.
#[derive(Debug, Deserialize, ToSchema, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "cocktails.ts", rename_all = "camelCase")]
pub struct UpdateCocktailIngredientRequest {
    ingredient_id: Option<String>,
    quantity: Option<i32>,
    unity: Option<String>,
}

#[utoipa::path(
    patch,
    operation_id = "update_cocktail_ingredient_link",
    path = "/cocktails/{cocktail_id}/ingredients/{cocktail_ingredient_id}",
    params(("cocktail_id" = String, Path), ("cocktail_ingredient_id" = String, Path)),
    request_body = UpdateCocktailIngredientRequest,
    responses(
        (status = 200, description = "Association mise à jour", body = CocktailIngredientLinkRow),
        (status = 400, description = "Ingrédient déjà associé"),
        (status = 404, description = "Association introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "cocktails"
)]
pub async fn update_ingredient(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path((cocktail_id, cocktail_ingredient_id)): Path<(String, String)>,
    Json(body): Json<UpdateCocktailIngredientRequest>,
) -> ApiResult<Json<CocktailIngredientLinkRow>> {
    if let Some(quantity) = body.quantity {
        if quantity < 1 {
            return Err(ApiError::BadRequest(
                "quantity must not be less than 1".to_string(),
            ));
        }
    }

    Ok(Json(
        repo::update_ingredient_link(
            &state.db,
            &cocktail_id,
            &cocktail_ingredient_id,
            body.ingredient_id.as_deref(),
            body.quantity,
            body.unity.as_deref(),
        )
        .await?,
    ))
}

#[utoipa::path(
    delete,
    operation_id = "delete_cocktail_ingredient_link",
    path = "/cocktails/{cocktail_id}/ingredients/{cocktail_ingredient_id}",
    params(("cocktail_id" = String, Path), ("cocktail_ingredient_id" = String, Path)),
    responses(
        (status = 200, description = "Ingrédient retiré du cocktail", body = DeleteMessage),
        (status = 404, description = "Association introuvable"),
    ),
    security(("bearer_auth" = [])),
    tag = "cocktails"
)]
pub async fn delete_ingredient(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path((cocktail_id, cocktail_ingredient_id)): Path<(String, String)>,
) -> ApiResult<Json<DeleteMessage>> {
    Ok(Json(
        repo::delete_ingredient_link(&state.db, &cocktail_id, &cocktail_ingredient_id).await?,
    ))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(get_by_id).patch(update))
        .route(
            "/{cocktail_id}/ingredients",
            get(get_cocktail_ingredients).post(add_ingredient),
        )
        .route(
            "/{cocktail_id}/ingredients/{cocktail_ingredient_id}",
            axum::routing::patch(update_ingredient).delete(delete_ingredient),
        )
}
