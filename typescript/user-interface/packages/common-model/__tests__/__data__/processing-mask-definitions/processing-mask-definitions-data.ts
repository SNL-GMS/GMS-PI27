import { ProcessingOperation } from '../../../src/ts/channel-segment/types';
import type { ProcessingMaskDefinitionTypes } from '../../../src/ts/common-model';
import { TaperFunction } from '../../../src/ts/fk';
import { QcSegmentCategory, QcSegmentType } from '../../../src/ts/qc-segment';

export const qcSegmentCategoryAndType: ProcessingMaskDefinitionTypes.QcSegmentCategoryAndType = {
  category: QcSegmentCategory.ANALYST_DEFINED,
  type: QcSegmentType.AGGREGATE
};

export const processingMaskDefinition: ProcessingMaskDefinitionTypes.ProcessingMaskDefinition = {
  appliedQcSegmentCategoryAndTypes: [qcSegmentCategoryAndType],
  processingOperation: ProcessingOperation.EVENT_BEAM,
  maskedSegmentMergeThreshold: 50,
  taperDefinition: { taperLengthSamples: 100, taperFunction: TaperFunction.COSINE }
};
