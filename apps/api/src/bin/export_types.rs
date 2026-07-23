use std::{fs, path::Path};

use lukyss_bar_api::{auth, cocktails, codes, commandes, ingredients, types};
use ts_rs::TS;

/// Génère les bindings TS (ts-rs écrit dans `bindings/` par défaut, relatif à
/// `CARGO_MANIFEST_DIR`) puis les copie vers `packages/api-types/generated`.
/// Volontairement un binaire dédié plutôt que `#[ts(export)] + cargo test`
/// (mécanisme fragile/non déterministe en CI, cf. plan de migration).
fn main() -> anyhow::Result<()> {
    types::auth::AuthUser::export()?;
    types::auth::LoginResponse::export()?;
    auth::routes::LoginRequest::export()?;

    types::ingredients::IngredientRow::export()?;
    ingredients::routes::CreateIngredientRequest::export()?;
    ingredients::routes::UpdateIngredientRequest::export()?;

    types::cocktails::CocktailRow::export()?;
    types::cocktails::CocktailIngredientView::export()?;
    types::cocktails::CocktailView::export()?;
    types::cocktails::CocktailIngredientLinkRow::export()?;
    types::cocktails::CocktailIngredientListItem::export()?;
    types::cocktails::DeleteMessage::export()?;
    cocktails::routes::AddCocktailIngredientRequest::export()?;
    cocktails::routes::UpdateCocktailIngredientRequest::export()?;

    types::codes::CodeRow::export()?;
    codes::routes::CreateCodeRequest::export()?;

    types::commandes::CommandeStatus::export()?;
    types::commandes::CommandeRow::export()?;
    types::commandes::CommandeItem::export()?;
    types::commandes::CommandeView::export()?;
    commandes::routes::CreateCommandeItemRequest::export()?;
    commandes::routes::CreateCommandeRequest::export()?;
    commandes::routes::UpdateCommandeStatusRequest::export()?;

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let bindings_dir = Path::new(manifest_dir).join("bindings");
    let target_dir = Path::new(manifest_dir)
        .join("..")
        .join("..")
        .join("packages")
        .join("api-types")
        .join("generated");

    fs::create_dir_all(&target_dir)?;

    for entry in fs::read_dir(&bindings_dir)? {
        let entry = entry?;
        if entry.path().extension().is_some_and(|ext| ext == "ts") {
            let dest = target_dir.join(entry.file_name());
            fs::copy(entry.path(), &dest)?;
            println!("exported {}", dest.display());
        }
    }

    Ok(())
}
