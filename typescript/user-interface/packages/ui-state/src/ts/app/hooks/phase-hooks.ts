import React from 'react';

import { selectConfiguredPhases } from '../state';
import { useAppSelector } from './react-redux-hooks';

/**
 * Hook to get a phase validator function
 *
 * @throws if the phase list from configuration is null
 *
 * @returns a stable callback function that may be used to check if a phase
 * string is included somewhere in the phase lists defined in processing
 * configuration
 */
export function useValidatePhase() {
  const phases = useAppSelector(selectConfiguredPhases);
  return React.useCallback(
    (phaseType: string) => {
      if (phases == null) {
        throw new Error(
          'Cannot validate against an undefined phase list. Check to ensure that configuration is correct and includes at least one phase list.'
        );
      }
      return phases.find(phase => phase === phaseType) !== undefined;
    },
    [phases]
  );
}
