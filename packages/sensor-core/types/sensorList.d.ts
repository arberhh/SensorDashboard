import type { Sensor, TSensor } from "./sensor";
export type TypeFilter = "all" | "temperature" | "humidity";
export type SortField = "trend" | "name";
export type SortDirection = "asc" | "desc";
export type ActiveSort = {
    field: SortField;
    direction: SortDirection;
} | null;
export declare function filterSensorsByType(sensors: TSensor, typeFilter: TypeFilter): TSensor;
export declare function sortSensors(sensors: TSensor, field: SortField, direction: SortDirection): TSensor;
export declare function orderByIds(sensors: TSensor, ids: number[]): TSensor;
export declare function filterSimilarSensors(sensors: TSensor, sensor: Sensor): TSensor;
