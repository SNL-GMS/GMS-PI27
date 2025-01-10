import type { ProcessingOperation } from '../channel-segment/types';
import type { QcSegmentCategory, QcSegmentType } from '../qc-segment';

export enum TaperFunction {
  BLACKMAN = 'BLACKMAN',
  COSINE = 'COSINE',
  HAMMING = 'HAMMING',
  HANNING = 'HANNING',
  PARZEN = 'PARZEN',
  WELCH = 'WELCH'
}

export interface TaperDefinition {
  taperLengthSamples: number;
  taperFunction: TaperFunction;
}

export interface QcSegmentCategoryAndType {
  category: QcSegmentCategory;
  type?: QcSegmentType;
}

export interface ProcessingMaskDefinition {
  processingOperation: ProcessingOperation;
  appliedQcSegmentCategoryAndTypes: QcSegmentCategoryAndType[];
  maskedSegmentMergeThreshold: number;
  taperDefinition?: TaperDefinition;
}

/**
 * Validates that the object passed in is a  {@link ProcessingMaskDefinition}
 *
 * @throws If the object does not contain the mandatory fields to be a ProcessingMaskDefinition
 */
export function isProcessingMaskDefinition(
  processingDefinition: any
): asserts processingDefinition is ProcessingMaskDefinition {
  if (
    !Object.keys(processingDefinition).includes('processingOperation') ||
    !Object.keys(processingDefinition).includes('appliedQcSegmentCategoryAndTypes') ||
    !Object.keys(processingDefinition).includes('maskedSegmentMergeThreshold')
  ) {
    throw new Error(`Object is not processing mask definition`);
  }
}
