use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode},
};
use sensor_server::{router, sensors::generate_sensors, state::AppState};
use serde_json::Value;
use tower::ServiceExt;

async fn get(path: &str) -> (StatusCode, Vec<u8>) {
    let app = router(AppState::new(generate_sensors(500)));
    let response = app
        .oneshot(Request::get(path).body(Body::empty()).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let body = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    (status, body.to_vec())
}

#[tokio::test]
async fn health_is_ok() {
    let (status, body) = get("/health").await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, b"ok");
}

#[tokio::test]
async fn sensors_returns_500_in_the_app_shape() {
    let (status, body) = get("/sensors").await;

    assert_eq!(status, StatusCode::OK);
    let sensors: Vec<Value> = serde_json::from_slice(&body).unwrap();
    assert_eq!(sensors.len(), 500);
    for sensor in &sensors {
        let mut keys: Vec<&str> = sensor
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        keys.sort_unstable();
        assert_eq!(
            keys,
            [
                "currentReading",
                "deviationPercent",
                "id",
                "name",
                "sensorId",
                "type",
                "unit"
            ]
        );
    }
}
