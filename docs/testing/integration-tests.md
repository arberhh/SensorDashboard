# Integration tests

## `__tests__/HomeScreen.integration.test.tsx`

Renders the real `RootStack` (real `NavigationContainer`, real
`HomeScreen`, real chips) with `@testing-library/react-native`'s `render`,
presses the actual on-screen `Pressable`s via `fireEvent.press` (by their
`testID` — see `src/screens/HomeScreen.tsx` and
`src/components/SensorRow.tsx`), and reads the result back from real
rendered rows, not from a component's internal props. See
[`README.md`](./README.md) for why this exists alongside the unit tests
rather than instead of them.

Two `describe` blocks:

- **"sensor type filtering"** — the flow named explicitly in ARB-11: `All`
  starts with every sensor visible, `Temperature`/`Humidity` isolate
  correctly, pressing an already-active filter toggles it back to `All`,
  pressing `All` while already on `All` is a no-op, and switching directly
  between `Temperature` and `Humidity` replaces the filter rather than
  combining. Protects against: a chip's `onPress` getting disconnected
  during a refactor, the toggle-off behavior regressing, or the
  `requestIdleCallback` deferral (see below) silently breaking the whole
  flow on a future RN upgrade.
- **"sort chips"** — all four TREND/NAME combinations against the real
  rendered order, the toggle-off behavior, TREND→NAME switching cleanly
  replacing (not combining with) the previous sort, and — the specific
  regression this suite was written to guard — that a TYPE filter change
  preserves whatever sort was already active, rather than resetting it.

### Why this needed real infrastructure fixes, not just test code

None of this worked out of the box against this app's actual stack, and
each fix is a real, documented gotcha rather than a workaround to
"make the red go away":

- **`FlashList` renders zero rows under any RN test renderer.** It sizes
  its viewport from a real `onLayout` measurement pass, which no test
  renderer performs (confirmed by directly probing it: 0 rendered `Text`
  nodes). `__mocks__/@shopify/flash-list.tsx` (a manual Jest mock, opt-in
  per test file via `jest.mock("@shopify/flash-list")`) replaces it with a
  version that ignores virtualization and maps `data` straight through
  `renderItem`, so these tests query real rendered row content instead of
  reaching into FlashList's internal props.
- **`SafeAreaProvider` renders `null` children until a real native inset
  event fires** — confirmed by reading its source
  (`react-native-safe-area-context`'s `SafeAreaContext.tsx`:
  `{insets != null ? children : null}`, with `insets` starting `null`).
  That event never fires under a test renderer, so _every_ component test
  in this app — not just this one — would render an empty tree without a
  fix. `jest.setup.js` wires in the library's own official
  `react-native-safe-area-context/jest/mock` for this reason (with one
  correction: the mock module is compiled ESM, so it has to be unwrapped
  via `.default` before use, or every named import from the package
  resolves to `undefined`).
- **`requestIdleCallback` is undefined under `@react-native/jest-preset`.**
  React Native only polyfills it at real native runtime init (see
  `src/types/globals.d.ts`), which the jest preset's test environment
  doesn't run — confirmed by probing `typeof requestIdleCallback` in a
  bare test. `HomeScreen`'s TYPE filter goes through it deliberately (to
  defer off an in-flight scroll), so without a polyfill in `jest.setup.js`,
  pressing any TYPE chip in a test throws. The polyfill invokes the
  callback synchronously rather than via `setTimeout`, so tests stay
  deterministic without needing fake timers just to flush it.

### Known gap

These tests don't cover navigating _into_ a sensor's detail screen by
pressing a row, or the "Similar Sensors" section's own sort chips on
`SensorDetailScreen` — both are reasonable follow-ups, not skipped by
oversight. The row-tap flow specifically depends on the same FlashList
mock plus a working `useNavigation()` context, both of which are now in
place, so it's a small addition rather than new infrastructure work.
