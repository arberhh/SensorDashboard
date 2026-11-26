# Measuring the apps against each other

Runs the same scripted session on each app on the iOS Simulator and records what it cost:
relaunch, 20s idle (four feed ticks), 30 swipes that do nothing (the tool's own cost), then
15 swipes down the list and 15 back up.

```sh
npm install -g agent-device            # once; drives the swipes through an XCTest runner
scripts/measure/run.sh 5               # 5 alternating runs per app, then the medians
```

Install **release** builds on the simulator first, or you measure Metro and debug checks:

```sh
(cd apps/rn-sensor-dashboard && npx react-native run-ios --mode Release --udid <udid> --no-packager)
(cd apps/exact-sensor-dashboard && bun exact.mjs ios --release --run --sim <udid>)
```

`SIM_UDID` is required and picks the simulator (`xcrun simctl list devices`). Each run appends a
row to `measure-output/results-<time>.csv`. That folder is ignored: to keep a run, copy its CSV
to `docs/measurements/` and draw it with `python3 scripts/measure/chart.py <results.csv> <out.svg>`.

| Column | What it is |
| --- | --- |
| `startup_ms` | agent-device's `open` round trip: launch until the app answers. Includes the runner's own overhead, so compare apps, don't quote it as launch time |
| `idle_cpu_s` | CPU seconds the app used in 20s without input (the cost of four ticks) |
| `tool_cpu_s` | CPU seconds the app used during 30 sideways swipes across the header, which move nothing. This is agent-device's cost: it reads the app's whole accessibility tree before every swipe |
| `scroll_cpu_s` | CPU seconds the app used during the 30 swipes on the list, the tool's share included |
| `scroll_net_cpu_s` | `scroll_cpu_s` less `tool_cpu_s`: the app's own cost of scrolling |
| `scroll_wall_s` | how long the swipes took; should match between apps |
| `rss_launch_mb`, `rss_scroll_mb` | resident memory after launch and after the scroll |

## Frames, on a phone

The simulator can't report frames: Instruments' Animation Hitches template refuses it ("Hitches
is not supported on this platform") and it draws at 60 Hz with the Mac's GPU. `TARGET=phone`
sends 8 swipes each way on a physical iPhone while Instruments records hitches. The swipes are
3.5s apart: agent-device's accessibility read blocks the app's main thread for about half a
second on a phone, and at 400ms apart it lands on the previous fling and shows up as hitches
(11 to 15 ms/s in both apps, against 0 to 2 once spaced).

```sh
export PHONE_UDID=<udid>  # from: xcrun xctrace list devices
export AGENT_DEVICE_IOS_TEAM_ID=<team id> AGENT_DEVICE_IOS_BUNDLE_ID=<any id you own>.runner
TARGET=phone scripts/measure/run.sh 3  # about 5 minutes a run: saving a trace is slow
```

- The phone must be on USB and unlocked. Over Wi-Fi the recording drops after a second.
- agent-device installs its own runner app, signed with that team. On a free account it takes
  one of the three sideload slots, next to the two apps.
- If agent-device ran before those variables were set, run `agent-device daemon stop` first:
  the running daemon keeps the old signing.
- Install release builds on the phone first (`run-ios --mode Release --device "<name>"`,
  `bun exact.mjs ios --release --device --run`).

| Column | What it is |
| --- | --- |
| `moving_s` | seconds of the recording in which the screen showed a new frame |
| `hitches` | frames the app delivered late during the run |
| `hitch_ms`, `longest_hitch_ms` | total and longest time those frames were late |
| `hitch_ms_per_s` | `hitch_ms` over `moving_s`; Apple's guide: under 5 good, over 10 a problem |
| `fps_max` | the most frames shown in one second |
| `fps_mean` | frames per second over `moving_s`. Low by design: the phone slows its refresh rate as a fling slows, so don't read it as dropped frames |

`TARGET=phone-nav` records the same columns while a tap opens the first row's detail screen and
a tap on the back button returns, 8 times, 3.5s apart. Its first column is `nav_wall_s`.

## CPU and memory, on a phone

`TARGET=phone-cpu` records Instruments' Activity Monitor instead: 20s idle, 16 swipes that move
nothing, then the same 16 swipes as the frames run. It needs the same setup as `TARGET=phone`.

```sh
TARGET=phone-cpu scripts/measure/run.sh 3  # about 3 minutes a run
```

| Column | What it is |
| --- | --- |
| `idle_cpu_s` | CPU seconds the app used in 20s without input |
| `phone_tool_cpu_s` | CPU seconds the app used during 16 sideways swipes that move nothing: agent-device's cost |
| `phone_scroll_cpu_s` | CPU seconds the app used during the 16 swipes on the list, the tool's share included |
| `phone_scroll_net_cpu_s` | `phone_scroll_cpu_s` less `phone_tool_cpu_s`. Noisy: the tool's share is the larger part |
| `tool_wall_s`, `scroll_wall_s` | how long each set of swipes took; they should match |
| `mem_launch_mb`, `mem_scroll_mb` | the app's memory footprint after launch and after the scroll |

Frames and CPU are separate runs, so the CPU recording can't disturb the frame numbers.

## What this does not measure

Startup on the phone, and anything on Android.
