import type { Sensor } from "./sensor";
export declare function generateReading(baseline: number, roll: number): number;
export declare function baselineReading(sensor: Pick<Sensor, "currentReading" | "deviationPercent">): number;
export declare function calculateDeviation(reading: number, baseline: number): number;
