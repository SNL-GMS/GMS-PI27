import type { FkTypes } from '../../../src/ts/common-model';

export const fkReviewablePhasesByStation: FkTypes.FkReviewablePhasesByStation = {
  PDAR: ['P', 'Pn'],
  ASAR: ['P', 'S', 'Sn']
};

export const fkReviewablePhasesByActivityNameByStation: FkTypes.FkReviewablePhasesByActivityNameByStation =
  {
    'AL1 Event Review': fkReviewablePhasesByStation
  };
