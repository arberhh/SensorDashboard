use std::time::Duration;

use axum::{Json, Router, extract::State, routing::get};
use sensor_server::{
    sensors::{Sensor, apply_tick, generate_sensors},
    state::AppState,
    ws,
};
use tower_http::cors::CorsLayer;

// Same port as the app's src/config.ts.
const ADDR: &str = "127.0.0.1:3000";
const SENSOR_COUNT: u32 = 500;
// Same cadence as the app's local feed.
const TICK_INTERVAL: Duration = Duration::from_secs(5);

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state = AppState::new(generate_sensors(SENSOR_COUNT));
    tokio::spawn(tick(state.clone()));

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/sensors", get(sensors))
        .route("/ws", get(ws::ws_handler))
        // Native RN ignores CORS; react-native-web doesn't.
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(ADDR)
        .await
        .expect("failed to bind 127.0.0.1:3000");
    tracing::info!("listening on http://{ADDR}");
    axum::serve(listener, app).await.expect("server error");
}

async fn sensors(State(state): State<AppState>) -> Json<Vec<Sensor>> {
    Json(state.sensors.read().await.clone())
}

// Moves every reading, serializes the array once and broadcasts it to all sockets.
async fn tick(state: AppState) {
    let mut interval = tokio::time::interval(TICK_INTERVAL);
    // The first tick fires at once; skip it so the first update comes 5s in.
    interval.tick().await;

    loop {
        interval.tick().await;
        let snapshot = {
            let mut sensors = state.sensors.write().await;
            apply_tick(&mut sensors);
            serde_json::to_string(&*sensors)
        };
        let Ok(snapshot) = snapshot else { continue };
        // Err only means no socket is connected right now.
        let sockets = state.tx.send(snapshot.into()).unwrap_or(0);
        tracing::info!(sockets, "tick");
    }
}
