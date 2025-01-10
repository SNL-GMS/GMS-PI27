import type { ToolbarTypes } from '@gms/ui-core-components';
import { SwitchToolbarItem } from '@gms/ui-core-components';
import { useShouldShowPredictedPhases } from '@gms/ui-state';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import * as React from 'react';

/**
 * Exported for testing purposes
 *
 * @param shouldShowPredictedPhases
 * @param setShouldShowPredictedPhases
 * @param currentOpenEventId
 * @param key
 * @returns
 */
export const buildPredictedDropdown = (
  shouldShowPredictedPhases: boolean,
  setShouldShowPredictedPhases: (showPredicted: boolean) => void,
  setAlignWaveformsOn: (alignWaveformsOn: AlignWaveformsOn) => void,
  currentOpenEventId: string,
  key: string | number
): ToolbarTypes.ToolbarItemElement => (
  <SwitchToolbarItem
    key={key}
    label="Predicted Phases"
    disabled={!currentOpenEventId}
    tooltip="Show/Hide predicted phases"
    onChange={() => {
      if (shouldShowPredictedPhases) {
        setShouldShowPredictedPhases(false);
        setAlignWaveformsOn(AlignWaveformsOn.TIME);
      } else {
        setShouldShowPredictedPhases(true);
      }
    }}
    switchValue={shouldShowPredictedPhases}
    menuLabel={shouldShowPredictedPhases ? 'Hide Predicted Phases' : 'Show Predicted Phases'}
    cyData="Predicted Phases"
  />
);

/**
 * Creates a toolbar control item for the predicted phases, or returns the previously created one if none of the
 * parameters have changed. Expects referentially stable functions.
 *
 * @param currentOpenEventId
 * @param key must be unique
 * @returns a toolbar control for the predicted phases
 */
export const usePredictedControl = (
  currentOpenEventId: string,
  key: string | number,
  setAlignWaveformsOn: (alignWaveformsOn: AlignWaveformsOn) => void
): ToolbarTypes.ToolbarItemElement => {
  const [shouldShowPredictedPhases, setShouldShowPredictedPhases] = useShouldShowPredictedPhases();
  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildPredictedDropdown(
        shouldShowPredictedPhases,
        setShouldShowPredictedPhases,
        setAlignWaveformsOn,
        currentOpenEventId,
        key
      ),
    [
      shouldShowPredictedPhases,
      setShouldShowPredictedPhases,
      setAlignWaveformsOn,
      currentOpenEventId,
      key
    ]
  );
};
