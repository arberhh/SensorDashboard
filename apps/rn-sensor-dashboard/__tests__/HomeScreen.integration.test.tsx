/**
 * @format
 */

import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react-native";

import RootStack from "@/navigation/RootStack";
import { initialSensors } from "sensor-core";

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

// Reads seed values from the static import by id. Safe for asserting a
// sort's order even if a feed tick fires mid-test: a sort captures its id
// order at press time (from the values then on screen, which are the seed
// values in these tests) and ticks don't re-sort, so the rendered order
// keeps matching the seed values even after deviationPercent goes live.
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

  test("pressing the already-active sort chip clears it and restores the original order", async () => {
    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    expect(renderedSensorIds()).toEqual(initialSensors.map((s) => s.id));
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

describe("HomeScreen — live feed ticks", () => {
  // Fake timers hang RNTL's async render against the 500-row list, so the
  // feed's 5s interval callback is captured and invoked directly instead.
  async function renderAndGetTick(): Promise<() => void> {
    const setIntervalSpy = jest.spyOn(globalThis, "setInterval");
    await render(<RootStack />);
    const call = setIntervalSpy.mock.calls.find((args) => args[1] === 5000);
    return call![0] as () => void;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("local mode changes readings on each 5s tick", async () => {
    const tick = await renderAndGetTick();
    const before = JSON.stringify(screen.toJSON());

    await act(async () => tick());

    const after = JSON.stringify(screen.toJSON());
    expect(after).not.toEqual(before);
  });

  test("a TREND sort keeps its row order across a tick even though deviation changes", async () => {
    const tick = await renderAndGetTick();
    await fireEvent.press(screen.getByTestId("sort-trend-asc"));
    const before = renderedSensorIds();

    await act(async () => tick());

    expect(renderedSensorIds()).toEqual(before);
  });

  test("a chosen sort survives a feed tick", async () => {
    const tick = await renderAndGetTick();
    await fireEvent.press(screen.getByTestId("sort-name-asc"));

    await act(async () => tick());

    const values = renderedFieldOrder("name") as string[];
    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});
