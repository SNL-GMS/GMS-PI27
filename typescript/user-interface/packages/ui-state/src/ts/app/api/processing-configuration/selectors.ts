import type { ConfigurationTypes } from '@gms/common-model';

import type { AppState } from '../../store';
import { processingConfigurationApiSlice } from './processing-configuration-api-slice';

export const selectProcessingConfiguration = (
  state: AppState
): ConfigurationTypes.ProcessingAnalystConfiguration | undefined => {
  return processingConfigurationApiSlice.endpoints.getProcessingAnalystConfiguration.select()(state)
    .data;
};
