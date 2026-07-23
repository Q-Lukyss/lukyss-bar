use crate::error::ApiError;

/// Miroir de `bcrypt.compare` dans `auth.service.ts`. Le crate `bcrypt` (pas
/// `argon2`) est volontairement conservé : la table `users` contient déjà des
/// hashes `$2a$`/`$2b$` — changer d'algorithme invaliderait les mots de passe
/// existants.
pub fn verify(password: &str, hash: &str) -> Result<bool, ApiError> {
    bcrypt::verify(password, hash).map_err(|err| ApiError::Internal(err.into()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verify_accepts_the_correct_password() {
        let hash = bcrypt::hash("masterbarman", bcrypt::DEFAULT_COST).unwrap();

        assert!(verify("masterbarman", &hash).unwrap());
    }

    #[test]
    fn verify_rejects_the_wrong_password() {
        let hash = bcrypt::hash("masterbarman", bcrypt::DEFAULT_COST).unwrap();

        assert!(!verify("wrong-password", &hash).unwrap());
    }

    #[test]
    fn verify_errors_on_a_malformed_hash() {
        assert!(verify("masterbarman", "not-a-bcrypt-hash").is_err());
    }
}
