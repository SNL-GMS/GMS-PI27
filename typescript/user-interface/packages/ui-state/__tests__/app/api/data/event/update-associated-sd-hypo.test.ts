import type { SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';

import { updateSignalDetectionHypothesisToEvents } from '../../../../../src/ts/app/api/data/event/update-associated-sd-hypothesis';

jest.mock('../../../../../src/ts/app/api/data/event/get-working-event-hypothesis', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/app/api/data/event/get-working-event-hypothesis'
  );
  const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    eventData,
    'AL1'
  );
  return {
    ...actual,
    getWorkingEventHypothesis: jest.fn().mockReturnValue(preferredEventHypothesis)
  };
});

describe('update signal detection hypothesis to associated events', () => {
  test('updateSignalDetectionHypothesisToEvents', () => {
    const openIntervalName = 'AL1';
    const existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis =
      signalDetectionsData[0].signalDetectionHypotheses[0];

    const newSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis = {
      ...existingSDHypothesis,
      id: {
        ...existingSDHypothesis.id,
        id: 'newExistingSdHypoId'
      }
    };
    expect(() =>
      updateSignalDetectionHypothesisToEvents(
        openIntervalName,
        existingSDHypothesis,
        [eventData],
        newSDHypothesis
      )
    ).not.toThrow();

    // confirm SD hypo id was updated as associated sd hypo
    const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      eventData,
      openIntervalName
    );
    const targetSdHypo = preferredEventHypothesis?.associatedSignalDetectionHypotheses.find(
      sdHypo => {
        return sdHypo.id.id === 'newExistingSdHypoId';
      }
    );
    expect(targetSdHypo).toBeDefined();
  });
});
