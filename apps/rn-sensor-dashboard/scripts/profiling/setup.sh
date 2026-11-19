#!/bin/bash
# usage: setup.sh <git-ref> <worktree-dir>
# Creates a detached worktree of <git-ref> wired for profiling: the profiled
# index.js, this checkout's node_modules, and this checkout's sensor data, so
# every version measures the same 500 sensors. Prints the app's folder in the
# worktree, which is what profile.sh takes.
set -e
REF=$1; WT=$2
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
git worktree add --detach "$WT" "$REF"
# Refs from before the app moved into apps/ have it at the worktree's root.
APP=$WT; [ -d "$WT/apps/rn-sensor-dashboard" ] && APP=$WT/apps/rn-sensor-dashboard
ln -s "$ROOT/node_modules" "$APP/node_modules"
cp "$HERE/profiledIndex.js" "$APP/index.js"
cp "$ROOT/src/data/sensor_readings.json" "$APP/src/data/sensor_readings.json"
# Metro won't follow a node_modules symlink outside the project root.
cat > "$APP/metro.config.js" <<CFG
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const config = {
  watchFolders: ["$ROOT/node_modules"],
  resolver: { nodeModulesPaths: ["$ROOT/node_modules"], unstable_enableSymlinks: true },
};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
CFG
echo "$APP"
