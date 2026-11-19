#!/bin/bash
# usage: measure-phone.sh <rn|exact> <run#> <results.csv>
# One measured run of one app on a physical iPhone over USB: relaunch it, then
# record Instruments' Animation Hitches while the same scripted swipes as
# measure.sh scroll the list down and back up. Appends one CSV row.
# Env: PHONE_UDID (required: the phone's UDID), plus agent-device's
# runner signing (AGENT_DEVICE_IOS_TEAM_ID, AGENT_DEVICE_IOS_BUNDLE_ID).
set -euo pipefail
APP=$1; RUN=$2; OUT=$3
PHONE=${PHONE_UDID:?set PHONE_UDID to the UDID of the phone, from xcrun xctrace list devices}
SWIPES=8 # each way
# agent-device reads the whole accessibility tree before every swipe, which
# blocks the app's main thread for about half a second on a phone. The pause
# lets each fling come to rest first, so that read never lands on moving frames.
PAUSE_MS=3500
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
xcrun xctrace record --template "Animation Hitches" --device "$PHONE" --all-processes \
  --output "$TRACE" --no-prompt >"$LOG" 2>&1 &
RECORDER=$!
until grep -q "Ctrl-C to stop" "$LOG"; do
  kill -0 "$RECORDER" 2>/dev/null || { cat "$LOG" >&2; exit 1; }
  sleep 0.5
done
sleep 2 # the recording starts a moment after the prompt

T0=$(now)
ad swipe 200 650 200 250 --count "$SWIPES" --pause-ms "$PAUSE_MS" --no-post-gesture-stabilization >/dev/null
sleep 3.5 # the last fling down comes to rest
ad swipe 200 250 200 650 --count "$SWIPES" --pause-ms "$PAUSE_MS" --no-post-gesture-stabilization >/dev/null
sleep 3.5
T1=$(now)

kill -INT "$RECORDER"
wait "$RECORDER" || true # saving the trace takes a few minutes
ad close >/dev/null

WALL=$(python3 -c "print(round($T1 - $T0, 2))")
[ -f "$OUT" ] || echo "app,run,scroll_wall_s,moving_s,hitches,hitch_ms,longest_hitch_ms,hitch_ms_per_s,fps_mean,fps_max" > "$OUT"
echo "$APP,$RUN,$WALL,$(python3 "$HERE/hitches.py" "$TRACE" "$PROCESS")" | tee -a "$OUT"
rm -rf "$(dirname "$TRACE")"
