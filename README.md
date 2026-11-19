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
