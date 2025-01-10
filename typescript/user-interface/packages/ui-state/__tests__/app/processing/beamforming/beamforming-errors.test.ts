import { eventBeamformingTemplate } from '@gms/common-model/__tests__/__data__';

import {
  BeamformingArrivalTimeError,
  BeamformingAzimuthError,
  BeamformingChannelsMatchStationsError,
  beamformingConfigurationErrorCodes,
  BeamformingError,
  BeamformingEventHypothesisError,
  BeamformingFeaturePredictionsError,
  BeamformingFilterError,
  BeamformingIntervalIdError,
  BeamformingMinimumNumberOfChannelsError,
  BeamformingNoWaveformDataError,
  beamformingProcessingErrorCodes,
  BeamformingSlownessError,
  BeamformingStationError,
  BeamformingTemplateError,
  BeamformingTimeRangeError,
  BeamformingUnknownError,
  BeamformingWithStationError
} from '../../../../src/ts/app/processing/beamforming/errors';

describe('beamforming errors', () => {
  it('exists', () => {
    expect(BeamformingArrivalTimeError).toBeDefined();
    expect(BeamformingAzimuthError).toBeDefined();
    expect(BeamformingChannelsMatchStationsError).toBeDefined();
    expect(beamformingConfigurationErrorCodes).toBeDefined();
    expect(BeamformingError).toBeDefined();
    expect(BeamformingEventHypothesisError).toBeDefined();
    expect(BeamformingFeaturePredictionsError).toBeDefined();
    expect(BeamformingFilterError).toBeDefined();
    expect(BeamformingIntervalIdError).toBeDefined();
    expect(BeamformingMinimumNumberOfChannelsError).toBeDefined();
    expect(BeamformingNoWaveformDataError).toBeDefined();
    expect(beamformingProcessingErrorCodes).toBeDefined();
    expect(BeamformingSlownessError).toBeDefined();
    expect(BeamformingStationError).toBeDefined();
    expect(BeamformingTemplateError).toBeDefined();
    expect(BeamformingTimeRangeError).toBeDefined();
    expect(BeamformingUnknownError).toBeDefined();
    expect(BeamformingWithStationError).toBeDefined();
  });

  it('errors', () => {
    expect(
      new BeamformingArrivalTimeError({ name: 'test' }, undefined, undefined, 'P')
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. No arrival time found.]`);

    expect(
      new BeamformingAzimuthError({ name: 'test' }, undefined, undefined, 'P')
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. No azimuth found.]`);

    expect(new BeamformingChannelsMatchStationsError([], [{ name: 'test' }])).toMatchInlineSnapshot(
      `[Error: Cannot create beam. Selected channels do not match selected station(s).]`
    );

    expect(beamformingConfigurationErrorCodes).toMatchInlineSnapshot(`
      [
        "beamforming-invalid-beamforming-template",
        "beamforming-minimum-number-of-channels",
      ]
    `);

    expect(new BeamformingError('test message')).toMatchInlineSnapshot(`[Error: test message]`);

    expect(new BeamformingEventHypothesisError(undefined, undefined)).toMatchInlineSnapshot(
      `[Error: Cannot create beam. Event hypothesis not found.]`
    );

    expect(
      new BeamformingFeaturePredictionsError(undefined, undefined, undefined)
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. Feature Predictions not found.]`);

    expect(
      new BeamformingFilterError(
        'bad filter',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. Filter error: bad filter]`);

    expect(new BeamformingIntervalIdError(undefined)).toMatchInlineSnapshot(
      `[Error: Cannot create beam. Interval ID not found.]`
    );

    expect(
      new BeamformingMinimumNumberOfChannelsError({ name: 'test' }, [], eventBeamformingTemplate)
    ).toMatchInlineSnapshot(
      `[Error: Cannot create beam due to a configuration issue. Input channels within the beamforming template do not meet the minimum waveform criteria to beam.]`
    );

    expect(new BeamformingNoWaveformDataError([], undefined)).toMatchInlineSnapshot(
      `[Error: Cannot create beam. No valid waveforms found for beaming.]`
    );

    expect(beamformingProcessingErrorCodes).toMatchInlineSnapshot(`
      [
        "beamforming-invalid-interval-id",
        "beamforming-invalid-time-range",
        "beamforming-invalid-event-hypothesis",
        "beamforming-invalid-feature-predictions",
        "beamforming-invalid-arrival-time",
        "beamforming-invalid-azimuth",
        "beamforming-invalid-slowness",
        "beamforming-invalid-station",
        "beamforming-invalid-channels",
        "beamforming-invalid-channels-to-stations",
        "beamforming-invalid-waveform-data",
        "beamforming-filter-error",
        "beamforming-algorithm-error",
        "beamforming-error",
        "beamforming-unknown",
      ]
    `);

    expect(
      new BeamformingSlownessError({ name: 'test' }, undefined, undefined, 'P')
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. No slowness found.]`);

    expect(new BeamformingStationError('test')).toMatchInlineSnapshot(
      `[test: Cannot create beam. Could not find station.]`
    );

    expect(
      new BeamformingTemplateError({ name: 'test' }, eventBeamformingTemplate)
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. Unable to load beamforming template.]`);

    expect(
      new BeamformingTimeRangeError({ startTimeSecs: 0, endTimeSecs: 0 })
    ).toMatchInlineSnapshot(`[Error: Cannot create beam. Current interval not found.]`);

    expect(new BeamformingUnknownError(new Error('unknown error'))).toMatchInlineSnapshot(
      `[Error: Cannot create beam. Unexpected error: unknown error]`
    );

    expect(new BeamformingWithStationError('test message', { name: 'test' })).toMatchInlineSnapshot(
      `[Error: test message]`
    );
  });
});
