# Profiling

How the numbers in the main README's profiling report were captured, and
how to reproduce them.

## What is measured

A React `<Profiler>` wraps the whole app and records every commit's
`actualDuration`: the time React spent rendering that commit, on the JS
thread. Commits arrive in bursts: one at startup, then one every 5s when
the live feed ticks. `analyze.py` groups them by a gap of over 1s and sums
each burst.

This measures **JS render time only**. It doesn't see native layout, the
UI thread, or dropped frames. These are debug builds (Hermes, dev mode),
so absolute numbers are higher than a release build would show. Both
versions ran under identical conditions, so the comparison between them
holds.

## Setup used

- iOS Simulator, iPhone 17 Pro, debug build of the current native app
  (`com.arberhh.sensordashboard`), no interaction during runs.
- **Before:** `18c055f`, the last commit before ARB-20 (`FlatList`).
- **After:** `2b74209`, `main` at the time (`FlashList`, plus all later
  work, including live deviation recomputed every tick). So this is
  "before ARB-20" vs "current app", not ARB-20 in isolation.
- Both versions were given the same `sensor_readings.json` (500 sensors).
- 3 runs of 70s per version, alternated before/after, giving about 35
  ticks each.

Raw logs are in `raw/`. Each line is
`<commit #> <phase> <actualDuration ms> <baseDuration ms> <epoch ms>`.

## Reproduce

```bash
scripts/profiling/setup.sh 18c055f /tmp/wt-before
scripts/profiling/setup.sh main /tmp/wt-after
for i in 1 2 3; do
  scripts/profiling/profile.sh /tmp/wt-before /tmp/prof/before-$i.log 70
  scripts/profiling/profile.sh /tmp/wt-after /tmp/prof/after-$i.log 70
done
python3 scripts/profiling/analyze.py summary /tmp/prof
git worktree remove --force /tmp/wt-before && git worktree remove --force /tmp/wt-after
```

`profile.sh` restarts Metro on port 8081 for each run, so stop any Metro
you care about first. The app must already be installed on the booted
simulator (`npm run ios`).
