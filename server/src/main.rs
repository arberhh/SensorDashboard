use axum::{Json, Router, extract::State, routing::get};
use sensor_server::{
    sensors::{Sensor, generate_sensors},
    state::AppState,
    ws,
};
use tower_http::cors::CorsLayer;

// Same port as the app's src/config.ts.
const ADDR: &str = "127.0.0.1:3000";
const SENSOR_COUNT: u32 = 500;

#[tokio::main]
async fn main() {
    let state = AppState::new(generate_sensors(SENSOR_COUNT));

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
    println!("listening on http://{ADDR}");
    axum::serve(listener, app).await.expect("server error");
}

async fn sensors(State(state): State<AppState>) -> Json<Vec<Sensor>> {
    Json(state.sensors.read().await.clone())
}
