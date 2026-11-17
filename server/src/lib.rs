use axum::{Json, Router, extract::State, routing::get};
use tower_http::cors::CorsLayer;

use crate::{sensors::Sensor, state::AppState};

pub mod sensors;
pub mod state;
pub mod ws;

// Lives in the library so tests/http.rs can drive it without a socket.
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/sensors", get(sensors))
        .route("/ws", get(ws::ws_handler))
        // Native RN ignores CORS; react-native-web doesn't.
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn sensors(State(state): State<AppState>) -> Json<Vec<Sensor>> {
    Json(state.sensors.read().await.clone())
}
