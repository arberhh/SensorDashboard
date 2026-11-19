import type { TSensor } from "@/types/sensor";

function isSensor(row: unknown): boolean {
  return (
    typeof row === "object" &&
    row !== null &&
    "id" in row &&
    Number.isInteger(row.id) &&
    "name" in row &&
    typeof row.name === "string" &&
    "sensorId" in row &&
    typeof row.sensorId === "string" &&
    "type" in row &&
    typeof row.type === "string" &&
    "unit" in row &&
    typeof row.unit === "string" &&
    "currentReading" in row &&
    typeof row.currentReading === "number" &&
    "deviationPercent" in row &&
    typeof row.deviationPercent === "number"
  );
}

// Whether a parsed backend frame is a full sensor array. Both feeds drop a
// frame that isn't, so a bad row never reaches a list (shared with the Exact
// build in apps/sensor-dashboard).
export function isSensorSnapshot(frame: unknown): frame is TSensor {
  return Array.isArray(frame) && frame.every(isSensor);
}
