use axum::{Router, routing::get};

// Same port as the app's src/config.ts.
const ADDR: &str = "127.0.0.1:3000";

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(|| async { "ok" }));

    let listener = tokio::net::TcpListener::bind(ADDR)
        .await
        .expect("failed to bind 127.0.0.1:3000");
    println!("listening on http://{ADDR}");
    axum::serve(listener, app).await.expect("server error");
}
