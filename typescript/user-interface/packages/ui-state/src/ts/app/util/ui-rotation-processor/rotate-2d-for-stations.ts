import type { CommonTypes } from '@gms/common-model';
import type { SamplingType } from '@gms/common-model/lib/common/types';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
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
  useStageId
} from '../../hooks';
import { selectOpenEvent, selectOpenIntervalName, selectUsername } from '../../state';
import { useGet2dRotationForSingleChannelPair } from './rotate-2d-for-channels';
import type { SDHypothesisArgs } from './ui-rotation-processor-utils';
import {
  extractRotationResultsFromPromises,
  getChannelPairsToRotate,
  useGetOrFetchRotationTemplateForStationAndPhase
} from './ui-rotation-processor-utils';

const logger = UILogger.create(
  'GMS_LOG_UI_ROTATION_PROCESSOR_STATION',
  process.env.GMS_LOG_UI_ROTATION_PROCESSOR_STATION
);

/**
 * higher order function that creates a function for rotate 2d stations
 *
 * @returns a function to perform 2D rotation for the given stations
 */
export function useRotate2dForStations() {
  const getOrFetchRotationTemplate = useGetOrFetchRotationTemplateForStationAndPhase();
  const get2dRotationForSingleChannelPair = useGet2dRotationForSingleChannelPair();
  const allChannels = useChannels();
  const dispatch = useAppDispatch();
  const rotationReplacementAzimuthToleranceDeg =
    useProcessingAnalystConfiguration()?.rotation?.rotationReplacementAzimuthToleranceDeg;
  const username = useAppSelector(selectUsername);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const stageId = useStageId();
  const currentOpenEvent = useAppSelector(selectOpenEvent);

  return React.useCallback(
    /**
     * Used to rotate channel pairs for all provided stations based on the phase rotation definition
     *
     * @param stations list of stations to rotate
     * @param phaseType selected phase type
     * @param samplingType optional sampling type
     * @param leadDuration optional lead duration
     * @param duration optional duration
     * @param location optional location
     * @param receiverToSourceAzimuthDeg optional receiver to source azimuth
     */
    async function rotate2dForStations(
      stations: Station[],
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
      const flattenedRotatedChannelPromises: Promise<MaskAndRotate2dResult[]>[] = stations.flatMap(
        async station => {
          // The InteractiveAnalysisStateManager collects the information it needs to perform 2D waveform rotation:
          // The InteractiveAnalysisStateManager selects the RotationTemplate for the Station and PhaseType literal.
          const rotationTemplate = await getOrFetchRotationTemplate(station, phaseType);

          // The InteractiveAnalysisStateManager selects from the UiStateStore the Channel pairs to rotate.
          const channelsToRotate: [Channel, Channel][] = getChannelPairsToRotate(
            allChannels,
            station,
            rotationTemplate
          );

          // If the leadDuration and duration values are provided to the operation then use these values for leadDuration and duration.
          // Otherwise use the leadDuration and duration values from the RotationTemplate.
          const leadDurationForStations = leadDuration ?? rotationTemplate.leadDuration;
          const durationForStations = duration ?? rotationTemplate.duration;

          // The InteractiveAnalysisStateManager calls the operation rotate2dForChannels(...) for each of the Channel pairs to rotate,
          // providing the Channels, the phaseType, the samplingType, the leadDuration, the duration, the location, and the
          // receiverToSourceAzimuthDeg.
          const rotatedChannelPromises: MaskAndRotate2dResult[][] = await Promise.all(
            channelsToRotate.flatMap(async channelPair =>
              get2dRotationForSingleChannelPair(
                channelPair,
                phaseType,
                samplingType,
                leadDurationForStations,
                durationForStations,
                location,
                receiverToSourceAzimuthDeg
              )
            )
          );
          return flatMap(rotatedChannelPromises);
        }
      );

      const rotationResultsArray: MaskAndRotate2dResult[] = await Promise.allSettled(
        flattenedRotatedChannelPromises
      )
        .then(promises => extractRotationResultsFromPromises(promises))
        .catch(error => {
          logger.error(error);
          return [];
        });

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
      username,
      openIntervalName,
      stageId,
      currentOpenEvent?.id,
      dispatch,
      rotationReplacementAzimuthToleranceDeg,
      getOrFetchRotationTemplate,
      allChannels,
      get2dRotationForSingleChannelPair
    ]
  );
}
