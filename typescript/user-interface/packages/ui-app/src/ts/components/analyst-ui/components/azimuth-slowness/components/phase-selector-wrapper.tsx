import {
  selectSelectedPhasesForSignalDetectionsCurrentHypotheses,
  selectValidActionTargetSignalDetectionIds,
  useAppSelector,
  useSetSignalDetectionActionTargets,
  useUpdateSignalDetectionPhase
} from '@gms/ui-state';
import React from 'react';

import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs';
import type { PhaseSelectorDialogProps } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';

export type PhaseSelectorWrapperProps = Pick<PhaseSelectorDialogProps, 'isOpen'> & {
  setIsOpen: (isOpen: boolean) => void;
};

/**
 * Functional wrapper around the {@link PhaseSelectorDialog} that allows for
 * easy access to hooks/Redux data.
 */
export function PhaseSelectorWrapper({ isOpen, setIsOpen }: PhaseSelectorWrapperProps) {
  const selectedPhases = useAppSelector(selectSelectedPhasesForSignalDetectionsCurrentHypotheses);
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();
  const validActionTargetSignalDetectionIds = useAppSelector(
    selectValidActionTargetSignalDetectionIds
  );
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();

  const phaseSelectorCallback = React.useCallback(
    async (phases: string[]) => {
      await signalDetectionPhaseUpdate(validActionTargetSignalDetectionIds ?? [], phases[0]);
    },
    [signalDetectionPhaseUpdate, validActionTargetSignalDetectionIds]
  );

  return (
    <PhaseSelectorDialog
      isOpen={isOpen}
      title="Set Phase"
      selectedPhases={selectedPhases}
      phaseSelectorCallback={phaseSelectorCallback}
      closeCallback={() => {
        setSignalDetectionActionTargets([]);
        setIsOpen(false);
      }}
    />
  );
}
