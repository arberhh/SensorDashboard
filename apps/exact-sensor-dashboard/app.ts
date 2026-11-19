import type { Answer, Result, Sources } from './app.contract.d.ts';
// The seed and the pure logic are the same package the RN app uses, so the
// two builds can't drift apart.
import {
  baselineReading,
  calculateDeviation,
  generateReading,
  initialSensors,
  isSensorSnapshot,
  sortSensors,
} from 'sensor-core';

type Sensor = Result<'seed'>[number];
type Live = Result<'liveFeed'>;

// The Rust backend in ../../server (`cargo run`). The iOS Simulator shares the
// host's network, so localhost reaches it.
const BACKEND_WS_URL = 'ws://localhost:3000';
export const grants = `net.websocket ${BACKEND_WS_URL}`;

// Answers are held to their shape exactly, so a row is projected field by
// field.
function project(row: Sensor): Sensor {
  return {
    id: row.id,
    name: row.name,
    sensorId: row.sensorId,
    type: row.type,
    unit: row.unit,
    currentReading: row.currentReading,
    deviationPercent: row.deviationPercent,
  };
}

// A frame that isn't a full sensor array is dropped; the next snapshot
// replaces it anyway.
function parseSnapshot(data: string): Sensor[] | null {
  try {
    const frame: unknown = JSON.parse(data);
    return isSensorSnapshot(frame) ? frame.map(project) : null;
  } catch {
    return null;
  }
}

const sensors: Sensor[] = initialSensors.map(project);
const baselines = new Map(sensors.map((sensor) => [sensor.id, baselineReading(sensor)]));

let local = sensors;
let localTick = 0;
// Never cleared, so the last-known values stay on screen while reconnecting.
let lastLive = sensors;
let liveStatus: Live['status'] = 'connecting';

const sources: Sources = {
  seed: () => sensors,
  // Sorts as the RN app does and answers each id's rank (ranks[id - 1], -1
  // for an id not in `rows`). Contract can't invert 500 ids within its
  // per-evaluation list budget. `seq` comes back so a reply is only applied
  // to the press that asked for it.
  rankSorted: ([rows, field, dir, seq]) => {
    const sorted = sortSensors(rows, field === 'trend' ? 'trend' : 'name', dir === 'desc' ? 'desc' : 'asc');
    const ranks: number[] = Array.from({ length: Math.max(0, ...rows.map((row) => row.id)) }, () => -1);
    sorted.forEach((row, rank) => {
      ranks[row.id - 1] = rank;
    });
    return { seq, ranks };
  },
  // The 5s tick: a new `tick` draws a new reading per sensor and recomputes
  // deviationPercent against its fixed baseline. Asking again with the same
  // tick (a mode toggle) answers the same readings.
  localFeed: ([tick]) => {
    if (tick === localTick) return local;
    localTick = tick;
    // Math.random is unavailable in data sources; under the agent this draws
    // a repeatable stream from the launch seed.
    const rolls = crypto.getRandomValues(new Uint32Array(local.length));
    local = local.map((sensor, index) => {
      const baseline = baselines.get(sensor.id) ?? sensor.currentReading;
      const currentReading = generateReading(baseline, rolls[index] / 2 ** 32);
      return { ...sensor, currentReading, deviationPercent: calculateDeviation(currentReading, baseline) };
    });
    return local;
  },
  // The socket sends the full array on connect and on every tick. A new
  // `attempt` lets the old stream go and opens a fresh socket.
  liveFeed: () => {
    liveStatus = 'connecting';
    return fetch(`${BACKEND_WS_URL}/ws`, {
      exactStream: (event: { type: string; data: unknown }): Live => {
        if (event.type === 'error') {
          liveStatus = 'error';
        } else if (event.type === 'message' && typeof event.data === 'string') {
          const snapshot = parseSnapshot(event.data);
          if (snapshot) {
            lastLive = snapshot;
            liveStatus = 'connected';
          }
        }
        return { status: liveStatus, sensors: lastLive };
      },
    });
  },
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
