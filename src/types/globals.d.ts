// React Native polyfills requestIdleCallback (see
// react-native/Libraries/Core/setUpTimers.js), but neither React Native's
// own type defs nor @react-native/typescript-config declare it — this
// project doesn't include the DOM lib where it'd normally come from.
type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

declare function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout: number },
): number;

declare function cancelIdleCallback(handle: number): void;
