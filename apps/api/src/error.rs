use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

/// Erreur HTTP partagée par tous les modules — miroir des `HttpException` NestJS
/// (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, ...),
/// avec le même shape de réponse JSON par défaut (`message` / `error` / `statusCode`).
#[derive(Debug)]
pub enum ApiError {
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    NotFound(String),
    Internal(anyhow::Error),
}

#[derive(Serialize)]
struct ErrorBody {
    message: String,
    error: &'static str,
    #[serde(rename = "statusCode")]
    status_code: u16,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "Bad Request", msg),
            ApiError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "Unauthorized", msg),
            ApiError::Forbidden(msg) => (StatusCode::FORBIDDEN, "Forbidden", msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "Not Found", msg),
            ApiError::Internal(err) => {
                tracing::error!(error = ?err, "internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal Server Error",
                    "Une erreur interne est survenue".to_string(),
                )
            }
        };

        let body = ErrorBody {
            message,
            error,
            status_code: status.as_u16(),
        };

        (status, Json(body)).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => ApiError::NotFound("Ressource introuvable".to_string()),
            other => ApiError::Internal(other.into()),
        }
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
