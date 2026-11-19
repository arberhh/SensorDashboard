/**
 * @format
 */

import { formatDeviation, getLocationIcon, getTypeStyle } from "@/utils/sensorDisplay";

describe("getLocationIcon", () => {
  test.each([
    ["Warehouse A - Zone 1", "🏭"],
    ["Cold Storage Room 2", "🧊"],
    ["Greenhouse Bay 7", "🌿"],
    ["Server Room North", "🖥️"],
    ["Office Floor 2", "🏢"],
    ["Production Line 4", "⚙️"],
    ["Loading Bay Exterior", "🚛"],
    ["Rooftop Unit A", "🏙️"],
    ["Basement Archive", "🗄️"],
    ["Packaging Line 2", "📦"],
    ["Cleanroom Suite 1", "🧪"],
  ])("maps %s to %s", (name, icon) => {
    expect(getLocationIcon(name)).toBe(icon);
  });

  test("falls back to a pin for a name matching none of the known categories", () => {
    expect(getLocationIcon("Parking Structure 9")).toBe("📍");
  });

  test("matches on the first category found, not the last", () => {
    // Contrived, but pins down that this is a first-match-wins substring
    // check rather than something that could return different icons
    // depending on evaluation order.
    expect(getLocationIcon("Warehouse Cold Storage")).toBe("🏭");
  });
});

describe("getTypeStyle", () => {
  test("returns the temperature palette for type 'temperature'", () => {
    const style = getTypeStyle("temperature");
    expect(style.label).toBe("Temperature");
    expect(style.icon).toBe("🌡️");
  });

  test("returns the humidity palette for type 'humidity'", () => {
    const style = getTypeStyle("humidity");
    expect(style.label).toBe("Humidity");
    expect(style.icon).toBe("💧");
  });

  test("treats any non-'temperature' value as humidity (the function's fallback branch)", () => {
    // getTypeStyle takes a bare `string`, not a Sensor["type"] union, so
    // this documents its actual runtime behavior on an unexpected input
    // rather than assuming a two-value union at the type level.
    expect(getTypeStyle("unknown").label).toBe("Humidity");
  });
});

describe("formatDeviation", () => {
  test("prefixes a positive value with +", () => {
    expect(formatDeviation(4.2)).toBe("+4.20%");
  });

  test("leaves a negative value's own minus sign as the only sign", () => {
    expect(formatDeviation(-1.5)).toBe("-1.50%");
  });

  test("adds no sign for exactly zero", () => {
    expect(formatDeviation(0)).toBe("0.00%");
  });
});
