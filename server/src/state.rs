use std::sync::Arc;

use axum::extract::ws::Utf8Bytes;
use tokio::sync::{RwLock, broadcast};

use crate::sensors::Sensor;

// Readers (GET /sensors) share the lock; ARB-48's tick task takes the write lock.
#[derive(Clone)]
pub struct AppState {
    pub sensors: Arc<RwLock<Vec<Sensor>>>,
    pub tx: broadcast::Sender<Utf8Bytes>,
}

impl AppState {
    pub fn new(sensors: Vec<Sensor>) -> Self {
        // How many ticks a slow client can miss before it gets Lagged.
        let (tx, _) = broadcast::channel(16);
        Self {
            sensors: Arc::new(RwLock::new(sensors)),
            tx,
        }
    }
}
