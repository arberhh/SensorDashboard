# SensorDashboard in Expo Exact

The bare RN app in `../rn-sensor-dashboard` rebuilt in [Expo Exact](https://github.com/expo/exact): the
same two screens, 500-sensor seed, LOCAL/LIVE feed, TYPE filter and TREND/NAME sorts. It is
here so both apps can be measured side by side.

Exact isn't React Native: the view is Contract (`app.contract`), the data module TypeScript
(`app.ts`, run on Hermes), the brand colours `app.forma`. No React, FlashList or React
Navigation, so the code differs; the behaviour and look match.

## Setup

Exact has no package; it runs from a checkout next to this repo (`EXACT` overrides the path).
Built and tested against Exact `8be4aafa45aa93ca62b36f9be4703721cd11c93f`. Exact is pre-1.0
and changes daily, so pin that commit when comparing numbers.

```sh
git clone https://github.com/expo/exact.git ../../../exact   # i.e. ~/Desktop/Dev/exact
git -C ../../../exact checkout 8be4aafa45aa93ca62b36f9be4703721cd11c93f
bun ../../../exact/scripts/exact.mjs setup                   # needs rustup and Bun 1.4.2
```

## Run

```sh
bun exact.mjs test web                       # app.test.contract
bun exact.mjs web                            # dev loop in the browser
EXACT_SIM=<udid> bun exact.mjs ios --run     # iOS Simulator; first build 10-15 min
```

LIVE needs the backend: `cargo run` in `../../server`. Without it LIVE shows the error and
retries every 5s, as the RN app does.

## Mapping

| RN | Exact |
| --- | --- |
| `useLocalSensorFeed` 5s interval | `task localTick` re-asks `localFeed(tick)` |
| `useBackendSensorFeed` WebSocket | `liveFeed(attempt)`, a `fetch` with `exactStream`; `task retry` bumps `attempt` |
| `HomeScreen` reducer, `sortedIds` | `sortField`/`sortDir` state; ranks from `rankSorted` |
| `requestIdleCallback` on TYPE | `after(1, commitType, wait=idle)` |
| `FlashList` | `list virtualized=true` |
| native-stack | `routes nav`, a row is a `link` |

## Differences from the RN app

- **The sort's reorder lands one commit after the press.** Contract caps one evaluation at
  65,536 list steps, so `rankSorted` in `app.ts` sorts and ranks the ids; it is a mutation,
  whose reply arrives on the next commit. Until then the rows stay in feed order.
- **The seed and the pure logic are copies.** Exact only resolves imports inside this folder,
  so `sensor_readings.json` is a copy of the RN app's `src/data` (its `exactSeed` test fails
  if they differ) and `app.ts` ports its `src/utils/sensorReadings.ts` and `sortSensors` by
  hand.
- **Random readings** come from `crypto.getRandomValues` (`Math.random` is unavailable in
  data sources); under the agent they repeat per launch seed.
- **The sort bar stays pinned above the list**, as in RN. The compiler warns
  (`lower-list-beside-fixed`) because iOS lists usually scroll under a pinned bar.
- Bundle id `com.arberhh.sensordashboard.exact` and display name "Exact SensorDashboard", so
  it installs beside the RN app ("RN SensorDashboard").
