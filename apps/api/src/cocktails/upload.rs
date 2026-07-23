use axum::extract::multipart::Field;

use crate::error::ApiError;

/// Miroir de `cocktails-images.service.ts`.
const MAX_FILE_SIZE: usize = 5 * 1024 * 1024;
const ALLOWED_TYPES: &[(&str, &str)] = &[
    ("image/jpeg", "jpg"),
    ("image/png", "png"),
    ("image/webp", "webp"),
];

pub struct UploadedImage {
    bytes: Vec<u8>,
    extension: &'static str,
}

/// Lit et valide un champ multipart "image". Contrairement à Nest (qui ne
/// fait confiance qu'au `Content-Type` envoyé par le client), le type réel du
/// fichier est vérifié par ses "magic bytes" (crate `infer`).
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

    let extension = ALLOWED_TYPES
        .iter()
        .find(|(mime, _)| *mime == kind.mime_type())
        .map(|(_, ext)| *ext)
        .ok_or_else(|| {
            ApiError::BadRequest(
                "Seules les images jpg, jpeg, png, webp sont autorisées".to_string(),
            )
        })?;

    Ok(UploadedImage {
        bytes: bytes.to_vec(),
        extension,
    })
}

/// Écrit l'image sur disque et retourne le chemin public (`/uploads/cocktails/...`).
pub async fn save_image(
    upload_dir: &std::path::Path,
    image: UploadedImage,
) -> Result<String, ApiError> {
    let filename = format!(
        "cocktail-{}.{}",
        uuid::Uuid::new_v4().simple(),
        image.extension
    );
    let path = upload_dir.join("cocktails").join(&filename);

    tokio::fs::write(&path, &image.bytes)
        .await
        .map_err(|err| ApiError::Internal(err.into()))?;

    Ok(format!("/uploads/cocktails/{filename}"))
}
