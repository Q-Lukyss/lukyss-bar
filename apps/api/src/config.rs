use anyhow::Context;
use std::env;

pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub frontend_url: String,
    pub port: u16,
    pub r2_account_id: String,
    pub r2_access_key_id: String,
    pub r2_secret_access_key: String,
    pub r2_bucket_name: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        let database_url =
            env::var("DATABASE_URL").context("DATABASE_URL est manquant dans env")?;
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".to_string());
        let frontend_url =
            env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3001);
        let r2_account_id =
            env::var("R2_ACCOUNT_ID").context("R2_ACCOUNT_ID est manquant dans env")?;
        let r2_access_key_id =
            env::var("R2_ACCESS_KEY_ID").context("R2_ACCESS_KEY_ID est manquant dans env")?;
        let r2_secret_access_key = env::var("R2_SECRET_ACCESS_KEY")
            .context("R2_SECRET_ACCESS_KEY est manquant dans env")?;
        let r2_bucket_name =
            env::var("R2_BUCKET_NAME").context("R2_BUCKET_NAME est manquant dans env")?;

        Ok(Self {
            database_url,
            jwt_secret,
            frontend_url,
            port,
            r2_account_id,
            r2_access_key_id,
            r2_secret_access_key,
            r2_bucket_name,
        })
    }
}
