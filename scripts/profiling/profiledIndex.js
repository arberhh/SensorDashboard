/**
 * @format
 */
// Replaces index.js inside a profiling worktree (see setup.sh). Wraps the
// whole app in a React <Profiler> and POSTs every commit to collector.py.
// RN 0.87 doesn't forward console.log off-device, and the iOS Simulator
// shares the host's network, so localhost reaches the collector.
import React, { Profiler } from "react";
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

let commit = 0;
function onRender(id, phase, actualDuration, baseDuration) {
  commit += 1;
  fetch("http://localhost:8765", {
    method: "POST",
    body: `${commit} ${phase} ${actualDuration.toFixed(3)} ${baseDuration.toFixed(3)} ${Date.now()}`,
  }).catch(() => {});
}

function ProfiledApp() {
  return (
    <Profiler id="app" onRender={onRender}>
      <App />
    </Profiler>
  );
}

AppRegistry.registerComponent(appName, () => ProfiledApp);
