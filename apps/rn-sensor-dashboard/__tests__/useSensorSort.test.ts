/**
 * @format
 */

import { sortReducer } from "@/hooks/useSensorSort";
import type { Sensor } from "sensor-core";

function makeSensor(overrides: Partial<Sensor>): Sensor {
  return {
    id: 1,
    name: "Warehouse A - Zone 1",
    sensorId: "WA-Z1",
    type: "temperature",
    unit: "°C",
    currentReading: 20,
    deviationPercent: 0,
    ...overrides,
  };
}

const sensors: Sensor[] = [
  makeSensor({ id: 1, name: "Cleanroom Suite 1", deviationPercent: 5 }),
  makeSensor({ id: 2, name: "Basement Archive", deviationPercent: -3 }),
  makeSensor({ id: 3, name: "Rooftop Unit A", deviationPercent: -8 }),
];

const unsorted = { activeSort: null, sortedIds: null };

describe("sortReducer", () => {
  test("a press activates the chip and captures the id order", () => {
    const state = sortReducer(unsorted, { field: "trend", direction: "asc", sensors });

    expect(state.activeSort).toEqual({ field: "trend", direction: "asc" });
    expect(state.sortedIds).toEqual([3, 2, 1]);
  });

  test("pressing the active chip again clears the sort", () => {
    const sorted = sortReducer(unsorted, { field: "trend", direction: "asc", sensors });
    const state = sortReducer(sorted, { field: "trend", direction: "asc", sensors });

    expect(state).toEqual(unsorted);
  });

  test("pressing another chip switches to it", () => {
    const sorted = sortReducer(unsorted, { field: "trend", direction: "asc", sensors });
    const byName = sortReducer(sorted, { field: "name", direction: "asc", sensors });
    const byTrendDesc = sortReducer(byName, { field: "trend", direction: "desc", sensors });

    expect(byName.activeSort).toEqual({ field: "name", direction: "asc" });
    expect(byName.sortedIds).toEqual([2, 1, 3]);
    expect(byTrendDesc.sortedIds).toEqual([1, 2, 3]);
  });

  test("the captured order comes from the values at press time", () => {
    const sorted = sortReducer(unsorted, { field: "trend", direction: "asc", sensors });
    const later: Sensor[] = [
      makeSensor({ id: 1, name: "Cleanroom Suite 1", deviationPercent: -5 }),
      makeSensor({ id: 2, name: "Basement Archive", deviationPercent: 3 }),
      makeSensor({ id: 3, name: "Rooftop Unit A", deviationPercent: 8 }),
    ];
    const resorted = sortReducer(sorted, { field: "trend", direction: "desc", sensors: later });

    expect(sorted.sortedIds).toEqual([3, 2, 1]);
    expect(resorted.sortedIds).toEqual([3, 2, 1]);
  });
});
