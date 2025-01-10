import type {
  BeamformingTemplateTypes,
  ChannelTypes,
  CommonTypes,
  EventTypes,
  FacetedTypes,
  StationTypes,
  WorkflowTypes
} from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import { validateTimeRange } from '@gms/common-model/lib/common/util';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';

import type { PredictFeatures } from '../../api/data/event/predict-features-for-event-location';
import { validateChannelsMatchStations } from '../../util/channel-util';
import {
  BeamformingArrivalTimeError,
  BeamformingAzimuthError,
  BeamformingChannelsMatchStationsError,
  BeamformingEventHypothesisError,
  BeamformingFeaturePredictionsError,
  BeamformingIntervalIdError,
  BeamformingMinimumNumberOfChannelsError,
  BeamformingSlownessError,
  BeamformingStationError,
  BeamformingTemplateError,
  BeamformingTimeRangeError
} from './errors';

/**
 * @throws if {@link IntervalId} is nullish.
 */
export function validateIntervalId(
  intervalId: WorkflowTypes.IntervalId | undefined
): asserts intervalId is NonNullable<WorkflowTypes.IntervalId> {
  if (intervalId == null) {
    throw new BeamformingIntervalIdError(intervalId);
  }
}

/**
 * @throws if {@link TimeRange} is nullish.
 */
export function validateInterval(
  timeRange: Nullable<CommonTypes.TimeRange>
): asserts timeRange is NonNullable<CommonTypes.TimeRange> {
  try {
    validateTimeRange(timeRange);
  } catch (e) {
    throw new BeamformingTimeRangeError(timeRange);
  }
}

/**
 * @throws if {@link EventTypes.EventHypothesis} is nullish.
 */
export function validateEventHypothesis(
  event: EventTypes.Event | undefined,
  eventHypothesis: EventTypes.EventHypothesis | undefined
): asserts eventHypothesis is NonNullable<EventTypes.EventHypothesis> {
  if (event == null || eventHypothesis == null) {
    throw new BeamformingEventHypothesisError(event, eventHypothesis);
  }
}

/**
 * @throws if {@link PredictFeatures}  is nullish.
 */
export function validateFeaturePredictions(
  event: EventTypes.Event | undefined,
  eventHypothesis: EventTypes.EventHypothesis | undefined,
  featurePredictions: PredictFeatures | undefined
): asserts featurePredictions is NonNullable<PredictFeatures> {
  if (featurePredictions == null) {
    throw new BeamformingFeaturePredictionsError(event, eventHypothesis, featurePredictions);
  }
}

/**
 * @throws if arrival time {@link SignalDetectionTypes.FeatureMeasurementValue} is nullish.
 */
export function validateArrivalTime(
  arrivalTime: SignalDetectionTypes.FeatureMeasurementValue | undefined,
  station: StationTypes.Station,
  event: EventTypes.Event | undefined,
  eventHypothesis: EventTypes.EventHypothesis | undefined,
  phase: string
): asserts arrivalTime is NonNullable<SignalDetectionTypes.ArrivalTimeMeasurementValue> {
  if (
    arrivalTime == null ||
    !SignalDetectionTypes.Util.isArrivalTimeMeasurementValue(arrivalTime)
  ) {
    throw new BeamformingArrivalTimeError(station, event, eventHypothesis, phase);
  }
}

/**
 * @throws if azimuth {@link SignalDetectionTypes.FeatureMeasurementValue} is nullish.
 */
export function validateAzimuth(
  azimuth: SignalDetectionTypes.FeatureMeasurementValue | undefined,
  station: StationTypes.Station,
  event: EventTypes.Event | undefined,
  eventHypothesis: EventTypes.EventHypothesis | undefined,
  phase: string
): asserts azimuth is NonNullable<SignalDetectionTypes.NumericMeasurementValue> {
  if (azimuth == null || !SignalDetectionTypes.Util.isNumericMeasurementValue(azimuth)) {
    throw new BeamformingAzimuthError(station, event, eventHypothesis, phase);
  }
}

/**
 * @throws if slowness {@link SignalDetectionTypes.FeatureMeasurementValue} is nullish.
 */
export function validateSlowness(
  slowness: SignalDetectionTypes.FeatureMeasurementValue | undefined,
  station: StationTypes.Station,
  event: EventTypes.Event | undefined,
  eventHypothesis: EventTypes.EventHypothesis | undefined,
  phase: string
): asserts slowness is NonNullable<SignalDetectionTypes.ArrivalTimeMeasurementValue> {
  if (slowness == null || !SignalDetectionTypes.Util.isNumericMeasurementValue(slowness)) {
    throw new BeamformingSlownessError(station, event, eventHypothesis, phase);
  }
}

/**
 * @throws if {@link BeamformingTemplateTypes.BeamformingTemplate} is nullish.
 */
export function validateBeamformingTemplate(
  station:
    | StationTypes.Station
    | FacetedTypes.VersionReference<'name'>
    | FacetedTypes.EntityReference<'name', StationTypes.Station>,
  template: BeamformingTemplateTypes.BeamformingTemplate | undefined
): asserts template is NonNullable<BeamformingTemplateTypes.BeamformingTemplate> {
  if (template == null) {
    throw new BeamformingTemplateError(station, template);
  }
}

/**
 * @throws if {@link StationTypes.Station} is nullish.
 */
export function validateStation(
  name: string,
  station: StationTypes.Station | undefined
): asserts station is StationTypes.Station {
  if (station == null || station.name !== name) {
    throw new BeamformingStationError(name);
  }
}

/**
 * @throws if {@link ChannelTypes.Channel[]} belong to multiple stations.
 */
export function validateBeamformingChannelsMatchStations(
  channels: ChannelTypes.Channel[],
  stations: StationTypes.Station[]
): asserts channels is ChannelTypes.Channel[] {
  let valid = false;
  try {
    valid = validateChannelsMatchStations(channels, stations);
  } catch {
    valid = false;
  }

  if (!valid) {
    throw new BeamformingChannelsMatchStationsError(channels, stations);
  }
}

/**
 * @throws if the number of {@link ChannelTypes.Channel[]}s is less than
 * the specified minimum in the {@link BeamformingTemplateTypes.BeamformingTemplate}.
 */
export function validateMinimumNumberOfChannels(
  station: StationTypes.Station,
  channels: ChannelTypes.Channel[],
  template: BeamformingTemplateTypes.BeamformingTemplate
): asserts channels is ChannelTypes.Channel[] {
  if (channels.length < template.minWaveformsToBeam) {
    throw new BeamformingMinimumNumberOfChannelsError(station, channels, template);
  }
}
