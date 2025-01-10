import { selectProcessingMaskDefinitionsByChannels } from '../api';
import type { ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel } from '../api/data/signal-enhancement';
import { useAppSelector } from './react-redux-hooks';

/**
 * A hook that can be used to retrieve processing mask definitions
 *
 * @returns the processing mask definitions result.
 */
export const useProcessingMaskDefinitions =
  (): ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel[] => {
    const processingMaskDefinitionsByChannels = useAppSelector(
      selectProcessingMaskDefinitionsByChannels
    );

    return processingMaskDefinitionsByChannels || [];
  };
