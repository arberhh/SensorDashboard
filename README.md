# SensorDashboard

A live sensor dashboard (500 mock IoT sensors, TYPE filter, TREND/NAME sort, a detail screen)
built in more than one stack, so the builds can be measured against each other on the same
device.

| Folder | Stack | On the phone |
| --- | --- | --- |
| [`apps/rn-sensor-dashboard`](apps/rn-sensor-dashboard/README.md) | Bare React Native CLI 0.87 | RN SensorDashboard |
| [`apps/exact-sensor-dashboard`](apps/exact-sensor-dashboard/README.md) | [Expo Exact](https://github.com/expo/exact) | Exact SensorDashboard |
| [`packages/sensor-core`](packages/sensor-core) | Seed data and pure logic both apps import | |
| [`server`](server/README.md) | Rust backend for LIVE mode | |

Each app has its own toolchain and README; run its commands from its folder. The apps share
their seed data and pure logic through `sensor-core`; a behaviour change in one app's UI should
land in the others.

## Measurements

[`scripts/measure`](scripts/measure/README.md) measures the builds the same way, from outside the
app, on release builds. The results, with charts and the raw rows, are in
[`docs/measurements`](docs/measurements/README.md).

On an iPhone 17 Pro, RN dropped no frames while scrolling and Exact about 10 per run; both are
in Apple's good band. On the simulator, Exact used about 12% less CPU to scroll.
