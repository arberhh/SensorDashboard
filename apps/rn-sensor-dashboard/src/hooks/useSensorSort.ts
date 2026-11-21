import { useMemo, useReducer } from "react";

import {
  orderByIds,
  sortSensors,
  type ActiveSort,
  type SortDirection,
  type SortField,
  type TSensor,
} from "sensor-core";

type SortState = { activeSort: ActiveSort; sortedIds: number[] | null };
type SortPressed = { field: SortField; direction: SortDirection; sensors: TSensor };

const initialState: SortState = { activeSort: null, sortedIds: null };

// Reducer rather than two useState: activeSort and sortedIds must change
// together, and a press is one transition instead of two setters.
// Pressing the already-active chip clears the sort. Otherwise the order is
// captured at press time rather than re-derived every tick: deviationPercent
// is live, so re-sorting on each 5s tick would reshuffle rows under the
// user's finger. Row values stay live; the order changes only on a press.
export function sortReducer(state: SortState, pressed: SortPressed): SortState {
  const { field, direction, sensors } = pressed;
  if (state.activeSort?.field === field && state.activeSort.direction === direction) {
    return initialState;
  }
  return {
    activeSort: { field, direction },
    sortedIds: sortSensors(sensors, field, direction).map((sensor) => sensor.id),
  };
}

// The sort both screens share: which chip is active, the sensors in the
// captured order, and the chip press.
export function useSensorSort(sensors: TSensor) {
  const [{ activeSort, sortedIds }, dispatch] = useReducer(sortReducer, initialState);

  const ordered = useMemo(
    () => (sortedIds ? orderByIds(sensors, sortedIds) : sensors),
    [sensors, sortedIds],
  );

  function pressSort(field: SortField, direction: SortDirection): void {
    dispatch({ field, direction, sensors });
  }

  return { activeSort, ordered, pressSort };
}
