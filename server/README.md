# Sensor server

The backend for the app's LIVE mode: 500 simulated sensors over HTTP and a WebSocket. Rust, axum, tokio.

> **Dev only.** CORS is open to any origin, sensors live in memory and reset on restart, and there is no auth. It binds `127.0.0.1`, so the iOS Simulator and the Android emulator (`10.0.2.2`) reach it, but a physical phone does not.

## Run

```bash
cd server
cargo run   # http://127.0.0.1:3000, the port in the app's src/config.ts
```

Needs Rust stable via `rustup`. With Homebrew, it isn't linked into your PATH:

```bash
brew install rustup
echo 'export PATH="/opt/homebrew/opt/rustup/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
rustup default stable
```

Then, in the app, tap the header toggle to switch to LIVE.

## Endpoints

| Endpoint       | Returns                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| `GET /health`  | `ok`                                                                          |
| `GET /sensors` | The current 500 sensors as a JSON array, the shape of `src/data/sensor_readings.json` |
| `GET /ws`      | A WebSocket. Sends the full array on connect, then the full array again every 5s |

Every 5s each reading moves to a random value within ±8% of the sensor's fixed baseline, and `deviationPercent` is recomputed from it, the same as the app's LOCAL feed. Each message replaces the whole list, so a client that misses one loses nothing.

```bash
curl -s localhost:3000/health
curl -s localhost:3000/sensors | jq 'length, .[0]'

# WebSocket: prints the number of sensors in each message (Node 22+ has WebSocket built in)
node -e 'new WebSocket("ws://127.0.0.1:3000/ws").onmessage = (e) => console.log(JSON.parse(e.data).length)'
# or: websocat ws://127.0.0.1:3000/ws   (brew install websocat)
```

## Code

| File              | What it holds                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `src/main.rs`     | Starts the server and the 5s tick task                                                              |
| `src/lib.rs`      | The router and `GET /sensors`                                                                       |
| `src/ws.rs`       | `GET /ws`: snapshot on connect, then forwards every tick until either side closes                   |
| `src/state.rs`    | `AppState`: the sensors behind a `RwLock`, and the broadcast channel the tick sends on              |
| `src/sensors.rs`  | The `Sensor` model, the generator (ported from `scripts/genSensorData.js`) and `apply_tick`, with unit tests |
| `tests/http.rs`   | `/health` and `/sensors` through the router, without a socket                                       |

## Check

```bash
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

CI runs the same in the `server` job. The WebSocket has no automated test; it is checked by hand with the commands above.
