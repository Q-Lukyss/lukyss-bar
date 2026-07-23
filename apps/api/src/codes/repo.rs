use rand::Rng;
use sqlx::PgPool;
use ulid::Ulid;

use crate::{error::ApiError, types::codes::CodeRow};

const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

fn generate_code4() -> String {
    let mut rng = rand::rng();
    (0..4)
        .map(|_| ALPHABET[rng.random_range(0..ALPHABET.len())] as char)
        .collect()
}

pub async fn list(db: &PgPool) -> Result<Vec<CodeRow>, ApiError> {
    let rows = sqlx::query_as!(
        CodeRow,
        r#"SELECT id, code, created_at, updated_at FROM codes ORDER BY created_at"#
    )
    .fetch_all(db)
    .await?;

    Ok(rows)
}

async fn code_exists(db: &PgPool, code: &str) -> Result<bool, ApiError> {
    let row = sqlx::query!(r#"SELECT id FROM codes WHERE code = $1"#, code)
        .fetch_optional(db)
        .await?;

    Ok(row.is_some())
}

pub async fn create(db: &PgPool, input_code: Option<&str>) -> Result<CodeRow, ApiError> {
    let mut code_value = match input_code.map(str::trim).filter(|s| !s.is_empty()) {
        Some(code) => code.to_uppercase(),
        None => generate_code4(),
    };

    for _ in 0..5 {
        if !code_exists(db, &code_value).await? {
            break;
        }
        code_value = generate_code4();
    }

    let id = Ulid::new().to_string();

    let row = sqlx::query_as!(
        CodeRow,
        r#"INSERT INTO codes (id, code) VALUES ($1, $2) RETURNING id, code, created_at, updated_at"#,
        id,
        code_value
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

pub async fn delete_by_id(db: &PgPool, id: &str) -> Result<CodeRow, ApiError> {
    sqlx::query_as!(
        CodeRow,
        r#"DELETE FROM codes WHERE id = $1 RETURNING id, code, created_at, updated_at"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| ApiError::NotFound("Code introuvable".to_string()))
}
