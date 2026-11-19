# Unit tests

Each file here tests one module's exported functions directly — plain
function calls and `expect()`, nothing rendered. See
[`README.md`](./README.md) for how these relate to the integration tests.

## `__tests__/sensorDisplay.test.ts` → `src/utils/sensorDisplay.ts`

Covers the three functions that decide how a sensor reads on screen,
shared by `SensorRow` (the Home list) and `SensorDetailScreen`:

- **`getLocationIcon`** — one test per known category (Warehouse,
  Cold Storage, Greenhouse, ...), a fallback case for a name matching none
  of them, and a case pinning down that it's first-match-wins when a name
  could match more than one category. Protects against: a new location
  category added to `genSensorData.js` silently falling through to the 📍
  fallback, or a reordered `if` chain changing which icon wins for an
  ambiguous name.
- **`getTypeStyle`** — temperature vs. humidity, plus a documented case for
  its actual fallback behavior on an unrecognized value (it takes a bare
  `string`, not a two-value union, so this is real runtime behavior, not a
  hypothetical). Protects against: the temperature/humidity color or icon
  getting swapped or merged during a theme refactor.
- **`formatDeviation`** — positive (`+` prefix), negative (no double sign),
  and exactly zero. Protects against: a sign-formatting regression that's
  easy to eyeball-miss (e.g. `-1.5` becoming `+-1.5` or `0` becoming `+0`).

## `__tests__/sensorList.test.ts` → `sensor-core`'s `sensorList.ts`

Covers the sort/filter logic shared by `HomeScreen`'s TYPE/TREND/NAME chips
and `SensorDetailScreen`'s Similar Sensors section — this is the "complex
calculation logic" the logic lived inline and duplicated in both screens
before being extracted here specifically so it could be tested once instead
of trusted twice.

- **`filterSensorsByType`** — `"all"` passes through unfiltered,
  temperature/humidity each isolate correctly, and a mutation check
  (the input array is never modified). Protects against: the `"all"`
  passthrough accidentally becoming a real filter comparison (which would
  break on any sensor type added later), or a switch to `.filter()`
  mutating in place.
- **`sortSensors`** — all four field/direction combinations
  (trend asc/desc, name asc/desc) against a small fixture with known
  expected order, plus a check that it returns a new array rather than
  sorting in place. Protects against: a flipped comparator sign (the
  single easiest bug to introduce in exactly this kind of function), and
  against reintroducing the in-place-mutation bug this extraction fixed
  (`HomeScreen` used to call `.sort()` directly on state).
- **`filterSimilarSensors`** — same type excluding the sensor itself,
  including a same-`type`-different-identity case, and an empty-result
  case when nothing else shares the type. Protects against: the "excluding
  itself" check silently dropping (which would show a sensor in its own
  Similar Sensors list) or the type filter loosening to include everything.

## `__tests__/sensorReadings.test.ts` → `sensor-core`'s `sensorReadings.ts`

Covers `generateReading`, the formula behind the local feed's 5-second
live tick (the app's headline "live feed" behavior), plus
`baselineReading` and `calculateDeviation`, which turn each new reading
into a live `deviationPercent`.

`generateReading` maps a random roll in [0, 1) to a reading within ±8% of
a sensor's baseline, matching the generator's deviation spread. Its tests
are mostly **statistical, not exact** — they assert invariants across many
random rolls (500 per test) rather than any single value: every reading
stays within ±8% of the baseline and rounds to at most 2 decimal places.
One test passes fixed rolls to check the band's edge and centre exactly. Protects against: the drift widening (which would bring back
three-digit deviations), and a rounding change that adds more precision
than the UI expects.
