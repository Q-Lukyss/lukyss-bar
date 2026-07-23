use std::sync::Arc;

use aws_sdk_s3::{
    Client,
    config::{BehaviorVersion, Builder, Credentials, Region},
    error::SdkError,
    primitives::ByteStream,
};

use crate::error::ApiError;

/// Client de stockage objet pointant vers un bucket Cloudflare R2 (API
/// compatible S3). Bon marché à cloner : `Client` et `bucket` sont tous les
/// deux `Arc` en interne.
#[derive(Clone)]
pub struct R2Storage {
    client: Client,
    bucket: Arc<str>,
}

impl R2Storage {
    pub fn new(
        account_id: &str,
        access_key_id: &str,
        secret_access_key: &str,
        bucket: &str,
    ) -> Self {
        let credentials = Credentials::new(access_key_id, secret_access_key, None, None, "r2");

        let config = Builder::new()
            .region(Region::new("auto"))
            .endpoint_url(format!("https://{account_id}.r2.cloudflarestorage.com"))
            .credentials_provider(credentials)
            .behavior_version(BehaviorVersion::latest())
            .force_path_style(true)
            .build();

        Self {
            client: Client::from_conf(config),
            bucket: bucket.into(),
        }
    }

    pub async fn put(&self, key: &str, bytes: Vec<u8>, content_type: &str) -> Result<(), ApiError> {
        self.client
            .put_object()
            .bucket(self.bucket.as_ref())
            .key(key)
            .body(ByteStream::from(bytes))
            .content_type(content_type)
            .send()
            .await
            .map_err(|err| ApiError::Internal(err.into()))?;

        Ok(())
    }

    /// Retourne `None` si la clé n'existe pas dans le bucket.
    pub async fn get(&self, key: &str) -> Result<Option<(Vec<u8>, Option<String>)>, ApiError> {
        let result = self
            .client
            .get_object()
            .bucket(self.bucket.as_ref())
            .key(key)
            .send()
            .await;

        let output = match result {
            Ok(output) => output,
            Err(SdkError::ServiceError(ctx)) if ctx.err().is_no_such_key() => return Ok(None),
            Err(err) => return Err(ApiError::Internal(err.into())),
        };

        let content_type = output.content_type().map(str::to_string);
        let bytes = output
            .body
            .collect()
            .await
            .map_err(|err| ApiError::Internal(err.into()))?
            .to_vec();

        Ok(Some((bytes, content_type)))
    }

    pub async fn delete(&self, key: &str) -> Result<(), ApiError> {
        self.client
            .delete_object()
            .bucket(self.bucket.as_ref())
            .key(key)
            .send()
            .await
            .map_err(|err| ApiError::Internal(err.into()))?;

        Ok(())
    }
}
