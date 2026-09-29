/**
 * @format
 */

// SafeAreaProvider (wrapping the whole app in RootStack.tsx) renders null
// for its children until it receives a real native onInsetsChange event —
// confirmed by reading its source (react-native-safe-area-context's
// SafeAreaContext.tsx: `{insets != null ? <>{children}</> : null}`, with
// `insets` starting null and only ever set from that native callback).
// That callback never fires under any RN test renderer (no real native
// layout pass), so without this mock every component test in this app
// would render an empty tree — not specific to any one screen. This is
// the library's own official jest mock for that reason: it renders
// children immediately with fixed mock insets instead of waiting.
jest.mock(
  "react-native-safe-area-context",
  () =>
    // The mock module is itself compiled ESM (`exports.default = {...}`), so
    // requiring it directly would nest everything one level under `.default`
    // — fine for a default import, but this app uses named imports
    // (`import { SafeAreaView } from "..."`), which need the flat shape.
    require("react-native-safe-area-context/jest/mock").default,
);

// React Native polyfills requestIdleCallback at real native runtime init
// (see react-native/Libraries/Core/setUpTimers.js and
// src/types/globals.d.ts for the ambient type declaration this project
// adds on top of that), but @react-native/jest-preset's test environment
// does not run that init path, so requestIdleCallback is undefined under
// jest — confirmed by probing `typeof requestIdleCallback` in a bare test.
// HomeScreen's TYPE filter goes through it (deliberately, to defer off an
// in-flight scroll — see the comment above setTypeFilterDeferred), so any
// test exercising that flow needs this polyfill or it throws
// "ReferenceError: requestIdleCallback is not defined".
//
// Invoking the callback synchronously (rather than via setTimeout) keeps
// tests deterministic without needing fake timers just to flush an idle
// callback — the deferral itself isn't what these tests are about.
global.requestIdleCallback = (callback) => {
  callback({ didTimeout: false, timeRemaining: () => 50 });
  return 0;
};

global.cancelIdleCallback = () => {};
