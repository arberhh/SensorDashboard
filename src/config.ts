import { Platform } from "react-native";

// The Android emulator reaches the host machine at 10.0.2.2; the iOS
// Simulator shares the host's network, so plain localhost works there.
const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const PORT = 3000;

export const BACKEND_WS_URL = `ws://${HOST}:${PORT}`;
