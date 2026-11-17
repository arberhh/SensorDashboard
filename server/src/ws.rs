use axum::{
    extract::{
        State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use tokio::sync::broadcast::error::RecvError;

use crate::state::AppState;

pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(move |socket| async move {
        tracing::info!("socket connected");
        handle_socket(socket, state).await;
        tracing::info!("socket disconnected");
    })
}

// Sends a full snapshot, then every broadcast tick, until either side closes.
async fn handle_socket(mut socket: WebSocket, state: AppState) {
    // Subscribe before the snapshot, so a tick landing between the two isn't lost.
    let mut rx = state.tx.subscribe();

    let Ok(snapshot) = serde_json::to_string(&*state.sensors.read().await) else {
        return;
    };
    if socket.send(Message::Text(snapshot.into())).await.is_err() {
        return;
    }

    loop {
        tokio::select! {
            tick = rx.recv() => match tick {
                Ok(json) => {
                    if socket.send(Message::Text(json)).await.is_err() {
                        break;
                    }
                }
                // Every message is a full snapshot, so the skipped ones don't matter.
                Err(RecvError::Lagged(skipped)) => {
                    tracing::warn!(skipped, "socket lagged");
                    continue;
                }
                Err(RecvError::Closed) => break,
            },
            // Reading notices a closed client right away and lets axum answer
            // pings. A Close frame isn't a break: the next read sends the close
            // reply and returns None, so the client sees a clean close.
            incoming = socket.recv() => match incoming {
                None | Some(Err(_)) => break,
                Some(Ok(_)) => {}
            },
        }
    }
}
