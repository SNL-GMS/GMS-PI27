import type { CommonTypes } from '@gms/common-model';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment/types';
import type { SamplingType } from '@gms/common-model/lib/common/types';
import type { SignalDetection } from '@gms/common-model/lib/signal-detection';
import { findSignalDetectionPhase } from '@gms/common-model/lib/signal-detection/util';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { UILogger } from '@gms/ui-util';
import flatMap from 'lodash/flatMap';
import React from 'react';

import type { MaskAndRotate2dResult } from '../../../types';
import { addRotatedChannelsAndChannelSegments } from '../../api/data/channel/channel-reducer';
import {
  useAppDispatch,
  useAppSelector,
  useChannels,
  useProcessingAnalystConfiguration,
  useStageId,
  useVisibleStations
} from '../../hooks';
import { selectOpenEvent, selectOpenIntervalName, selectUsername } from '../../state';
import type { SDHypothesisArgs } from './ui-rotation-processor-utils';
import {
  calculateReceiverToSourceAzimuthDegrees,
  create2dRotationDefinition,
  extractRotationResultsFromPromises,
  getChannelPairsToRotate,
  getRotationTimeRangeForSignalDetection,
  useGetOrFetchRotationTemplateForStationAndPhase,
  useMaskAndRotate2d,
  validateLeadDuration,
  validateLocationOrAzimuth,
  validateSamplingType
} from './ui-rotation-processor-utils';

const logger = UILogger.create(
  'GMS_LOG_UI_ROTATION_PROCESSOR_SD',
  process.env.GMS_LOG_UI_ROTATION_PROCESSOR_SD
);

/**
 * @returns hook to perform a 2d rotation based on the given array of signal detections
 */
export function useRotate2dForSignalDetections() {
  const dispatch = useAppDispatch();
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const channels = useChannels();
  const visibleStations = useVisibleStations();
  const getOrFetchRotationTemplateForStationAndPhase =
    useGetOrFetchRotationTemplateForStationAndPhase();
  const maskAndRotate2d = useMaskAndRotate2d();
  const rotationReplacementAzimuthToleranceDeg =
    useProcessingAnalystConfiguration()?.rotation?.rotationReplacementAzimuthToleranceDeg;
  const username = useAppSelector(selectUsername);
  const stageId = useStageId();

  return React.useCallback(
    async function rotate2dForSignalDetections(
      signalDetections: SignalDetection[],
      samplingType?: SamplingType,
      leadDuration?: number,
      duration?: number,
      location?: CommonTypes.Location,
      receiverToSourceAzimuthDeg?: number
    ): Promise<void> {
      if (!stageId) {
        throw new Error('No stage ID found, open interval before rotating');
      }
      // If provided to the operation, verifies that samplingType is a valid SamplingType literal value.
      if (samplingType !== undefined) {
        validateSamplingType(samplingType);
      }
      // If provided to the operation, verifies that both leadDuration and duration are provided.
      validateLeadDuration(leadDuration, duration);
      // If provided to the operation, verifies that only location or receiverToSourceAzimuthDeg (not both) are provided.
      validateLocationOrAzimuth(location, receiverToSourceAzimuthDeg);

      // Parallelize rotation of channel pairs
      const resultPromises: Promise<MaskAndRotate2dResult[]>[] = signalDetections.flatMap(
        async signalDetection => {
          // Selects the associated Station from the provided SignalDetection from the UiStateStore.
          const station = visibleStations.find(({ name }) => name === signalDetection.station.name);
          if (station === undefined) {
            logger.error(
              `Cannot find station ${signalDetection.station.name} for signal detection ${signalDetection.id}`
            );
            return [];
          }

          // Selects the PhaseType literal from the PHASE FeatureMeasurement of the SignalDetection.
          const phaseType = findSignalDetectionPhase(signalDetection);

          let receiverToSourceAzimuthDegForSd: number;
          try {
            receiverToSourceAzimuthDegForSd = calculateReceiverToSourceAzimuthDegrees(
              openIntervalName,
              station.location,
              receiverToSourceAzimuthDeg,
              location,
              currentOpenEvent,
              signalDetection
            );
          } catch (error) {
            logger.error(error);
          }

          // Selects the RotationTemplate from UiStateStore for the Station and PhaseType literal.
          const rotationTemplate = await getOrFetchRotationTemplateForStationAndPhase(
            station,
            phaseType
          );

          // Get the channel pairs to rotate
          const channelsToRotate: [Channel, Channel][] = getChannelPairsToRotate(
            channels,
            station,
            rotationTemplate
          );

          // If the leadDuration and duration values are provided to the operation then use these values for leadDuration and duration.
          // Otherwise use the leadDuration and duration values from the RotationTemplate.
          const leadDurationForSd = leadDuration ?? rotationTemplate.leadDuration;
          const durationForSd = duration ?? rotationTemplate.duration;

          // The InteractiveAnalysisStateManager combines the ARRIVAL_TIME FeatureMeasurement value from the SignalDetection with the leadDuration
          // and duration to determine the startTime and endTime.
          const rotationTimeRange: CommonTypes.TimeRange | undefined =
            getRotationTimeRangeForSignalDetection(
              signalDetection,
              leadDurationForSd,
              durationForSd
            );

          // We cant rotate without this time range
          if (rotationTimeRange == null) {
            logger.error(
              `Could not determine the time range for the given signal detection ${signalDetection.id}`
            );
            return [];
          }

          const mr2dResult: MaskAndRotate2dResult[][] = await Promise.all(
            channelsToRotate.map(async channelPair => {
              const rotationDefinition = create2dRotationDefinition(
                channelPair,
                rotationTemplate,
                phaseType,
                samplingType ?? rotationTemplate.rotationDescription.samplingType,
                receiverToSourceAzimuthDegForSd
              );

              const mr2dPromise: Promise<MaskAndRotate2dResult[]> = maskAndRotate2d(
                ProcessingOperation.ROTATION,
                rotationDefinition,
                station,
                rotationTimeRange,
                channelPair
              );
              return mr2dPromise;
            })
          );
          return flatMap(mr2dResult);
        }
      );
      const rotationResultsArray: MaskAndRotate2dResult[] = await Promise.allSettled(
        resultPromises
      ).then(promises => extractRotationResultsFromPromises(promises));

      const newSDHypothesisArgs: SDHypothesisArgs = {
        username,
        openIntervalName,
        stageId,
        currentEventId: currentOpenEvent?.id
      };
      dispatch(
        addRotatedChannelsAndChannelSegments({
          rotationResults: rotationResultsArray,
          config: {
            rotationReplacementAzimuthToleranceDeg
          },
          newSDHypothesisArgs
        })
      );
    },
    [
      channels,
      currentOpenEvent,
      dispatch,
      getOrFetchRotationTemplateForStationAndPhase,
      maskAndRotate2d,
      openIntervalName,
      rotationReplacementAzimuthToleranceDeg,
      stageId,
      username,
      visibleStations
    ]
  );
}
