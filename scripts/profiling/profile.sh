#!/bin/bash
# usage: profile.sh <worktree-dir> <out-log> [seconds]
# Restarts Metro on the worktree, relaunches the installed app on the
# simulator, and records every React commit for [seconds] (default 70).
# Env: SIM_UDID (default: booted), APP_ID (default: com.arberhh.sensordashboard).
W=$1; OUT=$2; SECS=${3:-70}
U=${SIM_UDID:-booted}; APP=${APP_ID:-com.arberhh.sensordashboard}
HERE=$(cd "$(dirname "$0")" && pwd)
P=$(lsof -tiTCP:8081 -sTCP:LISTEN); [ -n "$P" ] && kill $P && sleep 2
(cd "$W" && nohup node node_modules/react-native/cli.js start --port 8081 --reset-cache > "$OUT.metro" 2>&1 &)
until curl -s localhost:8081/status | grep -q running; do sleep 1; done
xcrun simctl terminate "$U" "$APP" 2>/dev/null
rm -f "$OUT"; python3 -I "$HERE/collector.py" "$OUT" &
LP=$!
sleep 2
xcrun simctl launch "$U" "$APP" >/dev/null
sleep "$SECS"
kill $LP
wc -l < "$OUT"
