use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use crate::{error::ApiError, types::auth::AuthUser};

/// Miroir de `signOptions: { expiresIn: '7d' }` dans `auth.module.ts`.
const EXPIRY_SECONDS: i64 = 7 * 24 * 60 * 60;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub id: String,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
    pub exp: i64,
}

impl Claims {
    fn for_user(user: &AuthUser) -> Self {
        Self {
            sub: user.id.clone(),
            id: user.id.clone(),
            name: user.name.clone(),
            email: user.email.clone(),
            is_admin: user.is_admin,
            exp: chrono::Utc::now().timestamp() + EXPIRY_SECONDS,
        }
    }
}

pub fn sign(user: &AuthUser, secret: &str) -> Result<String, ApiError> {
    encode(
        &Header::default(),
        &Claims::for_user(user),
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|err| ApiError::Internal(err.into()))
}

/// Vérifie et décode un token — miroir de `jwt.strategy.ts` (`JwtStrategy.validate`).
pub fn verify(token: &str, secret: &str) -> Result<Claims, ApiError> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| ApiError::Unauthorized("Invalid credentials".to_string()))?;

    Ok(data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn user() -> AuthUser {
        AuthUser {
            id: "user-1".to_string(),
            name: "Alice".to_string(),
            email: "alice@example.com".to_string(),
            is_admin: true,
        }
    }

    #[test]
    fn sign_then_verify_roundtrips_claims() {
        let token = sign(&user(), "secret").expect("sign should succeed");
        let claims = verify(&token, "secret").expect("verify should succeed");

        assert_eq!(claims.id, "user-1");
        assert_eq!(claims.name, "Alice");
        assert_eq!(claims.email, "alice@example.com");
        assert!(claims.is_admin);
        assert!(claims.exp > chrono::Utc::now().timestamp());
    }

    #[test]
    fn verify_rejects_token_signed_with_a_different_secret() {
        let token = sign(&user(), "secret").expect("sign should succeed");

        let result = verify(&token, "wrong-secret");

        assert!(matches!(result, Err(ApiError::Unauthorized(_))));
    }

    #[test]
    fn verify_rejects_garbage_token() {
        let result = verify("not-a-jwt", "secret");

        assert!(matches!(result, Err(ApiError::Unauthorized(_))));
    }
}
