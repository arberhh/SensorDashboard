/**
 * @format
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

import RootStack from "@/navigation/RootStack";
import initialSensors from "@/data/sensor_readings.json";

// FlashList sizes its viewport off a real onLayout pass, which never fires
// under this project's test renderer, so the real component renders zero
// rows in tests (confirmed by probing it directly). Mocked here (see
// __mocks__/@shopify/flash-list.tsx) to map `data` straight through
// renderItem instead, so these tests query real rendered rows — by their
// sensor-row-<id> testID (src/components/SensorRow.tsx) — rather than
// reaching into FlashList's internal props.
jest.mock("@shopify/flash-list");

const totalCount = initialSensors.length;
const temperatureCount = initialSensors.filter((s) => s.type === "temperature").length;
const humidityCount = initialSensors.filter((s) => s.type === "humidity").length;
const sensorsById = new Map(initialSensors.map((s) => [s.id, s]));

function renderedSensorIds(): number[] {
  return screen
    .getAllByTestId(/^sensor-row-/)
    .map((row) => Number(String(row.props.testID).replace("sensor-row-", "")));
}

// deviationPercent/name never change after the initial 5s-tick simulation
// starts (only currentReading does — see HomeScreen's tick effect), so
// looking these up from the static import by id is stable regardless of
// how many ticks have elapsed.
function renderedFieldOrder(field: "deviationPercent" | "name"): (number | string)[] {
  return renderedSensorIds().map((id) => sensorsById.get(id)![field]);
}

describe("HomeScreen — sensor type filtering", () => {
  beforeEach(async () => {
    await render(<RootStack />);
  });

  test("starts with every sensor visible under the 'All' filter", () => {
    expect(renderedSensorIds()).toHaveLength(totalCount);
  });

  test("pressing Temperature shows only, and all, temperature sensors", async () => {
    await fireEvent.press(screen.getByTestId("type-filter-temperature"));
    const ids = renderedSensorIds();
    expect(ids).toHaveLength(temperatureCount);
    expect(ids.every((id) => sensorsById.get(id)?.type === "temperature")).toBe(true);
  });

  test("pressing Humidity shows only, and all, humidity sensors", async () => {
    await fireEvent.press(screen.getByTestId("type-filter-humidity"));
    const ids = renderedSensorIds();
    expect(ids).toHaveLength(humidityCount);
    expect(ids.every((id) => sensorsById.get(id)?.type === "humidity")).toBe(true);
  });

  test("pressing the already-active filter chip toggles it back off to 'All'", async () => {
    await fireEvent.press(screen.getByTestId("type-filter-temperature"));
    expect(renderedSensorIds()).toHaveLength(temperatureCount);

    await fireEvent.press(screen.getByTestId("type-filter-temperature"));
    expect(renderedSensorIds()).toHaveLength(totalCount);
  });

  test("pressing 'All' while already on 'All' is a no-op", async () => {
    await fireEvent.press(screen.getByTestId("type-filter-all"));
    expect(renderedSensorIds()).toHaveLength(totalCount);
  });

  test("switching from Temperature directly to Humidity replaces the filter rather than combining", async () => {
    await fireEvent.press(screen.getByTestId("type-filter-temperature"));
    await fireEvent.press(screen.getByTestId("type-filter-humidity"));
    const ids = renderedSensorIds();
    expect(ids).toHaveLength(humidityCount);
    expect(ids.every((id) => sensorsById.get(id)?.type === "humidity")).toBe(true);
  });
});

describe("HomeScreen — sort chips", () => {
  beforeEach(async () => {
    await render(<RootStack />);
  });

  test("pressing TREND Asc sorts the list by deviationPercent ascending", async () => {
    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    const values = renderedFieldOrder("deviationPercent") as number[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  test("pressing TREND Desc sorts the list by deviationPercent descending", async () => {
    await fireEvent.press(screen.getByTestId("sort-trend-desc"));
    const values = renderedFieldOrder("deviationPercent") as number[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });

  test("pressing NAME Asc sorts the list alphabetically", async () => {
    await fireEvent.press(screen.getByTestId("sort-name-asc"));
    const values = renderedFieldOrder("name") as string[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  test("pressing NAME Desc sorts the list reverse-alphabetically", async () => {
    await fireEvent.press(screen.getByTestId("sort-name-desc"));
    const values = renderedFieldOrder("name") as string[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeLessThanOrEqual(0);
    }
  });

  test("pressing the already-active sort chip clears it without reverting list order", async () => {
    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    const sortedIds = renderedSensorIds();

    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    expect(renderedSensorIds()).toEqual(sortedIds);
  });

  test("switching from TREND to NAME replaces the active sort rather than combining", async () => {
    await fireEvent.press(screen.getByTestId("sort-trend-desc"));
    await fireEvent.press(screen.getByTestId("sort-name-asc"));
    const values = renderedFieldOrder("name") as string[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  test("a TYPE filter change preserves the currently active sort order", async () => {
    await fireEvent.press(screen.getByTestId("sort-name-asc"));
    await fireEvent.press(screen.getByTestId("type-filter-temperature"));
    expect(renderedSensorIds()).toHaveLength(temperatureCount);
    const values = renderedFieldOrder("name") as string[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});
