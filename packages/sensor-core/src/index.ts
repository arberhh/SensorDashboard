import seed from "./sensor_readings.json";
import type { TSensor } from "./sensor";

export const initialSensors: TSensor = seed;
export type { Sensor, TSensor } from "./sensor";
export * from "./sensorList";
export * from "./sensorReadings";
export * from "./sensorSnapshot";
