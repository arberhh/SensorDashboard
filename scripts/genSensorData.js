const fs = require("fs");
const path = require("path");

const sensorTypes = ["temperature", "humidity"];
const sensorNames = [
  "Warehouse A - Zone 1",
  "Warehouse A - Zone 2",
  "Warehouse B - Loading Dock",
  "Cold Storage Room 1",
  "Cold Storage Room 2",
  "Greenhouse Bay 3",
  "Greenhouse Bay 7",
  "Server Room North",
  "Server Room South",
  "Office Floor 2",
  "Office Floor 5",
  "Production Line 1",
  "Production Line 4",
  "Loading Bay Exterior",
  "Rooftop Unit A",
  "Rooftop Unit B",
  "Basement Archive",
  "Packaging Line 2",
  "Cleanroom Suite 1",
  "Cleanroom Suite 2",
];

function readingRangeFor(type) {
  return type === "temperature"
    ? { min: 15, max: 35, unit: "°C" }
    : { min: 20, max: 90, unit: "%" };
}

function generateSensors(numSensors = 500) {
  const sensors = [];

  for (let i = 1; i <= numSensors; i++) {
    const name = sensorNames[Math.floor(Math.random() * sensorNames.length)];
    const sensorId = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
    const type = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];
    const { min, max, unit } = readingRangeFor(type);
    const currentReading = (Math.random() * (max - min) + min).toFixed(2);
    const deviationPercent = (Math.random() * 16 - 8).toFixed(2);

    sensors.push({
      id: i,
      name,
      sensorId,
      type,
      unit,
      currentReading: parseFloat(currentReading),
      deviationPercent: parseFloat(deviationPercent),
    });
  }

  return sensors;
}

const sensors = generateSensors();
const outFile = path.join(__dirname, "..", "src", "data", "sensor_readings.json");

fs.writeFile(outFile, JSON.stringify(sensors, null, 4), (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log(`${outFile} has been created with 500+ sensor readings.`);
  }
});
