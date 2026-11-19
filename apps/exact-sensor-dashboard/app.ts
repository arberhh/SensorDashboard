import type { Answer, Result, Sources } from './app.contract.d.ts';
// A copy of ../rn-sensor-dashboard/src/data/sensor_readings.json: Exact only
// resolves imports inside the app's folder. That app's exactSeed test keeps
// the two equal.
import seed from './sensor_readings.json';

type Sensor = Result<'seed'>[number];
type Live = Result<'liveFeed'>;

// The Rust backend in ../../server (`cargo run`). The iOS Simulator shares the
// host's network, so localhost reaches it.
const BACKEND_WS_URL = 'ws://localhost:3000';
export const grants = `net.websocket ${BACKEND_WS_URL}`;

// The reading maths and the sort below are ports of that app's
// src/utils/sensorReadings.ts and src/utils/sensorList.ts, for the same reason.

// Same ±8% spread as scripts/genSensorData.js.
const MAX_DRIFT = 0.08;

// `roll` is a random number in [0, 1).
function generateReading(baseline: number, roll: number): number {
  const drift = (roll * 2 - 1) * MAX_DRIFT;
  return parseFloat((baseline * (1 + drift)).toFixed(2));
}

// A -100% seed has no recoverable baseline, so its reading stands in.
function baselineReading(sensor: Sensor): number {
  const ratio = 1 + sensor.deviationPercent / 100;
  return ratio === 0 ? sensor.currentReading : sensor.currentReading / ratio;
}

function calculateDeviation(reading: number, baseline: number): number {
  return parseFloat((((reading - baseline) / baseline) * 100).toFixed(2));
}

// localeCompare for names, as the RN app sorts; Contract's sortBy compares
// code units, which orders some names differently.
function sortSensors(rows: Sensor[], field: string, dir: string): Sensor[] {
  return [...rows].sort((a, b) => {
    if (field === 'trend') {
      return dir === 'asc' ? a.deviationPercent - b.deviationPercent : b.deviationPercent - a.deviationPercent;
    }
    return dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });
}

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

function isSensor(row: unknown): row is Sensor {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    typeof row.id === 'number' &&
    Number.isInteger(row.id) &&
    row.id > 0 &&
    'name' in row &&
    typeof row.name === 'string' &&
    'sensorId' in row &&
    typeof row.sensorId === 'string' &&
    'type' in row &&
    typeof row.type === 'string' &&
    'unit' in row &&
    typeof row.unit === 'string' &&
    'currentReading' in row &&
    typeof row.currentReading === 'number' &&
    'deviationPercent' in row &&
    typeof row.deviationPercent === 'number'
  );
}

// A frame that isn't a full sensor array is dropped; the next snapshot
// replaces it anyway.
function parseSnapshot(data: string): Sensor[] | null {
  try {
    const frame: unknown = JSON.parse(data);
    return Array.isArray(frame) && frame.every(isSensor) ? frame.map(project) : null;
  } catch {
    return null;
  }
}

const sensors: Sensor[] = seed.map(project);
const baselines = new Map(sensors.map((sensor) => [sensor.id, baselineReading(sensor)]));

let local = sensors;
let localTick = 0;
// Never cleared, so the last-known values stay on screen while reconnecting.
let lastLive = sensors;
let liveStatus: Live['status'] = 'connecting';

const sources: Sources = {
  seed: () => sensors,
  // Sorts and answers each id's rank (ranks[id - 1], -1
  // for an id not in `rows`). Contract can't invert 500 ids within its
  // per-evaluation list budget. `seq` comes back so a reply is only applied
  // to the press that asked for it.
  rankSorted: ([rows, field, dir, seq]) => {
    const sorted = sortSensors(rows, field, dir);
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
