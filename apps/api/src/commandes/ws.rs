use axum::{
    extract::{
        Path, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use tokio::sync::broadcast;

use crate::state::AppState;

/// Miroir de `commandes.gateway.ts` : le client se connecte directement sur
/// `/commandes/ws/:token` (équivalent du `join:commande` room de Socket.IO) et
/// reçoit un event `commande:status` en JSON à chaque changement de statut.
/// Sans abonné actif, `broadcast::send` échoue silencieusement — le client
/// doit donc toujours re-fetch `GET /commandes/public/:token` à la connexion
/// pour rattraper l'état courant.
async fn handle_socket(mut socket: WebSocket, state: AppState, token: String) {
    let mut receiver = {
        let sender = state
            .ws_registry
            .entry(token.clone())
            .or_insert_with(|| broadcast::channel(16).0)
            .clone();
        sender.subscribe()
    };

    loop {
        tokio::select! {
            event = receiver.recv() => {
                match event {
                    Ok(event) => {
                        let Ok(payload) = serde_json::to_string(&event) else { continue };
                        if socket.send(Message::Text(payload.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
            incoming = socket.recv() => {
                match incoming {
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Err(_)) => break,
                    _ => {}
                }
            }
        }
    }

    // Purge si plus personne n'écoute cette commande (voir aussi
    // `AppState::forget_commande`, appelé explicitement au statut COMPLETED).
    if let Some(sender) = state.ws_registry.get(&token) {
        if sender.receiver_count() == 0 {
            drop(sender);
            state.ws_registry.remove(&token);
        }
    }
}

pub async fn upgrade(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, token))
}
