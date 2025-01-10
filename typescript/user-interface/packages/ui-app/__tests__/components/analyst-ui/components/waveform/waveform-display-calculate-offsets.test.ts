import type { EventTypes } from '@gms/common-model';
import { CommonTypes, SignalDetectionTypes, StationTypes } from '@gms/common-model';
import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { Units } from '@gms/common-model/lib/common/types';
import type { ArrivalTimeMeasurementValue } from '@gms/common-model/lib/signal-detection';
import { testChannel } from '@gms/ui-state/__tests__/__data__/channel-data';
import type { ReceiverLocation } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import { random, seed } from 'faker';
import cloneDeep from 'lodash/cloneDeep';

import {
  calculateOffsetsObservedPhase,
  calculateOffsetsPredictedPhase
} from '../../../../../src/ts/components/analyst-ui/components/waveform/utils';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const numberOfFeaturePredictions = random.number({ min: 10, max: 12 });
const fakerWaveformDisplaySeed = 123;
seed(fakerWaveformDisplaySeed);

function* MockFeaturePrediction() {
  while (true) {
    const predictedValue: ArrivalTimeMeasurementValue = {
      arrivalTime: {
        value: random.number({ min: 1, max: 20 }),
        standardDeviation: 0,
        units: CommonTypes.Units.SECONDS
      },
      travelTime: { value: 0, standardDeviation: 0, units: Units.SECONDS }
    };
    const predictionValue = {
      featureMeasurementType: SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME,
      predictedValue,
      featurePredictionComponentSet: []
    };
    const predictionType = SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME;
    const phase = 'P';
    const featurePrediction: EventTypes.FeaturePrediction = {
      predictionValue,
      predictionType,
      phase,
      sourceLocation: undefined,
      receiverLocation: undefined,
      predictionChannelSegment: undefined,
      extrapolated: false
    };
    yield featurePrediction;
  }
}

const mockFeaturePrediction = MockFeaturePrediction();

const mockFeaturePredictionGenerator: () => EventTypes.FeaturePrediction = (
  () => () =>
    mockFeaturePrediction.next().value as EventTypes.FeaturePrediction
)();

const mockFeaturePredictions: Record<string, ReceiverLocation> = {};

const defaultMockStation: StationTypes.Station[] = [
  {
    name: '0',
    description: 'station description',
    type: StationTypes.StationType.HYDROACOUSTIC,
    effectiveAt: 123,
    effectiveUntil: 456,
    relativePositionsByChannel: undefined,
    location: undefined,
    allRawChannels: [testChannel],
    channelGroups: []
  },
  {
    name: '1',
    description: 'station description 2',
    type: StationTypes.StationType.HYDROACOUSTIC,
    effectiveAt: 1234,
    effectiveUntil: 4567,
    relativePositionsByChannel: undefined,
    location: undefined,
    allRawChannels: [testChannel],
    channelGroups: []
  }
];

for (let i = 0; i < numberOfFeaturePredictions; i += 1) {
  mockFeaturePredictions[i] = { featurePredictions: [mockFeaturePredictionGenerator()] };
}

describe('Waveform Display Utility Test', () => {
  describe('Calculate Offsets', () => {
    test('calculateOffsetsPredictedPhase should return a record of offsets with an extra element for base station time', () => {
      const offsets = calculateOffsetsPredictedPhase(
        mockFeaturePredictions,
        '0',
        'P',
        defaultMockStation
      );
      expect(Object.entries(offsets)).toHaveLength(defaultMockStation.length + 1);
      expect(offsets.baseStationTime).toBeDefined();
    });

    test('calculateOffsetsObservedPhase should return a list of offsets', () => {
      const associatedEvent = cloneDeep(eventData);

      // Associate the detection to the event
      associatedEvent.eventHypotheses[0].associatedSignalDetectionHypotheses.push(
        signalDetectionsData[0].signalDetectionHypotheses[0]
      );

      const offsets = calculateOffsetsObservedPhase(
        signalDetectionsData,
        mockFeaturePredictions,
        'ASAR',
        [associatedEvent],
        associatedEvent.id,
        'P',
        defaultMockStation,
        'AL1'
      );
      expect(Object.entries(offsets)).toHaveLength(defaultMockStation.length + 2);
      expect(offsets.baseStationTime).toBeDefined();
    });
  });
});
