/**
 * @format
 */

import { act, renderHook } from "@testing-library/react-native";

import { useBackendSensorFeed } from "@/hooks/useBackendSensorFeed";
import initialSensors from "@/data/sensor_readings.json";

class FakeSocket {
  static created: FakeSocket[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  close = jest.fn();

  constructor(public url: string) {
    FakeSocket.created.push(this);
  }
}

function latestSocket(): FakeSocket {
  return FakeSocket.created[FakeSocket.created.length - 1];
}

describe("useBackendSensorFeed", () => {
  beforeEach(() => {
    FakeSocket.created = [];
    Object.defineProperty(globalThis, "WebSocket", {
      value: FakeSocket,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("a snapshot replaces the sensors and marks the feed connected", async () => {
    const { result } = await renderHook(() => useBackendSensorFeed(true));
    const snapshot = initialSensors.slice(0, 2);

    await act(async () => latestSocket().onmessage?.({ data: JSON.stringify(snapshot) }));

    expect(latestSocket().url).toMatch(/\/ws$/);
    expect(result.current.status).toBe("connected");
    expect(result.current.sensors).toEqual(snapshot);
  });

  test.each(["not json", "null", '{"error":"nope"}'])(
    "a malformed frame (%s) is ignored",
    async (data) => {
      const { result } = await renderHook(() => useBackendSensorFeed(true));

      await act(async () => latestSocket().onmessage?.({ data }));

      expect(result.current.status).toBe("connecting");
      expect(result.current.sensors).toBe(initialSensors);
    },
  );

  test("a closed socket sets 'error', keeps the sensors and reconnects after 5s", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useBackendSensorFeed(true));
    const closed = latestSocket();

    await act(async () => closed.onclose?.());
    expect(result.current.status).toBe("error");
    expect(result.current.sensors).toBe(initialSensors);

    await act(async () => jest.advanceTimersByTime(5000));
    expect(latestSocket()).not.toBe(closed);
    expect(result.current.status).toBe("connecting");
  });

  test("unmounting closes the socket without scheduling a retry", async () => {
    jest.useFakeTimers();
    const { unmount } = await renderHook(() => useBackendSensorFeed(true));
    const socket = latestSocket();
    const socketsBefore = FakeSocket.created.length;

    await act(async () => unmount());
    await act(async () => jest.advanceTimersByTime(5000));

    expect(socket.close).toHaveBeenCalled();
    expect(socket.onmessage).toBeNull();
    expect(socket.onclose).toBeNull();
    expect(FakeSocket.created).toHaveLength(socketsBefore);
  });

  test("does nothing while disabled", async () => {
    await renderHook(() => useBackendSensorFeed(false));
    expect(FakeSocket.created).toHaveLength(0);
  });
});
