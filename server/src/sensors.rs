use serde::Serialize;

// Verbatim from scripts/genSensorData.js, so LIVE names match the seed data.
pub const SENSOR_NAMES: [&str; 20] = [
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

// Same ±8% spread as the generator and the app's src/utils/sensorReadings.ts.
const MAX_DRIFT: f64 = 0.08;

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SensorType {
    Temperature,
    Humidity,
}

impl SensorType {
    /// `(min, max, unit)` of a fresh reading.
    pub fn range(self) -> (f64, f64, &'static str) {
        match self {
            SensorType::Temperature => (15.0, 35.0, "°C"),
            SensorType::Humidity => (20.0, 90.0, "%"),
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sensor {
    pub id: u32,
    pub name: &'static str,
    pub sensor_id: String,
    pub r#type: SensorType,
    pub unit: &'static str,
    pub current_reading: f64,
    pub deviation_percent: f64,
    // What deviation_percent measures against; the app recovers the same
    // value client-side, so it stays out of the JSON.
    #[serde(skip)]
    pub baseline: f64,
}

/// First letter of each space-separated word, uppercased, max 5 chars.
/// A lone `-` is a word too, so "Warehouse A - Zone 1" gives "WA-Z1", like
/// the JS generator.
pub fn sensor_id(name: &str) -> String {
    name.split(' ')
        .filter_map(|word| word.chars().next())
        .collect::<String>()
        .to_uppercase()
        .chars()
        .take(5)
        .collect()
}

pub fn generate_sensors(count: u32) -> Vec<Sensor> {
    (1..=count)
        .map(|id| {
            let name = SENSOR_NAMES[rand::random_range(0..SENSOR_NAMES.len())];
            let r#type = if rand::random() {
                SensorType::Temperature
            } else {
                SensorType::Humidity
            };
            let (min, max, unit) = r#type.range();
            let current_reading = round2(rand::random_range(min..max));
            let deviation_percent = round2(rand::random_range(-8.0..8.0));

            Sensor {
                id,
                name,
                sensor_id: sensor_id(name),
                r#type,
                unit,
                current_reading,
                deviation_percent,
                baseline: current_reading / (1.0 + deviation_percent / 100.0),
            }
        })
        .collect()
}

/// Draws each sensor a new reading within ±8% of its baseline and recomputes
/// its deviation from it, like the app's local feed tick.
pub fn apply_tick(sensors: &mut [Sensor]) {
    for sensor in sensors {
        let drift = rand::random_range(-MAX_DRIFT..=MAX_DRIFT);
        sensor.current_reading = round2(sensor.baseline * (1.0 + drift));
        sensor.deviation_percent = deviation(sensor.current_reading, sensor.baseline);
    }
}

fn deviation(reading: f64, baseline: f64) -> f64 {
    round2((reading - baseline) / baseline * 100.0)
}

// The JS side's `parseFloat(x.toFixed(2))`.
fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn sensor_id_keeps_the_hyphen_token() {
        assert_eq!(sensor_id("Warehouse A - Zone 1"), "WA-Z1");
        assert_eq!(sensor_id("Warehouse B - Loading Dock"), "WB-LD");
    }

    #[test]
    fn sensor_id_takes_first_letters() {
        assert_eq!(sensor_id("Cleanroom Suite 2"), "CS2");
        assert_eq!(sensor_id("Loading Bay Exterior"), "LBE");
    }

    #[test]
    fn generate_sensors_makes_500_valid_sensors() {
        let sensors = generate_sensors(500);

        assert_eq!(sensors.len(), 500);
        let ids: HashSet<u32> = sensors.iter().map(|s| s.id).collect();
        assert_eq!(ids, (1..=500).collect());

        for sensor in &sensors {
            let (min, max, unit) = sensor.r#type.range();
            assert!((min..=max).contains(&sensor.current_reading));
            assert_eq!(sensor.unit, unit);
            assert!((-8.0..=8.0).contains(&sensor.deviation_percent));
            assert_eq!(sensor.sensor_id, sensor_id(sensor.name));
        }
    }

    #[test]
    fn apply_tick_only_moves_the_reading_and_its_deviation() {
        let before = generate_sensors(500);
        let mut after = before.clone();

        apply_tick(&mut after);

        for (old, new) in before.iter().zip(&after) {
            assert_eq!(new.id, old.id);
            assert_eq!(new.name, old.name);
            assert_eq!(new.sensor_id, old.sensor_id);
            assert_eq!(new.r#type, old.r#type);
            assert_eq!(new.unit, old.unit);
            assert_eq!(new.baseline, old.baseline);

            // 0.005 covers rounding the reading to 2 decimals.
            let spread = new.baseline * MAX_DRIFT + 0.005;
            assert!((new.current_reading - new.baseline).abs() <= spread);
            assert_eq!(
                new.deviation_percent,
                deviation(new.current_reading, new.baseline)
            );
        }
    }

    #[test]
    fn sensor_json_matches_the_app_shape() {
        let sensor = &generate_sensors(1)[0];
        let json = serde_json::to_value(sensor).unwrap();

        let mut keys: Vec<&str> = json
            .as_object()
            .unwrap()
            .keys()
            .map(String::as_str)
            .collect();
        keys.sort_unstable();
        assert_eq!(
            keys,
            [
                "currentReading",
                "deviationPercent",
                "id",
                "name",
                "sensorId",
                "type",
                "unit"
            ]
        );
        assert!(["temperature", "humidity"].contains(&json["type"].as_str().unwrap()));
    }
}
