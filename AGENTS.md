# AGENTS.md

A live sensor dashboard: 500 mock IoT sensors with TYPE filter, TREND/NAME sort and a detail
screen. The same app is built in more than one stack, so the builds can be measured against each
other. Assume the reader knows the stack: explain the why of a choice, not the basics.

## Layout

- `apps/<stack>-sensor-dashboard`: one build per stack, each with its own toolchain, README and
  checks. Run a build's commands from its folder. Today: `rn` (bare React Native) and `exact`
  (Expo Exact).
- `packages/sensor-core`: the seed data (`sensor_readings.json`), the `Sensor` type and the pure
  logic (`sensorList`, `sensorReadings`, `sensorSnapshot`). Builds import it, so they can't drift.
- `server/`: the Rust backend every build follows in LIVE mode (`cargo run`, port 3000).
- `scripts/measure`: measures the builds the same way, from outside the app. Results and charts
  go in `docs/measurements`.

## What every build does

A behaviour change in one build should land in the others. This is the shared behaviour:

- **Feed**: one feed for both screens, switched LOCAL/LIVE by the header toggle. LOCAL ticks
  every 5s, and a tick is never deferred, because delaying live data makes it stale. LIVE
  follows the server's WebSocket at `/ws`, which sends the full array on connect and on every
  tick. Without the server, LIVE shows an error and retries every 5s. That is expected, not a bug.
- **Readings**: each sensor has a fixed baseline, `currentReading / (1 + deviationPercent/100)`.
  A tick draws a reading within ±8% of it and recomputes `deviationPercent`.
- **Sort and filter**: pressing the active chip again clears it. A sort captures the id order at
  press time, so live deviation never reshuffles the rows.
- **List**: 500 rows through the stack's virtualized list, recycling rows where it can.
- **Detail**: one sensor, its type, and the similar sensors with their own sort. An unknown id
  shows an empty state.
- **Look**: the same dark theme. Colours, font sizes, gaps and radii come from one set of
  tokens per build, never from literals in a view.
- **Logic**: anything pure (filtering, ordering, the reading maths) belongs in `sensor-core`
  with a test, not in a build.

## Adding a build

- Folder `apps/<stack>-sensor-dashboard`, bundle id `com.arberhh.sensordashboard.<stack>` and a
  display name `<Stack> SensorDashboard`, so the builds install side by side.
- Import the seed and the logic from `sensor-core`; don't copy them.
- Give it a README: setup, run, checks, and what differs from the other builds and why.
- Add it to `scripts/measure` (the app cases in `measure.sh`, `measure-phone.sh` and `run.sh`,
  and `APPS` in `chart.py`) and to the table in the root README.
- Keep the toolchain inside the folder. One build's lint, tests or bundler must not pick up
  another build's files.

## Code rules

- Simple and readable beats clever. No new layer or helper unless something reuses it.
- No optimization without a measured reason, and say why when you add one.
- Never suppress a lint or type error, and no casts that only quiet one. Fix the cause.
- Comments are short and say only the non-obvious why.
- Prefer what the platform or the stack already provides over custom native code.
- No private data in the repo: Apple team ids, device UDIDs, home-folder paths, emails,
  secrets. `scripts/check-private-data.sh` blocks them in the pre-commit hook and in CI.
  When it fires, use a placeholder (`<team id>`) or an env var; don't skip it.

## Measuring

- Measure release builds, from outside the app, alternating the builds; see
  `scripts/measure/README.md`. An in-app profiler can't compare two stacks.
- The swipe tool (agent-device) reads the app's whole accessibility tree before every swipe, on
  the app's main thread. On the simulator subtract it (`tool_cpu_s`); on a phone keep swipes
  3.5s apart. Never compare frames from rapid swipes.
- Report the median with the range, the device, and what was not measured.

## Git and PRs

Commit messages, PR descriptions, the type label, the checks to run and the How to test
checklist are in the `commit-convention`, `label-pr` and `verify-pr-testplan` skills
(`.claude/skills`). Only what they don't cover is here:

- **Never create a Linear ticket without the owner's say-so**, even when the convention needs
  an id. Ask which ticket to use, or propose a title and wait. Follow-ups go under the current
  ticket. Don't mark tickets Done; the Linear/GitHub integration does it.
- 2-3 or more commits per PR, and split big work into stacked PRs.
- Don't push to `main`. Force-push is not allowed: use a forward commit or merge `main` in.
- After a merge: switch to `main`, pull, delete merged local and remote branches. Squash merges
  don't show as merged: compare file contents before deleting.

## Working here

- Plan first: agree the plan before building, and don't build ahead of it.
- Run the app yourself on a simulator or device before saying it works: animation lag, glitchy
  scroll and broken gestures don't show in tests. Say what you did not verify.
- When a fix grows complicated, revert to the simplest version instead of patching on top.
- "No changes, just explain" means explain only. Don't edit.
- Ask before killing processes; an orphaned dev server on a port is common. Say what you killed.

## Devices

- Measurements so far are on an iPhone 17 Pro, simulator and phone. Pass your own with
  `SIM_UDID` and `PHONE_UDID`.
- The measurement runner is a sideloaded app too, so it takes one of a free account's slots.

## The React Native build (`apps/rn-sensor-dashboard`)

Bare React Native CLI 0.87, new architecture, Hermes, TypeScript. Paths below are relative to it.

- **Run and verify**: the `run-sensordashboard` skill (setup, launch, a phone, gotchas).
- **Pre-commit hook** (`.githooks`): runs `oxfmt` on this app and on `sensor-core`, then
  `git add`s whole files, so partially staged hunks leak into the commit. Split by
  working-tree state, or `--no-verify` for already-formatted files.
- **Feed**: `src/hooks` and `src/context/SensorFeedContext.tsx`; the server address is in
  `src/config.ts`.
- **Lists**: `FlashList`, not `FlatList` (ARB-20: filtering swaps which sensors fill the visible
  rows, which forces `FlatList` to mount fresh cells). Don't add `getItemLayout`, `windowSize` or
  `initialNumToRender`. `renderSensorRow` is module-scope and `SensorRow` is not `React.memo`:
  FlashList already gates on `item` identity.
- **Sort/filter**: `sortedIds` and `orderByIds` in `HomeScreen` and `SensorDetailScreen`. TYPE
  changes go through `requestIdleCallback` (typed in `src/types/globals.d.ts`;
  `InteractionManager` is gone).
- **Theme**: `src/theme/index.ts`, default export (`colors`, `fontSizes`, `spacing`, `radii`).
  No hex or raw pixels in `StyleSheet`.
- **Code**: no `any` and no `as` to quiet an error. `async`/`await` with `try`/`catch`, never
  `.then` or `.catch` chains. Platform differences go in `.ios.tsx`/`.android.tsx`/`.web.tsx`,
  not inline `Platform.OS`, unless the difference is one line. No manual memoization without a
  measured reason.
- **Tests**: unit tests per util and hook, plus `HomeScreen.integration.test.tsx`; the
  `sensor-core` tests run from this app's `__tests__`. Docs in `docs/testing`, the profiling
  method and raw logs in `docs/profiling`.
- **Metro**: if a Metro from another folder holds 8081, JS comes from the wrong checkout:
  restart it from here. If `node_modules` is a symlink (worktrees), Metro needs
  `watchFolders` and `resolver.nodeModulesPaths`.

## The Exact build (`apps/exact-sensor-dashboard`)

Expo Exact, run from an Exact checkout beside this repo (`../exact`); see its README for setup
and the pinned Exact commit.

- `app.contract` is the view, `app.ts` the data module, `app.test.contract` the tests and
  `app.json` the manifest. `exact.mjs` is generated, so don't edit it.
- The checkout's `docs/start-here.md` is the required reading, and `bun exact.mjs help` lists
  the verbs.
- When a feature works, run `bun exact.mjs verify`, then `verify ios`.
- It type-checks `sensor-core` from the committed `types/*.d.ts`. After changing the package's
  source run `npm run core:types` in the RN app (CI fails if they are stale). After adding a
  file to the package run `bun install` here, because bun links it file by file.
- `bun exact.mjs update` writes its own `AGENTS.md` and `CLAUDE.md` into the app. They are
  gitignored, because this file is the only one.

## The server (`server/`)

Rust; `cargo run` serves the sensors on port 3000 and broadcasts every tick on `/ws`. It is for
development only: open CORS, no auth, state in memory. See `server/README.md`.

- Its readings use the same spread as the LOCAL feed, so LIVE and LOCAL look alike.
