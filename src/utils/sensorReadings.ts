import type { Sensor } from "../types/sensor";

// Same per-type ranges as scripts/genSensorData.js. Duplicated rather than
// imported from that script, which only runs at data-gen time (via `npm
// run generate:data`) and isn't part of the app bundle — this keeps
// HomeScreen's live-tick simulation producing values indistinguishable in
// shape from the generator's output without pulling a build-time script
// into the runtime bundle.
const READING_RANGES: Record<Sensor["type"], { min: number; max: number }> = {
  temperature: { min: 15, max: 35 },
  humidity: { min: 20, max: 90 },
};

// A new random currentReading for one sensor's type, rounded to 2 decimals
// — the same formula HomeScreen's 5s tick applies to every sensor on each
// interval.
export function generateReading(type: Sensor["type"]): number {
  const { min, max } = READING_RANGES[type];
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
