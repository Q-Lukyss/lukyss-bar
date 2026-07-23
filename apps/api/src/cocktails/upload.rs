use axum::extract::multipart::Field;
use image::ImageFormat;
use ulid::Ulid;

use crate::{error::ApiError, storage::R2Storage};

/// Miroir de `cocktails-images.service.ts`.
const MAX_FILE_SIZE: usize = 5 * 1024 * 1024;
const ALLOWED_TYPES: &[(&str, ImageFormat)] = &[
    ("image/jpeg", ImageFormat::Jpeg),
    ("image/png", ImageFormat::Png),
    ("image/webp", ImageFormat::WebP),
];

/// Compromis qualité/poids standard pour de la photo produit — le format de
/// sortie est toujours webp quel que soit le format uploadé (voir
/// `extract_image_field`).
const WEBP_QUALITY: f32 = 82.0;

pub struct UploadedImage {
    bytes: Vec<u8>,
}

/// Lit, valide puis convertit en webp un champ multipart "image". Le type
/// réel du fichier est vérifié par ses "magic bytes" (crate `infer`),
/// contrairement à Nest qui ne faisait confiance qu'au `Content-Type` envoyé
/// par le client. jpg/png/webp sont acceptés en entrée mais toujours
/// réencodés en webp (format le plus efficace) avant d'être stockés.
pub async fn extract_image_field(field: Field<'_>) -> Result<UploadedImage, ApiError> {
    let bytes = field
        .bytes()
        .await
        .map_err(|_| ApiError::BadRequest("Fichier image invalide".to_string()))?;

    if bytes.len() > MAX_FILE_SIZE {
        return Err(ApiError::BadRequest(
            "Le fichier image dépasse la taille maximale de 5 Mo".to_string(),
        ));
    }

    let kind = infer::get(&bytes).ok_or_else(|| {
        ApiError::BadRequest("Seules les images jpg, jpeg, png, webp sont autorisées".to_string())
    })?;

    let format = ALLOWED_TYPES
        .iter()
        .find(|(mime, _)| *mime == kind.mime_type())
        .map(|(_, format)| *format)
        .ok_or_else(|| {
            ApiError::BadRequest(
                "Seules les images jpg, jpeg, png, webp sont autorisées".to_string(),
            )
        })?;

    let decoded = image::load_from_memory_with_format(&bytes, format)
        .map_err(|_| ApiError::BadRequest("Fichier image invalide ou corrompu".to_string()))?;

    let rgba = decoded.to_rgba8();
    let (width, height) = rgba.dimensions();
    let webp_bytes = webp::Encoder::from_rgba(&rgba, width, height)
        .encode(WEBP_QUALITY)
        .to_vec();

    Ok(UploadedImage { bytes: webp_bytes })
}

/// Envoie l'image (déjà convertie en webp) vers R2 sous une clé ULID (donc
/// immuable) et retourne le chemin public à travers le proxy `/uploads/...`
/// (voir `crate::uploads`).
pub async fn save_image(storage: &R2Storage, image: UploadedImage) -> Result<String, ApiError> {
    let key = format!("cocktails/{}.webp", Ulid::new());

    storage.put(&key, image.bytes, "image/webp").await?;

    Ok(format!("/uploads/{key}"))
}

/// Supprime de R2 l'image pointée par un chemin public (`/uploads/...`)
/// tel que retourné par [`save_image`]. À appeler quand une image est
/// remplacée, pour éviter d'accumuler des objets orphelins dans le bucket.
pub async fn delete_image(storage: &R2Storage, path: &str) -> Result<(), ApiError> {
    if let Some(key) = path.strip_prefix("/uploads/") {
        storage.delete(key).await?;
    }
    Ok(())
}
