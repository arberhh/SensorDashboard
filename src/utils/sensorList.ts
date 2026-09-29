import type { Sensor, TSensor } from "@/types/sensor";

export type TypeFilter = "all" | "temperature" | "humidity";
export type SortField = "trend" | "name";
export type SortDirection = "asc" | "desc";
export type ActiveSort = { field: SortField; direction: SortDirection } | null;

// Backs HomeScreen's TYPE chips. "all" is a pass-through rather than a real
// Sensor["type"] value, kept as a separate union member so callers don't
// need a runtime check against every possible sensor type just to mean
// "no filter".
export function filterSensorsByType(sensors: TSensor, typeFilter: TypeFilter): TSensor {
  return typeFilter === "all" ? sensors : sensors.filter((sensor) => sensor.type === typeFilter);
}

// Shared by HomeScreen's TREND/NAME chips and SensorDetailScreen's Similar
// Sensors sort chips — same two fields, same asc/desc comparators, so this
// is one implementation instead of two copies that could drift apart.
// Returns a new array; never mutates the input.
export function sortSensors(sensors: TSensor, field: SortField, direction: SortDirection): TSensor {
  return [...sensors].sort((a, b) => {
    if (field === "trend") {
      return direction === "asc"
        ? a.deviationPercent - b.deviationPercent
        : b.deviationPercent - a.deviationPercent;
    }
    return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });
}

// SensorDetailScreen's "Similar Sensors": same type as the sensor being
// viewed, excluding the sensor itself.
export function filterSimilarSensors(sensors: TSensor, sensor: Sensor): TSensor {
  return sensors.filter(
    (candidate) => candidate.type === sensor.type && candidate.id !== sensor.id,
  );
}
