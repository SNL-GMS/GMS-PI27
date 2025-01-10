import { qcSegment } from '@gms/common-model/__tests__/__data__';
import produce from 'immer';

import { createRecipeToMutateQcSegmentsRecord } from '../../../../../src/ts/app/api/data/waveform/mutate-qc-segment-record';

describe('mutate qc segment record', () => {
  it('can exercise immer produce method to add qc segment', () => {
    const qcSegmentRecord = produce(
      {},
      createRecipeToMutateQcSegmentsRecord('PDAR.PD01.SHZ', [qcSegment])
    );
    expect(qcSegmentRecord['PDAR.PD01.SHZ']).toEqual({ [qcSegment.id]: qcSegment });
  });

  it('can exercise immer produce method with undefined qc segment', () => {
    const qcSegmentRecord = produce({}, createRecipeToMutateQcSegmentsRecord('PDAR.PD01.SHZ', []));
    expect(qcSegmentRecord).toEqual({});
  });
});
