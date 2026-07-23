use crate::error::ApiError;

/// Miroir de `bcrypt.compare` dans `auth.service.ts`. Le crate `bcrypt` (pas
/// `argon2`) est volontairement conservé : la table `users` contient déjà des
/// hashes `$2a$`/`$2b$` — changer d'algorithme invaliderait les mots de passe
/// existants.
pub fn verify(password: &str, hash: &str) -> Result<bool, ApiError> {
    bcrypt::verify(password, hash).map_err(|err| ApiError::Internal(err.into()))
}
