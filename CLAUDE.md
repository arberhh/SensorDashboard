# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## Commands

```bash
npm run ios              # build + launch on iOS Simulator
npm run android           # build + launch on Android
npm start                 # Metro bundler only
npm run ts:check           # tsc --noEmit
npm run lint               # oxlint --deny-warnings . && eslint . --max-warnings=0
npm run format             # oxfmt . (writes)
npm run format:check       # oxfmt --check . (manual only, not run in CI)
npm test                   # jest
npm run deadcode           # knip — unused files/exports/deps
npm run generate:data      # regenerates src/data/sensor_readings.json (500 sensors)
```

CI runs `ts:check`, `lint`, `test`, and `deadcode` on every PR/push to
`main` — don't re-run the full suite locally as a post-task "is everything
fine" step; only run one of these yourself when you need its output to make
your next edit (e.g. `ts:check` after a risky refactor). Formatting is
deliberately not a CI check — it's enforced only by the pre-commit hook
below, so it's never possible for a PR to be blocked purely on formatting.

`npm run prepare` (runs automatically on `npm install`) wires a pre-commit
hook (`.githooks/pre-commit`) that runs `oxfmt` on staged files — this is
the only place formatting is enforced.

## Architecture

**No backend.** Sensor data is a static, generated JSON file
(`src/data/sensor_readings.json`, 500 entries) produced by
`scripts/genSensorData.js` from a closed list of 20 location names. There's
no network layer — `HomeScreen` imports the JSON directly as initial state,
then a `setInterval` mutates `currentReading` for all 500 sensors every 5s
to simulate a live feed.

**Screens/navigation**: a two-screen native stack
(`App.tsx` → `src/navigation/types.ts` for the param list) — `Home`
(`src/screens/HomeScreen.tsx`) and `SensorDetail`
(`src/screens/SensorDetailScreen.tsx`, currently a placeholder — see ARB-10
in Linear). The header uses `theme.colors` via `screenOptions` rather than
React Navigation's default light theme.

**List rendering**: `FlashList` (`@shopify/flash-list`), not `FlatList` —
migrated in ARB-20 because filtering swaps which sensors occupy the visible
rows, which forces `FlatList` to mount fresh cells rather than update
existing ones; FlashList's cell recycling addresses that structurally.
`FlashList` has no `getItemLayout`/`windowSize`/`initialNumToRender` props
(auto-managed via recycling) — don't add them back.

The row itself is `src/components/SensorRow.tsx` (`RenderRow` +
`renderSensorRow`, the latter is what's passed to `renderItem`). It is
**not** wrapped in `React.memo` — FlashList's own `ViewHolder` already
gates re-renders on `item` reference equality (both via its own memo
comparator and a `useMemo` around the `renderItem` call itself), so an
additional memo layer here would be checking something already guaranteed.
`Sensor`/`TSensor` live in `src/types/sensor.ts` (not in `HomeScreen.tsx`
or `SensorRow.tsx`) specifically to avoid a circular import between the
screen and the row component.

**Theming**: `src/theme/index.ts`, default export only (`colors`,
`fontSizes`, `spacing`, `radii` are not separately exported — nothing in the app
imports them directly, only via `theme.colors.x` etc.). `spacing` is a
proportional scale derived from one `BASE_SPACING = 16` constant, not five
independent numbers. Every color, font size, and gutter in the app should
come from this file — no hex/rgba literals or raw pixel values in
`StyleSheet.create` calls in screen/component files.

**Sort/filter state** (`HomeScreen.tsx`): `typeFilter` and `activeSort` are
both toggleable — pressing the currently-active `TYPE`/`TREND`/`NAME` chip
again deselects it (reverts to `'all'` / clears `activeSort`) rather than
being a no-op. `TYPE` filter changes are deferred via `requestIdleCallback`
so they don't compete with an in-flight scroll for frame budget — the
5s reading interval is deliberately **not** deferred the same way, since
delaying live data would make it stale while someone's watching it.
`InteractionManager` has been removed from this React Native version;
`requestIdleCallback` is the real replacement, and has no TypeScript
declaration in RN's own types or this project's tsconfig — see
`src/types/globals.d.ts` for the ambient declaration.

## CI/CD

- `.github/workflows/ci.yml` — on every PR/push to `main`: `npm audit`
  (non-blocking — see the comment in the workflow for why), `ts:check`,
  `lint`, `test`, `deadcode`. Formatting is intentionally not a CI step —
  see Commands above.

## Commit/PR conventions

Commits and PR titles are prefixed with the Linear ticket ID, not a
conventional-commit type — e.g. `ARB-20: Migrate to FlashList, defer
filter taps, simplify row rendering`. Branch names match the ticket's
Linear-suggested branch name (e.g.
`arberihh/arb-20-fix-frame-drops-on-live-updates-and-filtersort-taps`).

**No AI attribution.** Do not add a `Co-Authored-By: Claude ...` trailer to
commit messages, and do not add "🤖 Generated with [Claude Code]" (or
similar) to PR descriptions. This project explicitly opts out — commit
history and PR authorship should read as solely the repo owner's.

GitHub PRs also carry exactly one type label — `feat`/`fix`/`refactor`/
`docs`/`chore`/`test` — applied at creation time. Linear's GitHub sync may
add a second label (`feat`) automatically on top of it; that's expected
and not worth fighting.
