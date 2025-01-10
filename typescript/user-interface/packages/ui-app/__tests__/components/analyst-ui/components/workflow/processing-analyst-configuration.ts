import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import type { ProcessingAnalystConfigurationQuery } from '@gms/ui-state';

import { useQueryStateResult } from '../../../../__data__/test-util-data';

const query: ProcessingAnalystConfigurationQuery = useQueryStateResult;
query.data = processingAnalystConfigurationData;

export const processingAnalystConfigurationQuery = query;
