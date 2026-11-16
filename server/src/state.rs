use std::sync::Arc;

use tokio::sync::RwLock;

use crate::sensors::Sensor;

// Readers (GET /sensors) share the lock; ARB-48's tick task takes the write lock.
#[derive(Clone)]
pub struct AppState {
    pub sensors: Arc<RwLock<Vec<Sensor>>>,
}

impl AppState {
    pub fn new(sensors: Vec<Sensor>) -> Self {
        Self {
            sensors: Arc::new(RwLock::new(sensors)),
        }
    }
}
