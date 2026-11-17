use std::time::Duration;

use axum::{
    extract::{
        State, WebSocketUpgrade,
        ws::{Message, Utf8Bytes, WebSocket},
    },
    response::Response,
};
use tokio::{sync::broadcast::error::RecvError, time::timeout};

use crate::state::AppState;

// A client that stops reading without closing (an app suspended mid-connection)
// would block a send forever, and with it this task. Two ticks is plenty.
const SEND_TIMEOUT: Duration = Duration::from_secs(10);

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

    let snapshot = match serde_json::to_string(&*state.sensors.read().await) {
        Ok(snapshot) => snapshot,
        Err(error) => {
            tracing::error!(%error, "failed to serialize the sensors");
            return;
        }
    };
    if !send(&mut socket, snapshot.into()).await {
        return;
    }

    loop {
        tokio::select! {
            tick = rx.recv() => match tick {
                Ok(json) => {
                    if !send(&mut socket, json).await {
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

// False when the client is gone or stopped reading.
async fn send(socket: &mut WebSocket, json: Utf8Bytes) -> bool {
    match timeout(SEND_TIMEOUT, socket.send(Message::Text(json))).await {
        Ok(result) => result.is_ok(),
        Err(_) => {
            tracing::warn!("socket send timed out");
            false
        }
    }
}
