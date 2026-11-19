---
name: run-sensordashboard
description: Launch and drive this bare React Native CLI app (SensorDashboard) for local development and testing on iOS Simulator.
---

# Running this app

This is a **bare React Native CLI** app (0.87, new architecture) —
not Expo. It lives in `apps/rn-sensor-dashboard`: run every command
below from that folder, and paths are relative to it. The app starts in LOCAL mode, where sensor data comes from a
static generated JSON file (`packages/sensor-core/src/sensor_readings.json`) and a 5s
simulated tick, so there are no env vars or network calls to configure
before launch. The header's LIVE toggle expects the Rust backend on
`localhost:3000`: start it with `cargo run` in the repo's `server/` (see
`server/README.md`). Without it, LIVE mode shows an error status and
retries; that's expected.

## Setup (first run, or after `Podfile`/native deps change)

**Don't run this preemptively on every launch** — it's a one-time
step per clone (or whenever `Podfile`/native deps change), and it
takes ~30-60s. Check first: if `ios/Pods/` already exists, skip it
and go straight to Launch below.

Only run it when `ios/Pods/` is missing, or when a build actually
fails with `xcodebuild` errors about missing
`Pods-SensorDashboard.debug.xcconfig` / `.xcfilelist` files:

```bash
cd ios && pod install && cd ..
```

**Also not a launch step** — `packages/sensor-core/src/sensor_readings.json` is
already checked in with 500 sensors. Only run this if explicitly
asked to regenerate the mock data; it overwrites the file with a
fresh random set, which isn't something to do incidentally while
just trying to launch the app:

```bash
npm run generate:data   # writes packages/sensor-core/src/sensor_readings.json (500 sensors)
```

## Launch

```bash
npx react-native run-ios                       # picks a default simulator
npx react-native run-ios --udid <simulator-id>  # target a specific one
```

To list available simulators: `xcrun simctl list devices available`.
Metro (the JS bundler) starts automatically in its own process/
terminal if not already running.

To stop Metro: find it with `ps aux | grep "react-native start"` and
kill that PID, or just close its terminal window.

## Verify it's running

Don't just confirm the build succeeded — confirm the screen actually
rendered sensor data:

1. Wait for the build to finish (`success Successfully launched the
app` in the CLI output), not a fixed sleep.
2. Screenshot the simulator: `xcrun simctl io <udid> screenshot
/tmp/verify.png`, then look at it. Confirm sensor cards with
   a location icon, name, READING and DEVIATION are rendering, not a
   blank navy screen or a red RN error overlay.
3. `console.log` output does **not** appear in Xcode's build log —
   it streams to whichever terminal is running `react-native start`
   (`ps aux | grep "react-native start"` to find it if unsure which
   window). Check there for JS-side errors/warnings.
4. For steady-state claims (e.g. "frame rate stays stable over
   several minutes"), a single screenshot isn't enough — re-check at
   multiple points over time rather than assuming a one-time check
   holds.

## Gotchas

- **Always open `ios/SensorDashboard.xcworkspace`, never the
  `.xcodeproj`.** Opening the `.xcodeproj` directly skips CocoaPods
  integration and reproduces the missing-xcconfig build errors from
  Setup above.
- **Both the reading and the deviation change every 5s in LOCAL
  mode.** Readings drift within ±8% of each sensor's baseline, so
  deviations should stay within about ±8%. A three-digit deviation
  means the drift logic in `packages/sensor-core/src/sensorReadings.ts` has regressed.
- **A sort freezes row order at press time.** With TREND sort on,
  values keep changing but rows don't move until the next chip press.
  That's intended, not a stale list.
- **The 5s reading-update interval must clean up on unmount and must
  not re-subscribe on every tick** — it previously leaked (stacked a
  new `setInterval` every update, uncleared). If frame rate degrades
  the longer the app sits open, check `useLocalSensorFeed.ts`'s
  `useEffect` first; its only dependency should be `enabled`, and it
  should return a `clearInterval` cleanup function.
- **Physical iPhone:** `--udid` only matches simulators, so use
  `npx react-native run-ios --device "<device name>"`. The Xcode project
  sets no signing team, so pass one at build time, e.g.
  `--extra-params "DEVELOPMENT_TEAM=<team id> CODE_SIGN_STYLE=Automatic
-allowProvisioningUpdates"`, rather than editing the project. With a
  free Apple account, at most 3 sideloaded apps can be installed at
  once; an install failing in `MIFreeProfileValidatedAppTracker` means
  that limit is reached.
- Duplicate sensor names are expected — the generator picks names
  randomly from a fixed 20-name pool across 500 sensors, so seeing
  e.g. two different "Cleanroom Suite 2" entries (different `id`,
  possibly different `type`) is normal, not a data bug.
