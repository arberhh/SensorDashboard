#!/bin/bash
# usage: setup.sh <git-ref> <worktree-dir>
# Creates a detached worktree of <git-ref> wired for profiling: the profiled
# index.js, the main checkout's node_modules, and main's sensor data, so
# every version measures the same 500 sensors.
set -e
REF=$1; WT=$2
ROOT=$(git rev-parse --show-toplevel); HERE=$(cd "$(dirname "$0")" && pwd)
git worktree add --detach "$WT" "$REF"
ln -s "$ROOT/node_modules" "$WT/node_modules"
cp "$HERE/profiledIndex.js" "$WT/index.js"
git -C "$ROOT" show main:src/data/sensor_readings.json > "$WT/src/data/sensor_readings.json"
# Metro won't follow a node_modules symlink outside the project root.
cat > "$WT/metro.config.js" <<CFG
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const config = {
  watchFolders: ["$ROOT/node_modules"],
  resolver: { nodeModulesPaths: ["$ROOT/node_modules"], unstable_enableSymlinks: true },
};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
CFG
