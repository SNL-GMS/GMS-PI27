import type { ToolbarTypes } from '@gms/ui-core-components';
import { ButtonToolbarItem } from '@gms/ui-core-components';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import * as React from 'react';

const widthPx = 154;

/**
 * Creates an alignment control if any of the props have changed
 * Expects all parameters passed in to be referentially stable.
 *
 * @param alignWaveformsOn the phase on which to align the waveforms
 * @param phaseToAlignOn the new phase to align on
 * @param setAlignedOn  function that sets the waveform alignment type
 * @param setIsOpen a function that sets if the selector popup is open
 * @param currentOpenEventId the id of the currently open event
 * @param key must be unique
 * @returns a toolbar control for the alignment dropdown
 */
export const useAlignmentControl = (
  alignWaveformsOn: AlignWaveformsOn,
  phaseToAlignOn: string,
  setAlignedOn: (alignedOn: AlignWaveformsOn) => void,
  setIsOpen: (isOpen: boolean) => void,
  currentOpenEventId: string,
  key: string | number
): ToolbarTypes.ToolbarItemElement => {
  //! useEffect updates local state (through callbacks)
  React.useEffect(() => {
    setAlignedOn(alignWaveformsOn);
  }, [alignWaveformsOn, setAlignedOn]);

  const handleButtonClick = React.useCallback(() => setIsOpen(true), [setIsOpen]);

  return React.useMemo(
    () => (
      <ButtonToolbarItem
        key={key}
        cyData="btn-waveform-align"
        disabled={
          currentOpenEventId === null ||
          currentOpenEventId === undefined ||
          currentOpenEventId === ''
        }
        label="Change Alignment"
        tooltip={
          alignWaveformsOn === AlignWaveformsOn.TIME
            ? 'Time'
            : `${alignWaveformsOn} ${phaseToAlignOn}`
        }
        widthPx={widthPx}
        onButtonClick={handleButtonClick}
      />
    ),
    [key, currentOpenEventId, handleButtonClick, alignWaveformsOn, phaseToAlignOn]
  );
};
