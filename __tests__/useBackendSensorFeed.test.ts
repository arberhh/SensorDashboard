/**
 * @format
 */

import { act, renderHook } from "@testing-library/react-native";

import { useBackendSensorFeed } from "@/hooks/useBackendSensorFeed";
import initialSensors from "@/data/sensor_readings.json";

describe("useBackendSensorFeed", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("a failed fetch sets status to 'error' and keeps last-known sensors", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    const { result } = await renderHook(() => useBackendSensorFeed(true));
    await act(async () => {});

    expect(result.current.status).toBe("error");
    expect(result.current.sensors).toBe(initialSensors);
  });

  test("a WebSocket failure after bootstrap sets status to 'error'", async () => {
    const sockets: { onerror?: () => void; close: jest.Mock }[] = [];
    (globalThis as any).WebSocket = jest.fn(() => {
      const socket = { close: jest.fn() };
      sockets.push(socket);
      return socket;
    });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(initialSensors) });

    const { result } = await renderHook(() => useBackendSensorFeed(true));
    await act(async () => {});
    await act(async () => sockets[0].onerror?.());

    expect(result.current.status).toBe("error");
  });

  test("does nothing while disabled", async () => {
    globalThis.fetch = jest.fn();
    await renderHook(() => useBackendSensorFeed(false));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
