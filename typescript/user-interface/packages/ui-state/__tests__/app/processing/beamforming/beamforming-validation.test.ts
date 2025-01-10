import {
  akasgBHEChannel,
  eventBeamformingTemplate,
  PD01Channel,
  pdar
} from '@gms/common-model/__tests__/__data__';

import {
  validateArrivalTime,
  validateAzimuth,
  validateBeamformingChannelsMatchStations,
  validateBeamformingTemplate,
  validateEventHypothesis,
  validateFeaturePredictions,
  validateInterval,
  validateIntervalId,
  validateMinimumNumberOfChannels,
  validateSlowness,
  validateStation
} from '../../../../src/ts/app/processing/beamforming/beamforming-validation';

describe('beamforming validation', () => {
  it('exists', () => {
    expect(validateArrivalTime).toBeDefined();
    expect(validateAzimuth).toBeDefined();
    expect(validateBeamformingChannelsMatchStations).toBeDefined();
    expect(validateBeamformingTemplate).toBeDefined();
    expect(validateEventHypothesis).toBeDefined();
    expect(validateFeaturePredictions).toBeDefined();
    expect(validateInterval).toBeDefined();
    expect(validateIntervalId).toBeDefined();
    expect(validateMinimumNumberOfChannels).toBeDefined();
    expect(validateSlowness).toBeDefined();
    expect(validateStation).toBeDefined();
  });

  it('validation to throw', () => {
    expect(() => {
      validateArrivalTime(undefined, pdar, undefined, undefined, 'P');
    }).toThrow();

    expect(() => {
      validateAzimuth(undefined, pdar, undefined, undefined, 'P');
    }).toThrow();

    expect(() => {
      validateBeamformingChannelsMatchStations([PD01Channel, akasgBHEChannel], [pdar, pdar]);
    }).toThrow();

    expect(() => {
      validateBeamformingTemplate(pdar, undefined);
    }).toThrow();

    expect(() => {
      validateEventHypothesis(undefined, undefined);
    }).toThrow();

    expect(() => {
      validateFeaturePredictions(undefined, undefined, undefined);
    }).toThrow();

    expect(() => {
      validateInterval({ startTimeSecs: null, endTimeSecs: null });
    }).toThrow();

    expect(() => {
      validateIntervalId(undefined);
    }).toThrow();

    expect(() => {
      validateMinimumNumberOfChannels(pdar, [], eventBeamformingTemplate);
    }).toThrow();

    expect(() => {
      validateSlowness(undefined, pdar, undefined, undefined, 'P');
    }).toThrow();

    expect(() => {
      validateStation('pdar', undefined);
    }).toThrow();
  });
});
