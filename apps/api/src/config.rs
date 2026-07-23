use anyhow::Context;
use std::env;

pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub frontend_url: String,
    pub port: u16,
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

        Ok(Self {
            database_url,
            jwt_secret,
            frontend_url,
            port,
        })
    }
}
