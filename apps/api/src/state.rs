use std::sync::Arc;

use dashmap::DashMap;
use serde::Serialize;
use sqlx::PgPool;
use tokio::sync::broadcast;

use crate::storage::R2Storage;

/// Event envoyé aux clients WebSocket abonnés à une commande (miroir de
/// `commandes.gateway.ts` : `commande:status`).
#[derive(Debug, Clone, Serialize)]
pub struct StatusEvent {
    pub status: String,
}

/// Registre des canaux de diffusion, un par `public_token` de commande.
/// Une entrée n'est créée qu'à la connexion WebSocket (lazy) et doit être
/// purgée par l'appelant quand la commande est `COMPLETED` ou que plus
/// personne n'écoute, sinon elle grossit indéfiniment.
pub type WsRegistry = Arc<DashMap<String, broadcast::Sender<StatusEvent>>>;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub ws_registry: WsRegistry,
    pub jwt_secret: Arc<str>,
    pub frontend_url: Arc<str>,
    pub storage: R2Storage,
}

impl AppState {
    /// Récupère (ou crée) le canal de diffusion d'une commande et publie le
    /// nouveau statut. Sans abonné, l'envoi est silencieusement ignoré par
    /// `broadcast` — c'est pourquoi le client doit toujours re-fetch l'état
    /// via `GET /commandes/public/:token` à la connexion.
    pub fn broadcast_status(&self, public_token: &str, status: &str) {
        if let Some(sender) = self.ws_registry.get(public_token) {
            let _ = sender.send(StatusEvent {
                status: status.to_string(),
            });
        }
    }

    /// Purge l'entrée du registre — à appeler quand la commande passe à
    /// `COMPLETED` pour éviter une fuite mémoire (une entrée par commande à
    /// vie sinon).
    pub fn forget_commande(&self, public_token: &str) {
        self.ws_registry.remove(public_token);
    }
}
