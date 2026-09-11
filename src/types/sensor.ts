import initialSensors from "../data/sensor_readings.json";

export type Sensor = (typeof initialSensors)[number];
export type TSensor = Sensor[];
