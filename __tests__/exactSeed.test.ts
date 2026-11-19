/**
 * @format
 */

import initialSensors from "@/data/sensor_readings.json";

import exactSeed from "../apps/sensor-dashboard/sensor_readings.json";

// Exact only resolves imports inside its own folder, so apps/sensor-dashboard
// carries a copy of the seed. Measurements compare the two builds on the same
// data, so the copy must not drift (e.g. after `npm run generate:data`).
test("the Exact app's seed copy matches src/data", () => {
  expect(exactSeed).toEqual(initialSensors);
});
