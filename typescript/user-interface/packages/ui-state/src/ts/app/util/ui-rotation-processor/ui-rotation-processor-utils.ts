import type {
  CommonTypes,
  FilterTypes,
  ProcessingMaskDefinitionTypes,
  RotationTypes,
  WaveformTypes
} from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import type { ProcessingOperation, Timeseries } from '@gms/common-model/lib/channel-segment/types';
import { SamplingType } from '@gms/common-model/lib/common/types';
import type { ChannelSegmentTypes } from '@gms/common-model/lib/common-model';
import type { Event } from '@gms/common-model/lib/event';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution
} from '@gms/common-model/lib/event';
import { getFilterName } from '@gms/common-model/lib/filter';
import type {
  RotationDefinition,
  RotationDescription,
  RotationParameters
} from '@gms/common-model/lib/rotation/types';
import type {
  ArrivalTimeMeasurementValue,
  SignalDetection
} from '@gms/common-model/lib/signal-detection';
import {
  findArrivalTimeFeatureMeasurement,
  findReceiverToSourceAzimuthFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { ChannelOrientationType } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import type { ProcessingAnalystConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';
import { FULL_CIRCLE_DEGREES, greatCircleAzimuth, meanAngleDegrees } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import flatMap from 'lodash/flatMap';
import mean from 'lodash/mean';
import React from 'react';
import { toast } from 'react-toastify';

import type {
  FilterDefinitionsRecord,
  MaskAndRotate2dResult,
  UiChannelSegment,
  UiChannelSegmentsPair
} from '../../../types';
import { maskAndRotate2d as workerMaskAndRotate2d } from '../../../workers';
import type { FilterDescriptor } from '../../../workers/api/ui-filter-processor';
import { filter } from '../../../workers/api/ui-filter-processor';
import { selectFilterDefinitions, selectProcessingMaskDefinitionsByChannels } from '../../api';
import type { PredictFeaturesForEventLocationArgs } from '../../api/data/event/predict-features-for-event-location';
import {
  prepareReceiverCollection,
  useAppSelector,
  useFetchRotationTemplatesQuery,
  useFetchUiChannelSegmentsForChannelTimeRange,
  useGetRawUnfilteredUiChannelSegments,
  usePredictFeaturesForEventLocationFunction,
  useProcessingAnalystConfiguration,
  useRotationTemplates
} from '../../hooks';
import { useFindFilterByUsage } from '../../hooks/signal-enhancement-configuration-hooks';
import { selectOpenIntervalName } from '../../state';
import { selectChannelFilters } from '../../state/waveform/selectors';
import { getChannelNameComponents } from '../channel-factory-util';
import { isWaveformUiChannelSegment } from '../channel-segment-util';
import {
  areChannelLocationsWithinTolerance,
  areChannelOrientationCodesCompatible,
  areChannelsOrthogonal,
  areChannelsWithinSampleRateTolerance,
  findChannelsByGroupName,
  findChannelsByNames,
  isChannelWithinVerticalTolerance
} from '../channel-util';
import { designFiltersAndGetUpdatedFilterDefinitions } from '../filtering-utils';
import { useCreateProcessingMasksFromChannelSegment } from '../ui-waveform-masking-util';
import { trimUiChannelSegment } from '../util';

const logger = UILogger.create(
  'GMS_LOG_UI_ROTATION_PROCESSOR',
  process.env.GMS_LOG_UI_ROTATION_PROCESSOR
);

function rotationWarning(message: string) {
  logger.warn(`maskAndRotate2d: ${message}`);
  toast.warn(message, {
    toastId: message
  });
}

function rotationError(message: string) {
  logger.error(`maskAndRotate2d: ${message}`);
  toast.error(message, {
    toastId: message
  });
}

/**
 * Used by {@link saveRotationResultsAndUpdateSignalDetections} to create new signal detection hypothesis when necessary
 */
export interface SDHypothesisArgs {
  username: string;
  openIntervalName: string;
  stageId: IntervalId;
  currentEventId: string | undefined;
}

/**
 * Validates channels as specified in architecture guidance
 *
 * @throws if there are not exactly two channels
 * @throws if the channel horizontal angles are identical
 * Logs warnings if given values that seem incorrect.
 *
 * @param rotationDefinition
 * @param channels
 */
function validateChannelInputs(
  rotationDefinition: RotationDefinition,
  channels: [Channel, Channel]
) {
  if (channels.length !== 2) {
    throw new Error('maskAndRotate2d: Rotation requires exactly two channels');
  }
  if (channels[0].orientationAngles == null || channels[1].orientationAngles == null) {
    throw new Error('maskAndRotate2d: Channels do not have correct orientation angles');
  }
  if (
    channels[0].orientationAngles.horizontalAngleDeg ===
    channels[1].orientationAngles.horizontalAngleDeg
  ) {
    throw new Error('maskAndRotate2d: Channels cannot have the same orientation angle');
  }
  if (
    !areChannelsWithinSampleRateTolerance(
      rotationDefinition.rotationParameters.sampleRateToleranceHz
    )(channels[0])(channels[1])
  ) {
    rotationWarning('Channels are out of sample rate tolerance');
  }
  if (channels[0].units !== channels[1].units) {
    rotationWarning('Incompatible channel units');
  }
  if (channels[0].channelBandType !== channels[1].channelBandType) {
    rotationWarning('Incompatible channel band codes');
  }
  if (channels[0].channelInstrumentType !== channels[1].channelInstrumentType) {
    rotationWarning('Incompatible channel instrument types');
  }
  if (!areChannelOrientationCodesCompatible(channels[0])(channels[1])) {
    rotationWarning('Incompatible channel orientation codes');
  }
  if (
    !isChannelWithinVerticalTolerance(
      rotationDefinition.rotationParameters.orientationAngleToleranceDeg
    )(channels[0]) ||
    !isChannelWithinVerticalTolerance(
      rotationDefinition.rotationParameters.orientationAngleToleranceDeg
    )(channels[1])
  ) {
    rotationWarning('Channel out of vertical tolerance');
  }
  if (
    !areChannelsOrthogonal(rotationDefinition.rotationParameters.orientationAngleToleranceDeg)(
      channels[0]
    )(channels[1])
  ) {
    rotationWarning('Channels are not orthogonal');
  }
  if (
    !areChannelLocationsWithinTolerance(rotationDefinition.rotationParameters.locationToleranceKm)(
      channels[0]
    )(channels[1])
  ) {
    rotationWarning('Channels are not within location tolerance');
  }
}

/**
 * @returns a callback that gives a single unfiltered channel segment for the provided channel, if one is found.
 */
export function useGetUnfilteredUiChannelSegment(): (
  channel: Channel
) => Promise<UiChannelSegment<WaveformTypes.Waveform>[] | undefined> {
  const getRawUnfilteredChannelSegments = useGetRawUnfilteredUiChannelSegments();
  const fetchChannelSegments = useFetchUiChannelSegmentsForChannelTimeRange();

  return React.useCallback(
    async channel => {
      const segment = (await getRawUnfilteredChannelSegments()).find(
        seg => seg.channelSegmentDescriptor.channel.name === channel.name
      );
      if (segment !== undefined) {
        return [segment];
      }
      return fetchChannelSegments([channel]);
    },
    [fetchChannelSegments, getRawUnfilteredChannelSegments]
  );
}

/**
 * validate that channel segment is defined, and that it is a waveform channel segment.
 */
function validateUiChannelSegment(
  channelSegment: UiChannelSegment<Timeseries> | undefined,
  channelName: string
): asserts channelSegment is NonNullable<UiChannelSegment<WaveformTypes.Waveform>> {
  if (channelSegment === undefined) {
    throw new Error(`Cannot find channel segment for ${channelName}`);
  }
  if (!isWaveformUiChannelSegment(channelSegment)) {
    throw new Error(
      `Cannot perform waveform rotation on non waveform timeseries data for channel segment: ${channelSegment.channelSegment.id}`
    );
  }
}

function getUiChannelSegmentPairs(
  uiChannelSegmentsA: UiChannelSegment<WaveformTypes.Waveform>[],
  uiChannelSegmentsB: UiChannelSegment<WaveformTypes.Waveform>[]
): [UiChannelSegment<WaveformTypes.Waveform>, UiChannelSegment<WaveformTypes.Waveform>][] {
  const length = Math.min(uiChannelSegmentsA.length, uiChannelSegmentsB.length);
  const result: [
    UiChannelSegment<WaveformTypes.Waveform>,
    UiChannelSegment<WaveformTypes.Waveform>
  ][] = [];

  for (let i = 0; i < length; i += 1) {
    result.push([uiChannelSegmentsA[i], uiChannelSegmentsB[i]]);
  }

  return result;
}

const filterRotationResult = async (
  maskAndRotate2dResult: MaskAndRotate2dResult,
  processingAnalystConfiguration: ProcessingAnalystConfiguration,
  cachedFilterDefinitions: FilterDefinitionsRecord,
  actualFilter: FilterTypes.Filter
): Promise<MaskAndRotate2dResult> => {
  const {
    defaultTaper,
    defaultRemoveGroupDelay,
    defaultSampleRateToleranceHz,
    defaultGroupDelaySecs
  } = processingAnalystConfiguration.gmsFilters;
  const { rotatedChannel, rotatedUiChannelSegment } = maskAndRotate2dResult;

  const filtersBySampleRate = await designFiltersAndGetUpdatedFilterDefinitions(
    rotatedChannel.name,
    actualFilter,
    [rotatedUiChannelSegment],
    cachedFilterDefinitions,
    {
      groupDelaySecs: defaultGroupDelaySecs,
      sampleRateToleranceHz: defaultSampleRateToleranceHz,
      taper: defaultTaper,
      removeGroupDelay: defaultRemoveGroupDelay
    },
    error => {
      throw error;
    }
  );
  const filterDescriptor: FilterDescriptor = {
    channel: rotatedChannel,
    filterSegments: [
      {
        uiChannelSegment: rotatedUiChannelSegment,
        filter: actualFilter,
        filtersBySampleRate: filtersBySampleRate[getFilterName(actualFilter)]
      }
    ]
  };
  const filterResult = await filter(filterDescriptor, defaultTaper, defaultRemoveGroupDelay);
  if (filterResult[0].status === 'fulfilled') {
    return {
      ...maskAndRotate2dResult,
      filteredChannel: filterResult[0].value.channel,
      filteredUiChannelSegment: filterResult[0].value.uiChannelSegment
    };
  }
  throw new Error(` ${filterResult[0].reason}`);
};

/**
 * Filter the given rotate 2d results IF required. Filtered waveforms results will be awaited.
 * @returns updated results with filtered channels and filtered uiChannelSegments
 */
function useFilterRotate2dResults() {
  const channelFilters = useAppSelector(selectChannelFilters);
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const cachedFilterDefinitions: FilterDefinitionsRecord = useAppSelector(selectFilterDefinitions);

  const findFilterByUsage = useFindFilterByUsage();

  return React.useCallback(
    async (maskAndRotate2dResults: MaskAndRotate2dResult[]): Promise<MaskAndRotate2dResult[]> => {
      return Promise.all(
        maskAndRotate2dResults.map(async maskAndRotate2dResult => {
          const channelFilter = channelFilters[maskAndRotate2dResult.stationName];
          // If the channel filter cant be found we shouldn't filter
          if (!channelFilter) return maskAndRotate2dResult;

          const actualFilter = findFilterByUsage(
            channelFilter,
            maskAndRotate2dResult.stationName,
            maskAndRotate2dResult.rotatedUiChannelSegment
          );

          // If the actual filter cant be found we cant filter
          if (!actualFilter) return maskAndRotate2dResult;

          return filterRotationResult(
            maskAndRotate2dResult,
            processingAnalystConfiguration,
            cachedFilterDefinitions,
            actualFilter
          );
        })
      );
    },
    [cachedFilterDefinitions, channelFilters, findFilterByUsage, processingAnalystConfiguration]
  );
}

/**
 * Hook that creates a `maskAndRotate2D` function, which performs the maskAndRotate2D operation.
 * operation creates masked and rotated UiChannelSegments for the provided ProcessingOperation,
 * RotationDefinition, time interval, and input UiChannelSegment objects produced by the provided
 * Channel collection. Each provided Channel must be a raw Channel.
 *
 * @throws if there are not exactly two channels
 * @throws if the channel horizontal angles are identical
 *
 * @param processingOperation
 * @param rotationDefinition
 * @param station
 * @param startTime
 * @param endTime
 * @param channels
 */
export function useMaskAndRotate2d() {
  const createProcessingMasks = useCreateProcessingMasksFromChannelSegment();
  const getChannelSegment = useGetUnfilteredUiChannelSegment();
  const processingMaskDefinitionsByChannels = useAppSelector(
    selectProcessingMaskDefinitionsByChannels
  );
  const filterRotate2dResults = useFilterRotate2dResults();

  return React.useCallback(
    async function maskAndRotate2dCallback(
      processingOperation: ProcessingOperation,
      rotationDefinition: RotationDefinition,
      station: Station,
      rotationTimeInterval: CommonTypes.TimeRange,
      channels: [Channel, Channel]
    ): Promise<MaskAndRotate2dResult[]> {
      validateChannelInputs(rotationDefinition, channels);

      const channelSegmentPairs = getUiChannelSegmentPairs(
        (await getChannelSegment(channels[0])) ?? [],
        (await getChannelSegment(channels[1])) ?? []
      );

      const results = flatMap(
        await Promise.all(
          channelSegmentPairs.map(async channelSegmentPair => {
            const channelSegment0 = channelSegmentPair[0];
            const channelSegment1 = channelSegmentPair[1];

            validateUiChannelSegment(channelSegment0, channels[0].name);
            validateUiChannelSegment(channelSegment1, channels[1].name);

            const uiChannelSegmentPair: UiChannelSegmentsPair<WaveformTypes.Waveform> = [
              trimUiChannelSegment<WaveformTypes.Waveform>(channelSegment0, rotationTimeInterval),
              trimUiChannelSegment<WaveformTypes.Waveform>(channelSegment1, rotationTimeInterval)
            ];

            const channel0Masks = await createProcessingMasks(
              uiChannelSegmentPair[0],
              processingOperation,
              rotationDefinition.rotationDescription.phaseType
            );

            const channel1Masks = await createProcessingMasks(
              uiChannelSegmentPair[1],
              processingOperation,
              rotationDefinition.rotationDescription.phaseType
            );

            const maskedResult: Record<string, ChannelSegmentTypes.ProcessingMask[]> = {
              [channel0Masks.channel.name]: channel0Masks.processingMasks,
              [channel1Masks.channel.name]: channel1Masks.processingMasks
            };

            // Get the taper definition, the taper should be the same for either channel in the pair
            const maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined =
              processingMaskDefinitionsByChannels.find(
                p =>
                  p.channel.name === channels[0].name &&
                  p.channel.effectiveAt === channels[0].effectiveAt
              )?.processingMaskDefinitions?.[rotationDefinition.rotationDescription.phaseType]?.[
                processingOperation
              ]?.taperDefinition;

            logger.info('Created processing masks and masked channel segments to use for input');

            try {
              return workerMaskAndRotate2d(
                rotationDefinition,
                station,
                channels,
                uiChannelSegmentPair,
                rotationTimeInterval,
                maskedResult,
                maskTaperDefinition
              );
            } catch (e) {
              rotationError(e.message);
              throw e;
            }
          })
        )
      );
      return filterRotate2dResults(results);
    },
    [
      createProcessingMasks,
      filterRotate2dResults,
      getChannelSegment,
      processingMaskDefinitionsByChannels
    ]
  );
}

/**
 * Getter for getting rotation templates from redux store
 *
 * @returns a function that gets rotation templates matching a station/phase out of the redux store
 */
export function useGetRotationTemplateForStationAndPhase() {
  const rotationTemplateRecords = useRotationTemplates();
  return React.useCallback(
    (station: string, phase: string) => {
      const stationName = Object.keys(rotationTemplateRecords).find(rotationTemplateRecordKey => {
        return rotationTemplateRecordKey === station;
      });
      // If the station does not have rotation templates something went wrong or is still being queried
      if (stationName === undefined) {
        return undefined;
      }
      // check to see if we have the rotation template for this phase
      const rotationTemplatePhaseKey = Object.keys(
        rotationTemplateRecords[stationName].rotationTemplatesByPhase
      ).find(rotationTemplateRecordPhase => {
        return rotationTemplateRecordPhase === phase;
      });
      if (rotationTemplatePhaseKey) {
        const rotationTemplate: RotationTypes.RotationTemplate =
          rotationTemplateRecords[stationName].rotationTemplatesByPhase[rotationTemplatePhaseKey];
        return rotationTemplate;
      }
      return undefined;
    },
    [rotationTemplateRecords]
  );
}

/**
 * Returns a function for getting rotation templates. Returns the value out of Redux if it exists,
 * or else queries for it, if it doesn't.
 *
 * @returns a function that may be used to retrieve the rotation template for a station/phase
 */
export function useGetOrFetchRotationTemplateForStationAndPhase() {
  const getRotationTemplate = useGetRotationTemplateForStationAndPhase();
  const fetchRotationTemplatesQuery = useFetchRotationTemplatesQuery();

  return React.useCallback(
    async (station: Station, phaseType: string) => {
      let rotationTemplate = getRotationTemplate(station.name, phaseType);
      if (rotationTemplate == null) {
        const rotationTemplateQueryResult = await fetchRotationTemplatesQuery({
          phases: [phaseType],
          stations: [{ name: station.name, effectiveAt: station.effectiveAt }]
        }).catch(e => rotationError(e?.message));
        rotationTemplate = rotationTemplateQueryResult?.find(
          result =>
            result.station.name === station.name &&
            result.rotationTemplatesByPhase[phaseType] != null
        )?.rotationTemplatesByPhase[phaseType];
        if (rotationTemplate == null) {
          throw new Error(
            `No rotation template available to rotate ${station.name} for phase ${phaseType}`
          );
        }
      }
      return rotationTemplate;
    },
    [fetchRotationTemplatesQuery, getRotationTemplate]
  );
}

/**
 * Validates that the sampling type is found in the enum {@link SamplingType}
 *
 * @throws if the sampling type is not in the enum
 */
export function validateSamplingType(
  candidateSamplingType: string
): asserts candidateSamplingType is SamplingType {
  if (
    typeof candidateSamplingType !== 'string' ||
    !Object.values(SamplingType).includes(candidateSamplingType as SamplingType)
  ) {
    throw new Error(`Invalid sampling type: ${candidateSamplingType}`);
  }
}

/**
 * Validates that the lead and duration are both valid.
 * If neither is defined, that is considered valid.
 * If both are defined, that is considered valid.
 * If only one is defined, that is considered invalid.
 *
 * If defined, both must be numeric
 * If defined, lead must be greater than 0
 *
 * @throws if only one of leadDuration and duration is defined
 * @throws if either is defined as something other than a number
 * @throws if duration is less than 0
 */
export function validateLeadDuration(
  leadDuration: number | undefined,
  duration: number | undefined
) {
  if (leadDuration === undefined && duration === undefined) return;
  if (leadDuration === undefined || duration === undefined) {
    throw new Error(
      `leadDuration and duration must both be defined, or both be undefined; however, leadDuration is ${leadDuration} and duration is ${duration}`
    );
  }
  if (typeof leadDuration !== 'number') {
    throw new Error(
      `Invalid lead duration for rotation: ${leadDuration}. Lead duration must be a number.`
    );
  }
  if (typeof duration !== 'number' || duration < 0) {
    throw new Error(
      `Invalid duration for rotation: ${duration}. Duration must be a positive number.`
    );
  }
}

/**
 * Validate that location OR receiverToSourceAzimuthDeg are valid for rotation:
 *
 * If only one is defined, that is considered valid
 * If both are defined, that is considered invalid
 * If neither is defined, that is considered valid
 *
 * @throws if both are defined
 */
export function validateLocationOrAzimuth(
  location?: CommonTypes.Location,
  receiverToSourceAzimuthDeg?: number
) {
  if (location != null && receiverToSourceAzimuthDeg != null) {
    throw new Error(
      'Error rotating. One of location and receiverToSourceAzimuthDeg may be given, but not both.'
    );
  }
}

/**
 * Validate that location and receiverToSourceAzimuthDeg are valid for rotation:
 *
 * If only one is defined, that is considered valid
 * If both are defined, that is considered invalid
 * If neither is defined, that is considered invalid
 *
 * @throws if both are defined
 * @throws if neither is defined
 */
export function validateLocationAndAzimuth(
  location?: CommonTypes.Location,
  receiverToSourceAzimuthDeg?: number
) {
  if (location != null && receiverToSourceAzimuthDeg != null) {
    throw new Error(
      'Error rotating. Exactly one of location and receiverToSourceAzimuthDeg must be given, but both are provided.'
    );
  }
  if (location == null && receiverToSourceAzimuthDeg == null) {
    throw new Error(
      'Error rotating. Exactly one of location and receiverToSourceAzimuthDeg must be given, but neither is provided.'
    );
  }
}

/**
 * Get an average location. Assume the earth is flat. Do not account for wrapping.
 *
 * > Beliefs that the Earth is flat, contrary to over two millennia of scientific consensus
 * > that it is roughly spherical, are promoted by a number of organizations and
 * > individuals. Such beliefs are pseudoscience; the hypotheses and assertions are not
 * > based on scientific knowledge. Flat Earth advocates are classified by experts in
 * > philosophy and physics as science deniers.
 * >   —Wikipedia
 *
 * In spite of the fact that the earth is probably not flat, we still have some use cases
 * where this is considered appropriate. Be careful using this function, and validate that
 * it is appropriate for all use cases.
 *
 */
function getAverageFlatEarthLocation(
  a: CommonTypes.Location,
  b: CommonTypes.Location
): CommonTypes.Location {
  return {
    latitudeDegrees: mean([a.latitudeDegrees, b.latitudeDegrees]),
    // assume a flat earth with no wrapping per SME guidance for this specific calculation
    longitudeDegrees: mean([a.longitudeDegrees, b.longitudeDegrees]),
    depthKm: mean([a.depthKm, b.depthKm]),
    elevationKm: mean([a.elevationKm, b.elevationKm])
  };
}

/**
 * Get the preferred location solution for an event and the open interval.
 *
 * @throws if the event does not have a preferred event hypothesis
 * @throws  if there is no preferred location solution for the preferred event hypothesis
 *
 * @param event an event from which to get the preferred location solution
 * @param openIntervalName the name of the currently open interval, such as 'AL1 Event Review'
 * @returns the preferred location solution for the provided event
 */
function getPreferredLocationSolution(event: Event, openIntervalName: string) {
  const preferredHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
    event,
    openIntervalName
  );
  if (preferredHypothesis == null) {
    throw new Error('No preferred hypothesis found for current open event. Cannot rotate.');
  }
  const preferredLocationSolution = findPreferredLocationSolution(
    preferredHypothesis?.id.hypothesisId,
    event.eventHypotheses
  );
  if (preferredLocationSolution == null) {
    throw new Error('No preferred location solution found for open event. Cannot rotate.');
  }
  return preferredLocationSolution;
}

/**
 * Get the receiver to source azimuth to use for rotation.
 * One of the following is required: location, the receiverToSourceAzimuthDeg, or the open event
 * Use the receiverToSourceAzimuthDeg if provided. If not, then use the location. If neither is provided,
 * then use the preferred event location.
 *
 * @throws if there is no open event, no receiverToSourceAzimuth, and no location provided.
 *
 * @param openIntervalName the name of the open interval, such as "AL1 Event Review"
 * @param receiverLocation the location of the receiver, such as the average location between the channels
 * @param receiverToSourceAzimuthDeg optional azimuth from the receiver to the location of the event. If
 * defined, this is the value that will be returned.
 * @param sourceLocation optional location representing the source towards which to rotate the waveforms.
 * @param currentOpenEvent the currently open event. If not defined, then a source location or receiver
 * to source azimuth must be provided. If neither the source location nor the receiver to source azimuth
 * are provided, the preferred location from this event will be used.
 * @param signalDetection if part of this operation, the signal detection used
 *
 * @returns the receiver to source azimuth, in degrees
 */
export function calculateReceiverToSourceAzimuthDegrees(
  openIntervalName: string,
  receiverLocation: CommonTypes.Location,
  receiverToSourceAzimuthDeg: number | undefined,
  sourceLocation: CommonTypes.Location | undefined,
  currentOpenEvent: Event | undefined,
  signalDetection?: SignalDetection
) {
  if (receiverToSourceAzimuthDeg != null) {
    return receiverToSourceAzimuthDeg;
  }
  if (sourceLocation != null) {
    return greatCircleAzimuth(
      receiverLocation.latitudeDegrees,
      receiverLocation.longitudeDegrees,
      sourceLocation.latitudeDegrees,
      sourceLocation.longitudeDegrees
    );
  }
  if (signalDetection != null) {
    const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
    const receiverToSourceAzimuthFeatureMeasurement = findReceiverToSourceAzimuthFeatureMeasurement(
      hypothesis.featureMeasurements
    );

    if (receiverToSourceAzimuthFeatureMeasurement != null) {
      return receiverToSourceAzimuthFeatureMeasurement.measurementValue.measuredValue.value;
    }
  }
  if (currentOpenEvent != null) {
    const preferredLocationSolution = getPreferredLocationSolution(
      currentOpenEvent,
      openIntervalName
    );
    return greatCircleAzimuth(
      receiverLocation.latitudeDegrees,
      receiverLocation.longitudeDegrees,
      preferredLocationSolution.location.latitudeDegrees,
      preferredLocationSolution.location.longitudeDegrees
    );
  }
  throw new Error(
    'Cannot rotate. Either an event must be open, or a location or receiverToSourceAzimuth must be provided.'
  );
}

/**
 * @returns a function for fetching feature predictions by event, station, and phase
 */
function useGetFeaturePrediction() {
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const predictFeatures = usePredictFeaturesForEventLocationFunction();
  return React.useCallback(
    async function getFeaturePrediction(event: Event, station: Station, phaseType: string) {
      const receivers = prepareReceiverCollection(undefined, [station]);
      const args: PredictFeaturesForEventLocationArgs = {
        phases: [phaseType],
        receivers,
        sourceLocation: getPreferredLocationSolution(event, openIntervalName).location
      };
      return predictFeatures(args);
    },
    [openIntervalName, predictFeatures]
  );
}

/**
 * Get the arrival time for a feature prediction. Query for the prediction if necessary.
 *
 * @returns a function that gets the arrival time for an event, station, and phase type
 */
export function useGetArrivalTimePrediction() {
  const getFeaturePrediction = useGetFeaturePrediction();
  return React.useCallback(
    async (event: Event, station: Station, phaseType: string) => {
      const featurePredictionsForEventLocation = await getFeaturePrediction(
        event,
        station,
        phaseType
      );
      if (featurePredictionsForEventLocation == null) {
        throw new Error(
          `Could not get feature predictions for station: ${station} event: ${event} and phase: ${phaseType}`
        );
      }
      const featurePredictions =
        featurePredictionsForEventLocation.receiverLocationsByName[station.name]
          ?.featurePredictions;
      const featurePrediction = featurePredictions.find(
        fp =>
          fp.phase === phaseType &&
          fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
      );
      return featurePrediction?.predictionValue?.predictedValue as ArrivalTimeMeasurementValue;
    },
    [getFeaturePrediction]
  );
}

/**
 * @throws if the channels array does not have length 2
 * @throws if the channels are not from the same station
 */
export function validateChannelsForRotation(
  channels: [Channel, Channel]
): asserts channels is NonNullable<[Channel, Channel]> {
  if (channels.length !== 2) {
    throw new Error(
      `Rotation requires exactly two channels, but rotate2dForChannels was called with ${channels.length} channels`
    );
  }
  if (channels[0].station.name !== channels[1].station.name) {
    throw new Error(
      `Cannot rotate for two channels from different stations. Received channels from ${channels[0].station.name} and ${channels[1].station.name}`
    );
  }
}

/**
 * Get the station from the provided, fully populated stations, that matches the provided channel
 */
export function getStationMatchingChannel(stations: Station[], channel: Channel) {
  const station = stations.find(s => s.allRawChannels.find(chan => chan.name === channel.name));
  if (station == null) {
    throw new Error(`Cannot find station matching channels ${channel.name}`);
  }
  return station;
}

/**
 * Calculate the start and end time for which to rotate, given the parameters provided
 *
 * If no event is open, rotate for the current interval
 * If an event is open, rotate starting at the arrival time minus the lead, and for
 * the duration provided
 *
 * @throws if the viewable interval is null
 *
 * @param currentOpenEvent the event that is open, if any
 * @param viewableInterval the viewable interval in the waveform display (including any changes due to panning)
 * @param leadDuration the duration in seconds before the arrival time at which to start the interval
 * @param duration the duration of the rotated waveforms
 * @param rotationTemplate the template for the rotation action in question
 * @param arrivalTime the arrival time at which to generate the rotated waveforms
 * @returns a CommonTypes.TimeRange for the rotated waveform
 */
export function getTimeIntervalForRotation(
  currentOpenEvent: Event | undefined,
  viewableInterval: Nullable<CommonTypes.TimeRange>,
  leadDuration: number | undefined,
  duration: number | undefined,
  rotationTemplate: RotationTypes.RotationTemplate,
  arrivalTime: SignalDetectionTypes.ArrivalTimeMeasurementValue | undefined
): NonNullable<CommonTypes.TimeRange> {
  if (
    viewableInterval == null ||
    viewableInterval.startTimeSecs == null ||
    viewableInterval.endTimeSecs == null
  ) {
    throw new Error('Cannot rotate without a defined time range');
  }
  if (currentOpenEvent == null) {
    return viewableInterval as NonNullable<CommonTypes.TimeRange>;
  }

  if (arrivalTime == null) {
    return {
      startTimeSecs: viewableInterval.startTimeSecs,
      endTimeSecs: viewableInterval.endTimeSecs
    };
  }

  const rotationLead = leadDuration ?? rotationTemplate.leadDuration;
  const rotationDuration = duration ?? rotationTemplate.duration;
  const startTimeSecs = arrivalTime.arrivalTime.value - rotationLead;
  const endTimeSecs = startTimeSecs + rotationDuration;
  return { startTimeSecs, endTimeSecs };
}

/**
 * Creates a rotation definition from given parameters.
 *
 * @param channelPair an array of two channels being rotated
 * @param rotationTemplate rotation template
 * @param phaseType the desired phase type
 * @param samplingType the desired sampling type
 * @param receiverToSourceAzimuthDeg the calculated receiver to source azimuth in degrees
 *
 * @returns a valid rotation description
 */
export function create2dRotationDefinition(
  channels: [Channel, Channel],
  rotationTemplate: RotationTypes.RotationTemplate,
  phaseType: string,
  samplingType: string,
  receiverToSourceAzimuthDeg: number
): RotationDefinition {
  const rotationDescription: RotationDescription = {
    phaseType,
    samplingType,
    twoDimensional: true
  };

  const channelsLocation = getAverageFlatEarthLocation(channels[0].location, channels[1].location);

  const verticalAngleDeg = meanAngleDegrees(
    channels.map(chan => {
      if (chan.orientationAngles == null || chan.orientationAngles.verticalAngleDeg == null) {
        throw new Error('Cannot rotate without known orientation angles.');
      }
      return chan.orientationAngles.verticalAngleDeg;
    })
  );

  const rotationParameters: RotationParameters = {
    location: channelsLocation,
    locationToleranceKm: rotationTemplate.locationToleranceKm,
    orientationAngles: {
      horizontalAngleDeg:
        (receiverToSourceAzimuthDeg + FULL_CIRCLE_DEGREES / 2) % FULL_CIRCLE_DEGREES,
      verticalAngleDeg
    },
    orientationAngleToleranceDeg: rotationTemplate.orientationAngleToleranceDeg,
    receiverToSourceAzimuthDeg,
    sampleRateHz: mean(channels.map(chan => chan.nominalSampleRateHz)),
    sampleRateToleranceHz: rotationTemplate.sampleRateToleranceHz
  };

  return {
    rotationDescription,
    rotationParameters
  };
}

/**
 * Given an array of channels this will pair compatible channels for the rotation operation. Channel
 * compatibility is determined by correct orientation (N,E,1,2,3) and if channels are orthogonal. In addition
 * they must have the following matching parameters: nominalSampleRate, bandType, instrumentType, dataType
 * and units.
 *
 * @param channels the channels to try and pair
 * @param rotationTemplate the rotation template for this operation
 * @returns valid pairs of channels to rotate
 */
export function pairChannelsToRotate(
  channels: Channel[],
  rotationTemplate: RotationTypes.RotationTemplate
): [Channel, Channel][] {
  const pairs: [Channel, Channel][] = [];
  const horizontalCompatibleChannelOrientationTypes = [
    ChannelOrientationType.NORTH_SOUTH,
    ChannelOrientationType.EAST_WEST,
    ChannelOrientationType.ORTHOGONAL_1,
    ChannelOrientationType.ORTHOGONAL_2
  ];

  // filter for horizontal channels first (channelOrientationCode must be N,E,1,2)
  const horizontalChannels = channels.filter(channel =>
    horizontalCompatibleChannelOrientationTypes.includes(channel.channelOrientationType)
  );

  // Group by site
  const channelsGroupedBySite = horizontalChannels.reduce<Record<string, Channel[]>>(
    (result, channel) => {
      const { groupName } = getChannelNameComponents(channel.name);
      return {
        ...result,
        [groupName]: [...(result?.[groupName] || []), channel]
      };
    },
    {}
  );

  // match channels by same nominalSampleRate, bandType, instrumentType, dataType, and units also confirm they are orthogonal ({@link areChannelsOrthogonal})
  Object.values(channelsGroupedBySite).forEach(groupedChannels => {
    const channelsToPair = groupedChannels;

    while (channelsToPair.length > 1) {
      const current = channelsToPair.pop();

      channelsToPair.some((channel, index) => {
        if (
          channel.nominalSampleRateHz === current?.nominalSampleRateHz &&
          channel.channelBandType === current?.channelBandType &&
          channel.channelInstrumentType === current?.channelInstrumentType &&
          channel.channelDataType === current?.channelDataType &&
          channel.units === current?.units &&
          areChannelsOrthogonal(rotationTemplate.orientationAngleToleranceDeg)(channel)(current)
        ) {
          pairs.push([current, channel]);
          channelsToPair.splice(index, 1);
          return true;
        }

        return false;
      });
    }
  });

  return pairs;
}

/**
 * Will create an array of channel pairs which are valid to rotate.
 *
 * @param channels an array with all channels so we can return fully populated channels
 * @param station the station we will be rotating
 * @param rotationTemplate the rotation template
 * @returns an array of pairs of channels
 */
export function getChannelPairsToRotate(
  channels: Channel[],
  station: Station,
  rotationTemplate: RotationTypes.RotationTemplate
): [Channel, Channel][] {
  let channelsToPair: Channel[] = [];

  if (rotationTemplate.inputChannels != null) {
    // If the RotateTemplate inputChannels is specified, then use use the Channels specified by the collection.
    channelsToPair = findChannelsByNames(
      channels,
      rotationTemplate.inputChannels.map(({ name }) => name)
    );
  } else if (rotationTemplate.inputChannelGroup != null) {
    // If the RotateTemplate inputChannelGroup is specified, then use the Channels specified by the ChannelGroup's channels collection.
    channelsToPair = findChannelsByGroupName(channels, rotationTemplate.inputChannelGroup.name);
  } else {
    // If neither inputChannels or inputChannelGroup are populated, use the stations allRawChannels collection
    const rawChannelNames = station.allRawChannels.map(channel => channel.name);
    channelsToPair = channels.filter(channel => rawChannelNames.includes(channel.name));
  }

  return pairChannelsToRotate(channelsToPair, rotationTemplate);
}

/**
 * Creates a valid time range for this signal detection if the signal detection has a valid arrival time
 * feature measurement. If there is no arrival time feature measurement this will return undefined.
 *
 * @param signalDetection the signal detection we need the time range for
 * @param leadDuration the lead duration for the time range
 * @param duration the duration of the time range
 * @returns a valid time range or undefined
 */
export function getRotationTimeRangeForSignalDetection(
  signalDetection: SignalDetection,
  leadDuration: number,
  duration: number
): CommonTypes.TimeRange | undefined {
  const hypothesis = getCurrentHypothesis(signalDetection.signalDetectionHypotheses);
  try {
    const arrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
      hypothesis.featureMeasurements
    );

    return {
      startTimeSecs:
        arrivalTimeFeatureMeasurement.measurementValue.arrivalTime.value - leadDuration,
      endTimeSecs: arrivalTimeFeatureMeasurement.measurementValue.arrivalTime.value + duration
    };
  } catch (e) {
    return undefined;
  }
}

/**
 * Used by {@link useRotate2dForStations} and {@link useRotate2dForSignalDetections} to format results properly for dispatch
 *
 * @param rotationResultPromises
 * @returns Array of resolved MaskAndRotate2dResult
 */
export function extractRotationResultsFromPromises(
  rotationResultPromises: PromiseSettledResult<MaskAndRotate2dResult[]>[]
): MaskAndRotate2dResult[] {
  const rotationResults: MaskAndRotate2dResult[] = [];
  rotationResultPromises.forEach(promise => {
    if (promise.status === 'fulfilled' && promise.value !== undefined) {
      rotationResults.push(...promise.value);
    } else if (promise.status === 'rejected') {
      rotationError(promise.reason);
    }
  });
  return rotationResults;
}
