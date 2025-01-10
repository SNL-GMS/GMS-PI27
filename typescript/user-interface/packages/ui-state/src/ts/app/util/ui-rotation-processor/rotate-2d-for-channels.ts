import type { CommonTypes } from '@gms/common-model';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment/types';
import type { SamplingType } from '@gms/common-model/lib/common/types';
import type { RotationDefinition } from '@gms/common-model/lib/rotation/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import React from 'react';

import type { MaskAndRotate2dResult } from '../../../types';
import { addRotatedChannelsAndChannelSegments } from '../../api';
import {
  useAppDispatch,
  useAppSelector,
  useProcessingAnalystConfiguration,
  useStageId,
  useViewableInterval,
  useVisibleStations
} from '../../hooks';
import { useValidatePhase } from '../../hooks/phase-hooks';
import { selectOpenEvent, selectOpenIntervalName, selectUsername } from '../../state';
import type { SDHypothesisArgs } from './ui-rotation-processor-utils';
import {
  calculateReceiverToSourceAzimuthDegrees,
  create2dRotationDefinition,
  getStationMatchingChannel,
  getTimeIntervalForRotation,
  useGetArrivalTimePrediction,
  useGetOrFetchRotationTemplateForStationAndPhase,
  useMaskAndRotate2d,
  validateChannelsForRotation,
  validateLeadDuration,
  validateLocationAndAzimuth,
  validateSamplingType
} from './ui-rotation-processor-utils';

/**
 * Hook that returns a function to get rotation results for a single channel pair. Does not dispatch the results.
 *
 * Validates inputs, throwing in case of errors, and logging in case of warnings.
 * Errors, which throw, include:
 * * The length of the channels array is not exactly 2
 * * The channels are from different stations
 * * If a sampling type is provided, it is valid
 * * If location or receiverToSourceAzimuthDeg is defined, then only one is defined (not both)
 * * If a duration or leadDuration is defined, then both are defined, numeric, and duration is non-negative
 * * If an event is open, then exactly one of location and receiverToSourceAzimuthDeg is provided
 *
 * @returns the function `rotate2dForChannels` that creates two rotated channels from the inputs
 */
export function useGet2dRotationForSingleChannelPair() {
  const currentOpenEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const [viewableInterval] = useViewableInterval();
  const visibleStations = useVisibleStations();
  const getOrFetchRotationTemplate = useGetOrFetchRotationTemplateForStationAndPhase();
  const getArrivalTimePrediction = useGetArrivalTimePrediction();
  const maskAndRotate2d = useMaskAndRotate2d();
  const validatePhase = useValidatePhase();

  return React.useCallback(
    /**
     * Performs the operation rotate2dForChannels, and returns the result but does not dispatch it.
     * Called by {@link useGet2dRotationForSingleChannelPair}, and {@link useRotate2dForStations}
     * which take the resulting {@type MaskAndRotate2dResult[]} and batch/dispatch them
     *
     * @param channels channel pair to rotate
     * @param phaseType selected phase type
     * @param samplingType optional sampling type
     * @param leadDuration optional lead duration
     * @param duration optional duration
     * @param location optional location
     * @param receiverToSourceAzimuthDeg optional receiver to source azimuth
     */
    async function get2dRotationForSingleChannelPair(
      channels: [Channel, Channel],
      phaseType: string,
      samplingType?: SamplingType,
      leadDuration?: number,
      duration?: number,
      location?: CommonTypes.Location,
      receiverToSourceAzimuthDeg?: number
    ): Promise<MaskAndRotate2dResult[]> {
      validateChannelsForRotation(channels);
      const station = getStationMatchingChannel(visibleStations, channels[0]);
      const rotationTemplate = await getOrFetchRotationTemplate(station, phaseType);
      if (!validatePhase(phaseType)) {
        throw new Error(`Rotation error: Invalid phase ${phaseType}.`);
      }
      if (samplingType !== undefined) {
        validateSamplingType(samplingType);
      }
      validateLeadDuration(leadDuration, duration);
      if (!currentOpenEvent) {
        validateLocationAndAzimuth(location, receiverToSourceAzimuthDeg);
      }
      const newReceiverToSourceAzimuthDeg: number = calculateReceiverToSourceAzimuthDegrees(
        openIntervalName,
        station.location,
        receiverToSourceAzimuthDeg,
        location,
        currentOpenEvent
      );
      const rotationDefinition: RotationDefinition = create2dRotationDefinition(
        channels,
        rotationTemplate,
        phaseType,
        samplingType ?? rotationTemplate.rotationDescription.samplingType,
        newReceiverToSourceAzimuthDeg
      );

      const arrivalTime =
        currentOpenEvent != null
          ? await getArrivalTimePrediction(currentOpenEvent, station, phaseType)
          : undefined;

      const rotationTimeRange = getTimeIntervalForRotation(
        currentOpenEvent,
        viewableInterval,
        leadDuration,
        duration,
        rotationTemplate,
        arrivalTime
      );

      return maskAndRotate2d(
        ProcessingOperation.ROTATION,
        rotationDefinition,
        station,
        rotationTimeRange,
        channels
      );
    },
    [
      visibleStations,
      getOrFetchRotationTemplate,
      validatePhase,
      currentOpenEvent,
      openIntervalName,
      getArrivalTimePrediction,
      viewableInterval,
      maskAndRotate2d
    ]
  );
}

/**
 * This hook creates a function to perform the operation rotate2dForChannels, which is called
 * from the InteractiveAnalysisWaveformDisplay when the Analyst selects to perform a 2D waveform
 * rotation on the provided Channels. It effectively is a wrapper for {@link useGet2dRotationForSingleChannelPair},
 * and it additionally dispatches the rotation result
 */
export function useRotate2dForChannels() {
  const dispatch = useAppDispatch();
  const rotationReplacementAzimuthToleranceDeg =
    useProcessingAnalystConfiguration()?.rotation?.rotationReplacementAzimuthToleranceDeg;
  const rotate2dForSingleChannelPair = useGet2dRotationForSingleChannelPair();
  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const currentOpenEvent = useAppSelector(selectOpenEvent);

  return React.useCallback(
    /**
     * Performs the operation rotate2dForChannels, and dispatches the result.
     * Called from the InteractiveAnalysisWaveformDisplay when the Analyst selects to perform a 2D waveform
     * rotation on the provided Channels. It effectively is a wrapper for {@link useGet2dRotationForSingleChannelPair},
     * and it additionally dispatches the rotation result
     *
     * @param channels channel pair to rotate
     * @param phaseType selected phase type
     * @param samplingType optional sampling type
     * @param leadDuration optional lead duration
     * @param duration optional duration
     * @param location optional location
     * @param receiverToSourceAzimuthDeg optional receiver to source azimuth
     */
    async function rotate2dForChannelWrapper(
      channels: [Channel, Channel],
      phaseType: string,
      samplingType?: SamplingType,
      leadDuration?: number,
      duration?: number,
      location?: CommonTypes.Location,
      receiverToSourceAzimuthDeg?: number
    ) {
      if (!stageId) {
        throw new Error('No stage ID found, open interval before rotating');
      }
      const result = await rotate2dForSingleChannelPair(
        channels,
        phaseType,
        samplingType,
        leadDuration,
        duration,
        location,
        receiverToSourceAzimuthDeg
      );

      const newSDHypothesisArgs: SDHypothesisArgs = {
        username,
        openIntervalName,
        stageId,
        currentEventId: currentOpenEvent?.id
      };
      dispatch(
        addRotatedChannelsAndChannelSegments({
          rotationResults: result,
          config: {
            rotationReplacementAzimuthToleranceDeg
          },
          newSDHypothesisArgs
        })
      );
    },
    [
      currentOpenEvent?.id,
      dispatch,
      openIntervalName,
      rotate2dForSingleChannelPair,
      rotationReplacementAzimuthToleranceDeg,
      stageId,
      username
    ]
  );
}
