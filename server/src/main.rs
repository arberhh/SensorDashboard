use std::time::Duration;

use sensor_server::{
    router,
    sensors::{apply_tick, generate_sensors},
    state::AppState,
};
use tokio::time::MissedTickBehavior;
use tracing_subscriber::{EnvFilter, filter::LevelFilter};

// Same port as the app's src/config.ts.
const ADDR: &str = "127.0.0.1:3000";
const SENSOR_COUNT: u32 = 500;
// Same cadence as the app's local feed.
const TICK_INTERVAL: Duration = Duration::from_secs(5);

#[tokio::main]
async fn main() {
    // Info by default; RUST_LOG=sensor_server=debug also shows every tick.
    let filter = EnvFilter::builder()
        .with_default_directive(LevelFilter::INFO.into())
        .from_env_lossy();
    tracing_subscriber::fmt().with_env_filter(filter).init();

    let state = AppState::new(generate_sensors(SENSOR_COUNT));
    tokio::spawn(tick(state.clone()));

    let listener = tokio::net::TcpListener::bind(ADDR)
        .await
        .expect("failed to bind 127.0.0.1:3000");
    tracing::info!("listening on http://{ADDR}");
    axum::serve(listener, router(state))
        .await
        .expect("server error");
}

// Moves every reading, serializes the array once and broadcasts it to all sockets.
async fn tick(state: AppState) {
    let mut interval = tokio::time::interval(TICK_INTERVAL);
    // If this task ever stalls, carry on from now instead of firing every missed tick at once.
    interval.set_missed_tick_behavior(MissedTickBehavior::Skip);
    // The first tick fires at once; skip it so the first update comes 5s in.
    interval.tick().await;

    loop {
        interval.tick().await;
        let snapshot = {
            let mut sensors = state.sensors.write().await;
            apply_tick(&mut sensors);
            serde_json::to_string(&*sensors)
        };
        let snapshot = match snapshot {
            Ok(snapshot) => snapshot,
            Err(error) => {
                tracing::error!(%error, "failed to serialize the sensors");
                continue;
            }
        };
        // Err only means no socket is connected right now.
        let sockets = state.tx.send(snapshot.into()).unwrap_or(0);
        tracing::debug!(sockets, "tick");
    }
}
