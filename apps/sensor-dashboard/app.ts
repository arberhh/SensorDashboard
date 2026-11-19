import type { Answer, Result, Sources } from './app.contract.d.ts';
import seed from './sensor_readings.json';

type Sensor = Result<'seed'>[number];
type Live = Result<'liveFeed'>;

// The Rust backend in ../../server (`cargo run`). The iOS Simulator shares the
// host's network, so localhost reaches it.
const BACKEND_WS_URL = 'ws://localhost:3000';
export const grants = `net.websocket ${BACKEND_WS_URL}`;

// Same ±8% spread as scripts/genSensorData.js and src/utils/sensorReadings.ts.
const MAX_DRIFT = 0.08;

// Math.random is unavailable in data sources; under the agent this draws a
// repeatable stream from the launch seed.
function random(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

function generateReading(baseline: number): number {
  const drift = (random() * 2 - 1) * MAX_DRIFT;
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

// Answers are held to their shape exactly, so a backend row is projected
// field by field.
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

const sensors: Sensor[] = seed.map(project);
const baselines = new Map(sensors.map((sensor) => [sensor.id, baselineReading(sensor)]));

let local = sensors;
// Never cleared, so the last-known values stay on screen while reconnecting.
let lastLive = sensors;
let liveStatus: Live['status'] = 'connecting';

const sources: Sources = {
  seed: () => sensors,
  // Inverts a sorted id list into each id's rank (ranks[id - 1]). Contract
  // can't do this within its per-evaluation list budget (n² with indexOf).
  rankIds: ([ids]) => {
    const ranks: number[] = sensors.map(() => -1);
    ids.forEach((id, rank) => {
      ranks[id - 1] = rank;
    });
    return { ranks };
  },
  // The 5s tick: each call draws a new reading per sensor and recomputes
  // deviationPercent against its fixed baseline.
  localFeed: ([tick]) => {
    if (tick === 0) return local;
    local = local.map((sensor) => {
      const baseline = baselines.get(sensor.id) ?? sensor.currentReading;
      const currentReading = generateReading(baseline);
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
          // Ignore a malformed frame; the next snapshot replaces it anyway.
          try {
            const snapshot: unknown = JSON.parse(event.data);
            if (Array.isArray(snapshot)) {
              lastLive = snapshot.map(project);
              liveStatus = 'connected';
            }
          } catch {}
        }
        return { status: liveStatus, sensors: lastLive };
      },
    });
  },
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
