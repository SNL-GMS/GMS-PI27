import type { SignalDetectionTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { eventData } from '@gms/common-model/__tests__/__data__/event/event-data';
import { findPreferredEventHypothesisByOpenStageOrDefaultStage } from '@gms/common-model/lib/event';

import { removeSignalDetectionHypothesisFromEvents } from '../../../../../src/ts/app/api/data/event/remove-associated-sd-hypothesis';

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

describe('remove signal detection hypothesis to associated events', () => {
  test('removeSignalDetectionHypothesisFromEvents', () => {
    const openIntervalName = 'AL1';
    const existingSDHypothesis: SignalDetectionTypes.SignalDetectionHypothesis =
      signalDetectionsData[0].signalDetectionHypotheses[0];

    expect(() =>
      removeSignalDetectionHypothesisFromEvents(openIntervalName, existingSDHypothesis, [eventData])
    ).not.toThrow();

    // confirm SD hypo id was removed from association sd hypo
    const preferredEventHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
      eventData,
      openIntervalName
    );
    const targetSdHypo = preferredEventHypothesis?.associatedSignalDetectionHypotheses.find(
      sdHypo => {
        return sdHypo.id.id === existingSDHypothesis.id.id;
      }
    );
    expect(targetSdHypo).toBeUndefined();
  });
});
