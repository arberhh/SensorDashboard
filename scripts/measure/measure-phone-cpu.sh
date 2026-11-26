#!/bin/bash
# usage: measure-phone-cpu.sh <rn|exact> <run#> <results.csv>
# One measured run of one app on a physical iPhone over USB: relaunch it, then
# record Instruments' Activity Monitor through 20s idle, 16 swipes that move
# nothing (the tool's own cost) and the same 16 swipes as measure-phone.sh.
# Appends one CSV row with the app's CPU time and memory.
# Env: as measure-phone.sh.
set -euo pipefail
APP=$1; RUN=$2; OUT=$3
PHONE=${PHONE_UDID:?set PHONE_UDID to the UDID of the phone, from xcrun xctrace list devices}
IDLE_SECONDS=20 # four 5s feed ticks
SWIPES=8        # each way
PAUSE_MS=3500   # as measure-phone.sh, so both phone sessions send the same swipes
HERE=$(cd "$(dirname "$0")" && pwd)

case $APP in
  rn) ID=com.arberhh.sensordashboard; PROCESS="SensorDashboard" ;;
  exact) ID=com.arberhh.sensordashboard.exact; PROCESS="Exact SensorDashboard" ;;
  *) echo "rn or exact" >&2; exit 1 ;;
esac

ad() { agent-device "$@" --session sensor-measure --platform ios --udid "$PHONE" --json; }
now() { python3 -c "import time; print(time.time())"; }

TRACE=$(mktemp -d)/$APP-$RUN.trace
LOG=$TRACE.log

ad open "$ID" --relaunch >/dev/null
sleep 3 # first render and layout settle

# Release builds can't be attached to, so record every process and keep only
# the app's rows when reading the trace.
xcrun xctrace record --template "Activity Monitor" --device "$PHONE" --all-processes \
  --output "$TRACE" --no-prompt >"$LOG" 2>&1 &
RECORDER=$!
trap '[ -z "$RECORDER" ] || kill -TERM "$RECORDER" 2>/dev/null || true' EXIT
until grep -q "Ctrl-C to stop" "$LOG"; do
  kill -0 "$RECORDER" 2>/dev/null || { cat "$LOG" >&2; exit 1; }
  sleep 0.5
done
sleep 3 # the recording starts a moment after the prompt, and samples once a second

T_IDLE=$(now); sleep "$IDLE_SECONDS"
# Sideways swipes across the header move nothing in either app, so they cost
# only agent-device's accessibility read: the tool's share to subtract.
T_TOOL=$(now)
ad swipe 150 90 250 90 --count "$((SWIPES * 2))" --pause-ms "$PAUSE_MS" --no-post-gesture-stabilization >/dev/null
sleep 3.5
T_SCROLL=$(now)
ad swipe 200 650 200 250 --count "$SWIPES" --pause-ms "$PAUSE_MS" --no-post-gesture-stabilization >/dev/null
sleep 3.5 # the last fling down comes to rest
ad swipe 200 250 200 650 --count "$SWIPES" --pause-ms "$PAUSE_MS" --no-post-gesture-stabilization >/dev/null
sleep 3.5
T_END=$(now)

kill -INT "$RECORDER" || { cat "$LOG" >&2; exit 1; } # it died early: show why
wait "$RECORDER" || true
RECORDER=
ad close >/dev/null

[ -f "$OUT" ] || echo "app,run,idle_cpu_s,phone_tool_cpu_s,phone_scroll_cpu_s,phone_scroll_net_cpu_s,tool_wall_s,scroll_wall_s,mem_launch_mb,mem_scroll_mb" > "$OUT"
echo "$APP,$RUN,$(python3 "$HERE/sysmon.py" "$TRACE" "$PROCESS" "$T_IDLE" "$T_TOOL" "$T_SCROLL" "$T_END")" | tee -a "$OUT"
rm -rf "$(dirname "$TRACE")"
