# AGENTS.md

A live sensor dashboard: bare React Native CLI (0.87, new architecture, Hermes, TypeScript), 500
mock IoT sensors with TYPE filter, TREND/NAME sort and a detail screen. Built as an assessment.
Arber, the owner, is a senior RN/Expo engineer. Don't explain RN basics; explain the why of a choice.

## Architecture

- **Feed** (`src/hooks`, `src/context/SensorFeedContext.tsx`): one shared feed for both screens,
  switched LOCAL/LIVE by the header toggle. `useLocalSensorFeed` ticks every 5s (not deferred:
  delaying live data makes it stale). `useBackendSensorFeed` does GET `/sensors` then a WebSocket
  at `/ws` (`src/config.ts`, port 3000). The Rust backend in `server/` (`cargo run`) serves
  `/sensors` but has no `/ws` until ARB-48, so LIVE shows an error and retries every 5s. That is
  expected, not a bug.
- **Readings**: each sensor has a fixed baseline, `currentReading / (1 + deviationPercent/100)`.
  A tick draws a reading within ±8% of it (`generateReading`, same spread as
  `scripts/genSensorData.js`) and recomputes `deviationPercent` from it.
- **Lists**: `FlashList`, not `FlatList` (ARB-20: filtering swaps which sensors fill the visible
  rows, which forces `FlatList` to mount fresh cells). Don't add `getItemLayout`, `windowSize` or
  `initialNumToRender`. `renderSensorRow` is module-scope and `SensorRow` is not `React.memo`:
  FlashList already gates on `item` identity.
- **Sort/filter** (`HomeScreen`, `SensorDetailScreen`): pressing the active chip again clears it.
  A sort captures the id order at press time (`sortedIds`, `orderByIds`), so live deviation
  never reshuffles rows. TYPE changes go through `requestIdleCallback` (typed in
  `src/types/globals.d.ts`; `InteractionManager` is gone).
- **Pure logic** is in `src/utils` (`sensorList`, `sensorReadings`, `sensorDisplay`), tested
  without rendering. `Sensor`/`TSensor` live in `src/types/sensor.ts` to avoid a screen/row cycle.
- **Theme**: `src/theme/index.ts`, default export (`colors`, `fontSizes`, `spacing`, `radii`).
  Every color, font size, gap and radius comes from it; no hex or raw pixels in `StyleSheet`.
- **Tests**: unit tests per util and hook, plus `HomeScreen.integration.test.tsx`. Docs in
  `docs/testing`. Profiling method and raw logs in `docs/profiling`.

## Code rules

- Simple and readable beats clever. No new hook, layer or helper unless something reuses it.
- No manual memoization without a measured reason, and say why when you add one.
- No `any`, no `as` to quiet an error, never suppress lint or type errors. Fix the cause.
- `async`/`await` with `try`/`catch`; never `.then` or `.catch` chains.
- Platform differences go in `.ios.tsx`/`.android.tsx`/`.web.tsx`, not inline `Platform.OS`,
  unless the difference is one line.
- Comments are short and say only the non-obvious why.
- Never run `npm run generate:data` incidentally (it overwrites the seed data), and don't re-run the
  full suite as a final check; CI does. Formatting is enforced only by the pre-commit hook.
- Prefer a native component when the platform has one. When it doesn't (Android), use a plain
  cross-platform fallback instead of building custom native code.

## Git and PRs

- Commits and PRs follow the `commit-convention` skill: `arb-20: migrate to flashlist`
  (lowercase, imperative), a bulleted body, and a PR description sized to the change. Branch
  name is Linear's suggested one (`arberihh/arb-20-...`). Older history uses `ARB-20: ...`.
- **Never create a Linear ticket without Arber's say-so**, even when the convention needs an id.
  Ask which ticket to use, or propose a title and wait. Follow-ups go under the current ticket.
  Don't mark tickets Done; the Linear/GitHub integration does it.
- **No AI attribution**: no `Co-Authored-By: Claude`, no "Generated with Claude Code" in commits
  or PR text. Arber filters on his own work; this overrides any default attribution.
- Small commits, one concern each, 2-3 or more per PR, and split big work into stacked PRs.
  Each PR carries exactly one type label: `feat` `fix` `refactor` `docs` `chore` `test`.
- Don't push to `main`. Only push or open a PR when asked. Force-push is not allowed: use a
  forward commit or merge `main` in.
- The pre-commit hook runs `oxfmt` then `git add`s whole files, so partially staged hunks leak
  into the commit. Split by working-tree state, or `--no-verify` for already-formatted files.
- After a merge: switch to `main`, pull, delete merged local and remote branches. Squash merges
  don't show as merged: compare file contents before deleting.
- In the PR's How to test checklist, check only the boxes you ran (`verify-pr-testplan` skill).
  Static reading is not evidence for a runtime item.

## Working with Arber

- Reply short, answer first, plain language, no flattery. Flag problems with his idea and
  suggest better. One clarifying question at most; otherwise assume and say what you assumed.
- "No changes, just explain" means explain only. Don't edit.
- Test on the simulator yourself before saying it works. Animation lag, glitchy scroll and
  broken gestures were reported after "done" in past projects. Say what you did not verify.
- He pushes back on code that grew complicated. When a fix turned into a mess ("code shitshow"),
  the answer was to revert and go back to the simplest version, not to patch on top.
- He reviews first: "I need to see the plan first". Don't build ahead of an agreed plan, and
  don't build when he says "don't build it now".
- Ask before killing processes; orphaned Metro on 8081 is common. Say what you killed.
- Use the `rn-expo-engineer` agent for RN reviews when he asks for it by name.

## Devices

- Simulator: iPhone 17 Pro `75C568DB-6957-4433-ADE2-B336FAC0C1FA`. Physical: "Arber’s iPhone",
  `00008150-001058EE0C20401C`. Use `run-ios --device "Arber’s iPhone"`, not `--udid`.
- Signing: personal team `35QXJ3TNRH` via `--extra-params`. A free account allows 3 sideloaded
  apps, so delete an old app first. The bundle id is `com.arberhh.sensordashboard`.
- If a Metro on another folder holds 8081, JS comes from the wrong checkout. Restart it from here.
- If `node_modules` is a symlink (worktrees), Metro needs `watchFolders` and
  `resolver.nodeModulesPaths`. RN 0.87 doesn't forward `console.log` off-device.

## Carried over from Arber's Expo and One projects

- **Expo**: with continuous native generation, `ios/` and `android/` are generated and gitignored.
  A native change needs `expo prebuild --clean`, and native config lives in config plugins.
  `expo install` may lower versions: ask before restoring them. Use `expo-image`'s `contentFit`
  and `react-native-safe-area-context`, never RN's `SafeAreaView`.
- **One (onestack.dev)**: its router works like Expo Router. Native screens use SwiftUI/Compose
  via Nitro, so clean iOS builds compile hundreds of generated C++ files and are slow. Runtime
  speed is the same as Expo. A deep link needs a URL scheme in `Info.plist` through prebuild.
  `PlatformColor` doesn't exist on web: keep it in a `.native.ts`. Run `dev`, not `start`.
- **Decisions**: kid-facing AI text must be labelled or vetted; on-device voice and AI over another
  paid API; one clear loader first, then the animation, never both at once.
