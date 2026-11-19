import React, { createContext, useContext, useMemo, useState } from "react";

import { useSensorFeed } from "@/hooks/useSensorFeed";
import type { FeedMode, SensorFeedResult } from "@/types/feed";

type SensorFeedContextValue = SensorFeedResult & {
  mode: FeedMode;
  toggleMode: () => void;
};

const SensorFeedContext = createContext<SensorFeedContextValue | null>(null);

export function SensorFeedProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<FeedMode>("local");
  const feed = useSensorFeed(mode);

  const { sensors, status } = feed;
  const value = useMemo(
    () => ({
      sensors,
      status,
      mode,
      toggleMode: () => setMode((current) => (current === "local" ? "live" : "local")),
    }),
    [sensors, status, mode],
  );

  return <SensorFeedContext.Provider value={value}>{children}</SensorFeedContext.Provider>;
}

export function useSensorFeedContext(): SensorFeedContextValue {
  const context = useContext(SensorFeedContext);
  if (!context) throw new Error("useSensorFeedContext must be used within SensorFeedProvider");
  return context;
}
