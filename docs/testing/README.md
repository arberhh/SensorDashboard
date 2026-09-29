# Testing strategy

This app has two kinds of automated tests, and they protect against
different kinds of regressions. Neither is a substitute for the other.

## Unit tests — protect the logic

Files: [`unit-tests.md`](./unit-tests.md)
(`__tests__/sensorDisplay.test.ts`, `__tests__/sensorList.test.ts`,
`__tests__/sensorReadings.test.ts`)

These call small, pure functions directly — no rendering, no navigation, no
`act()`, no simulator. They exist because `HomeScreen.tsx` and
`SensorDetailScreen.tsx` used to have the same sort/filter comparator logic
duplicated inline in two places (easy for the two copies to drift apart
silently), and the display-formatting rules (which icon a location gets,
whether a deviation shows a `+` sign, which color a sensor type renders in)
had no coverage at all. That logic now lives in `src/utils/sensorList.ts`,
`src/utils/sensorReadings.ts`, and `src/utils/sensorDisplay.ts` specifically
so it _can_ be unit tested in isolation.

**What they catch:** an off-by-one in a comparator, a flipped `asc`/`desc`,
a new sensor type breaking the icon fallback, a rounding rule regressing —
the kind of bug that's easy to introduce with a one-line change and easy to
miss just by eyeballing the diff. They run in milliseconds and point
directly at the broken function, with no need to guess which UI action
would have exposed it.

**What they can't catch:** whether the function is actually _wired up_
correctly — whether the right chip calls the right function with the right
arguments, whether a `testID` still exists for someone to press, whether
two screens' sort states interact the way a user would expect.

## Integration tests — protect the wiring

File: [`integration-tests.md`](./integration-tests.md)
(`__tests__/HomeScreen.integration.test.tsx`)

This renders the real `RootStack` (real navigation, real `HomeScreen`,
real chips) and presses the actual on-screen buttons via
`@testing-library/react-native`'s `fireEvent.press`, then reads the real
rendered rows back out — not a mocked or intercepted result.

**What they catch:** a chip that's been visually restyled but silently
disconnected from its `onPress`, a `testID` that got renamed on one side
only, the TYPE filter and a sort fighting each other instead of composing,
the toggle-off behavior breaking, `requestIdleCallback` throwing under a
different RN version. These are exactly the bugs unit tests structurally
cannot see, because the individual functions they'd call are all still
correct in isolation — it's the connection between them that breaks.

**What they can't catch (yet):** anything below FlashList's real
virtualization/layout behavior, or an actual tap on a physical
simulator — see [`integration-tests.md`](./integration-tests.md) for the
specific, documented reasons and workarounds.

## Why both, together

A change that only touches `sortSensors`'s comparator will fail a unit
test in milliseconds, at the exact function, with no rendering involved —
that's the fast, precise layer. A change that touches how `HomeScreen`
_calls_ that comparator, or removes a `testID`, or breaks the effect that
defers the TYPE filter, won't fail any unit test at all (the comparator
itself is still correct) — only the integration test, which exercises the
real component tree the way a user actually presses it, will catch that.
Together they cover both "is the logic right" and "is the app actually
using it right," which is the gap a test suite with only one of the two
would leave open.
