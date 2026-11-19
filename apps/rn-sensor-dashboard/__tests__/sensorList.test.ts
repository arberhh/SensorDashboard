/**
 * @format
 */

import {
  filterSensorsByType,
  filterSimilarSensors,
  orderByIds,
  sortSensors,
} from "@/utils/sensorList";
import type { Sensor } from "@/types/sensor";

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
  makeSensor({ id: 1, name: "Cleanroom Suite 1", type: "temperature", deviationPercent: 5 }),
  makeSensor({ id: 2, name: "Basement Archive", type: "humidity", deviationPercent: -3 }),
  makeSensor({ id: 3, name: "Rooftop Unit A", type: "temperature", deviationPercent: -8 }),
  makeSensor({ id: 4, name: "Office Floor 2", type: "humidity", deviationPercent: 1 }),
];

describe("filterSensorsByType", () => {
  test("'all' returns every sensor, unfiltered", () => {
    expect(filterSensorsByType(sensors, "all")).toEqual(sensors);
  });

  test("filters to only temperature sensors", () => {
    const result = filterSensorsByType(sensors, "temperature");
    expect(result.map((s) => s.id)).toEqual([1, 3]);
  });

  test("filters to only humidity sensors", () => {
    const result = filterSensorsByType(sensors, "humidity");
    expect(result.map((s) => s.id)).toEqual([2, 4]);
  });

  test("does not mutate the input array", () => {
    const copy = [...sensors];
    filterSensorsByType(sensors, "temperature");
    expect(sensors).toEqual(copy);
  });
});

describe("sortSensors", () => {
  test("sorts by trend (deviationPercent) ascending", () => {
    const result = sortSensors(sensors, "trend", "asc");
    expect(result.map((s) => s.id)).toEqual([3, 2, 4, 1]);
  });

  test("sorts by trend (deviationPercent) descending", () => {
    const result = sortSensors(sensors, "trend", "desc");
    expect(result.map((s) => s.id)).toEqual([1, 4, 2, 3]);
  });

  test("sorts by name ascending", () => {
    const result = sortSensors(sensors, "name", "asc");
    expect(result.map((s) => s.name)).toEqual([
      "Basement Archive",
      "Cleanroom Suite 1",
      "Office Floor 2",
      "Rooftop Unit A",
    ]);
  });

  test("sorts by name descending", () => {
    const result = sortSensors(sensors, "name", "desc");
    expect(result.map((s) => s.name)).toEqual([
      "Rooftop Unit A",
      "Office Floor 2",
      "Cleanroom Suite 1",
      "Basement Archive",
    ]);
  });

  test("does not mutate the input array (returns a new one)", () => {
    const copy = [...sensors];
    const result = sortSensors(sensors, "trend", "asc");
    expect(sensors).toEqual(copy);
    expect(result).not.toBe(sensors);
  });
});

describe("filterSimilarSensors", () => {
  test("returns only same-type sensors, excluding the sensor itself", () => {
    const target = sensors[0]; // id 1, temperature
    const result = filterSimilarSensors(sensors, target);
    expect(result.map((s) => s.id)).toEqual([3]);
  });

  test("excludes the target even if another sensor shares its id's type but not identity", () => {
    const target = makeSensor({ id: 2, type: "humidity" });
    const result = filterSimilarSensors(sensors, target);
    expect(result.some((s) => s.id === 2)).toBe(false);
  });

  test("returns an empty array when no other sensor shares the type", () => {
    const onlyTemperature = [makeSensor({ id: 1, type: "temperature" })];
    expect(filterSimilarSensors(onlyTemperature, onlyTemperature[0])).toEqual([]);
  });
});

describe("orderByIds", () => {
  test("lays sensors out in the given id order", () => {
    expect(orderByIds(sensors, [3, 1, 4, 2]).map((s) => s.id)).toEqual([3, 1, 4, 2]);
  });

  test("keeps the new snapshot's objects, not stale ones", () => {
    const updated = sensors.map((s) => ({ ...s, deviationPercent: 99 }));
    expect(orderByIds(updated, [2, 1, 3, 4]).every((s) => s.deviationPercent === 99)).toBe(true);
  });

  test("appends sensors missing from the ids and skips ids missing from the sensors", () => {
    expect(orderByIds(sensors, [4, 99, 2]).map((s) => s.id)).toEqual([4, 2, 1, 3]);
  });
});
