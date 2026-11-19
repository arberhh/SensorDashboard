export type Sensor = {
    id: number;
    name: string;
    sensorId: string;
    type: string;
    unit: string;
    currentReading: number;
    deviationPercent: number;
};
export type TSensor = Sensor[];
