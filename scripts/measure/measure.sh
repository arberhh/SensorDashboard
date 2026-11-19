#!/bin/bash
# usage: measure.sh <rn|exact> <run#> <results.csv>
# One measured run of one app on the iOS Simulator: relaunch it, let it sit
# through idle ticks, then scroll the list down and back up with the same
# scripted swipes for both apps (agent-device). Appends one CSV row.
# Env: SIM_UDID (default: the iPhone 17 Pro from AGENTS.md).
set -euo pipefail
APP=$1; RUN=$2; OUT=$3
SIM=${SIM_UDID:-75C568DB-6957-4433-ADE2-B336FAC0C1FA}
IDLE_SECONDS=20   # four 5s feed ticks
SWIPES=15         # each way

case $APP in
  rn) ID=com.arberhh.sensordashboard ;;
  exact) ID=com.arberhh.sensordashboard.exact ;;
  *) echo "rn or exact" >&2; exit 1 ;;
esac

# A named session, so the run does not depend on the folder it starts from.
ad() { agent-device "$@" --session sensor-measure --platform ios --udid "$SIM" --json; }
field() { python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print($1)"; }
# The app's host pid, from the simulator's launchd.
pid() { xcrun simctl spawn "$SIM" launchctl list | awk -v id="UIKitApplication:$ID[" 'index($3, id) == 1 { print $1 }'; }
# CPU seconds the process has used so far ([[dd-]hh:]mm:ss.cc from ps).
cpu() { ps -o cputime= -p "$1" | awk '{ n = split($1, t, /[-:]/); s = 0; for (i = 1; i <= n; i++) s = s * 60 + t[i]; print s }'; }
rss_mb() { ps -o rss= -p "$1" | awk '{ printf "%.1f", $1 / 1024 }'; }
now() { python3 -c "import time; print(time.time())"; }
minus() { python3 -c "print(round($1 - $2, 2))"; }

STARTUP=$(ad open "$ID" --relaunch | field "d['startup']['durationMs']")
sleep 3 # first render and layout settle
PID=$(pid)

RSS_LAUNCH=$(rss_mb "$PID")
C0=$(cpu "$PID"); sleep "$IDLE_SECONDS"; C1_IDLE=$(cpu "$PID")

# agent-device reads the whole accessibility tree before every swipe, and the
# app pays for that. Sideways swipes across the header do nothing in either
# app (on a row, Exact takes one as a press), so they cost only that read:
# the same number of them gives the tool's share to subtract.
ad swipe 150 90 250 90 --count "$((SWIPES * 2))" --pause-ms 400 --no-post-gesture-stabilization >/dev/null
C1=$(cpu "$PID")
TOOL=$(minus "$C1" "$C1_IDLE")

T0=$(now)
ad swipe 200 650 200 250 --count "$SWIPES" --pause-ms 400 --no-post-gesture-stabilization >/dev/null
ad swipe 200 250 200 650 --count "$SWIPES" --pause-ms 400 --no-post-gesture-stabilization >/dev/null
T1=$(now); C2=$(cpu "$PID")
SCROLL=$(minus "$C2" "$C1")
RSS_SCROLL=$(rss_mb "$PID")
ad close >/dev/null

[ -f "$OUT" ] || echo "app,run,startup_ms,idle_cpu_s,tool_cpu_s,scroll_cpu_s,scroll_net_cpu_s,scroll_wall_s,rss_launch_mb,rss_scroll_mb" > "$OUT"
echo "$APP,$RUN,$STARTUP,$(minus "$C1_IDLE" "$C0"),$TOOL,$SCROLL,$(minus "$SCROLL" "$TOOL"),$(minus "$T1" "$T0"),$RSS_LAUNCH,$RSS_SCROLL" | tee -a "$OUT"
