import type { ChannelTypes, ProcessingMaskDefinitionTypes, WaveformTypes } from '@gms/common-model';
import {
  ArrayUtil,
  ChannelSegmentTypes,
  FkTypes,
  SignalDetectionTypes,
  StationTypes
} from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type { FkSpectraTemplate } from '@gms/common-model/lib/fk';
import type { Channel } from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';
import type { FkStationTypeConfigurations } from '@gms/common-model/lib/ui-configuration/types';
import { UILogger } from '@gms/ui-util';
import { unwrapResult } from '@reduxjs/toolkit';
import flatMap from 'lodash/flatMap';
import isEqual from 'lodash/isEqual';
import mean from 'lodash/mean';
import sortBy from 'lodash/sortBy';
import sortedUniq from 'lodash/sortedUniq';
import React from 'react';
import { toast } from 'react-toastify';

import type { FkChannelSegmentRecord, UiChannelSegment } from '../../types';
import {
  computeLegacyFkSpectra,
  createComputeFkInput,
  createRequestString,
  queryFkFrequencyThumbnails,
  selectFkChannelSegments,
  selectFkReviewablePhases,
  selectFkSpectraTemplates
} from '../api';
import {
  computeFk as computeFkApi,
  getPeakFkAttributes as getPeakFkAttributesApi
} from '../api/data/fk/compute-fk-operations';
import { markFkReviewed } from '../api/data/fk/mark-fk-reviewed';
import { updateFk, updateFkThumbnail } from '../api/data/fk/update-fk-reducer';
import { updateFkMetadata } from '../api/data/fk/update-fk-util';
import { revertFk } from '../api/data/signal-detection/revert-fk-reducer';
import type {
  GetFkReviewablePhasesQueryArgs,
  GetFkSpectraTemplatesQueryArgs
} from '../api/data/signal-enhancement';
import {
  fkSpectraTemplatesQuery,
  getFkReviewablePhases,
  getFkSpectraTemplates
} from '../api/data/signal-enhancement';
import { UIStateError } from '../error-handling/ui-state-error';
import { inputChannelsByPrioritization } from '../processing';
import { validateChannels } from '../processing/validate-channels';
import type { AsyncFetchHistoryEntry, AsyncFetchResult, FetchHistoryStatus } from '../query';
import { hasBeenRejected, requestIsPending } from '../query/async-fetch-util';
import type { FkThumbnailsFilterType } from '../state';
import {
  fksActions,
  selectDisplayedSignalDetectionId,
  selectOpenActivityNames,
  selectSignalDetectionMeasuredValues
} from '../state';
import { useCreateFkBeam } from '../util/beamforming-util';
import { useCreateProcessingMasksFromChannelSegment } from '../util/ui-waveform-masking-util';
import { mergeUiChannelSegments } from '../util/util';
import { useChannels } from './channel-hooks';
import { useGetStationRawUnfilteredUiChannelSegments } from './channel-segment-hooks';
import { useFetchHistoryStatus } from './fetch-history-hooks';
import { useEffectiveTime } from './operational-time-period-configuration-hooks';
import { useProcessingAnalystConfiguration } from './processing-analyst-configuration-hooks';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';
import { usePhaseTypeFavorites } from './signal-detection-hooks';
import {
  useAllStations,
  useGetAllStationsQuery,
  useGetVisibleStationsVersionReferences,
  useVisibleStations
} from './station-definition-hooks';

const logger = UILogger.create('GMS_FK_HOOKS', process.env.GMS_FK_HOOKS);
/**
 * Defines async fetch result for the fk channel segments. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type FkChannelSegmentFetchResult = AsyncFetchResult<FkChannelSegmentRecord>;

/**
 * Defines async fetch result for the beamforming templates. It contains flags indicating
 * the status of the request.
 *
 * @see {@link AsyncFetchResult}
 */
export type FkReviewablePhasesByStationFetchResult =
  AsyncFetchResult<FkTypes.FkReviewablePhasesByStation>;

/**
 * Possible FK query statuses
 */
export enum FkQueryStatus {
  SUCCESS = 'SUCCESS',
  NO_TEMPLATE = 'NO_TEMPLATE',
  PENDING_QUERY = 'PENDING_QUERY',
  INVALID_PHASE = 'INVALID_PHASE',
  INVALID_STATION_TYPE = 'INVALID_STATION_TYPE',
  NETWORK_FAILURE = 'NETWORK_FAILURE'
}

export interface ComputeFkParams {
  fkSpectraDefinition: FkTypes.FkSpectraDefinition;
  fkSpectraTemplate: FkTypes.FkSpectraTemplate;
  station: StationTypes.Station;
  inputChannels: ChannelTypes.Channel[];
  detectionTime: number;
  startTime: number;
  endTime: number;
  signalDetection: SignalDetectionTypes.SignalDetection;
  expandedTimeBufferSeconds: number;
  maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
  processingMasksByChannel: FkTypes.ProcessingMasksByChannel[];
  uiChannelSegmentsForProcessingMasks;
}

export interface CreateFKPreviewsUserInput {
  readonly fkSpectraDefinition: FkTypes.FkSpectraDefinition;
  readonly detectionTime: number;
  readonly fkSpectraTemplate: FkSpectraTemplate;
  readonly station: Station;
  readonly inputChannels: Channel[];
  readonly uiChannelSegmentsForProcessingMasks: UiChannelSegment<WaveformTypes.Waveform>[];
  readonly processingMasksByChannel: FkTypes.ProcessingMasksByChannel[];
  readonly maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
  readonly expandedTimeBufferSeconds: number;
  readonly signalDetectionId: string;
}

/**
 * A hook that can be used to return the current history of the fk reviewable phases query.
 * This includes the following information:
 *  - the async fetch status of all the async requests
 *  - the `data`: the history of the `getFkReviewablePhases` queries
 *
 * @see {@link FkReviewablePhasesByStationFetchResult}
 *
 * @returns the current history of the processing mask definitions query.
 */
export const useGetFkReviewablePhasesByStationHistory = (): FetchHistoryStatus => {
  const history = useAppSelector(state => state.data.queries.getFkReviewablePhases);
  return useFetchHistoryStatus<GetFkReviewablePhasesQueryArgs>(history);
};

/**
 * Hook that fetches the {@link FkReviewablePhasesByActivityNameByStation}.
 *
 * @returns the {@link FkReviewablePhasesByActivityNameByStation}
 */
export const useFkReviewablePhasesQuery = (): FkTypes.FkReviewablePhasesByActivityNameByStation => {
  // issue any new fetch requests
  const dispatch = useAppDispatch();
  const visibleStations = useVisibleStations();
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const args: GetFkReviewablePhasesQueryArgs[] = React.useMemo(() => {
    return openActivityNames
      .map(activityName => {
        const stationNamesBySD = visibleStations?.map(station => ({
          name: station.name
        }));
        return {
          stations: stationNamesBySD,
          activity: {
            name: activityName
          }
        };
      })
      .filter(arg => arg?.stations?.length > 0);
  }, [openActivityNames, visibleStations]);

  //! useEffect updates redux state
  React.useEffect(() => {
    args.forEach(arg => {
      dispatch(getFkReviewablePhases(arg)).catch(error => {
        throw new UIStateError(error);
      });
    });
  }, [args, dispatch]);
  // retrieve all reviewable phases from the state
  return useAppSelector(selectFkReviewablePhases);
};

/**
 * Hook that fetches the {@link FkReviewablePhasesByStation} for the provided activity name.
 *
 * @param activityName the requested activity name
 * @returns the {@link FkReviewablePhasesByStation}
 */
export const useFkReviewablePhasesByActivityNameQuery = (
  activityName: string
): FkTypes.FkReviewablePhasesByStation => {
  const fkReviewablePhases = useFkReviewablePhasesQuery();
  return React.useMemo(() => {
    if (!fkReviewablePhases[activityName]) return {};
    return fkReviewablePhases[activityName];
  }, [fkReviewablePhases, activityName]);
};

/**
 * Hook that returns all of the unique PhaseTypes that are reviewable for at least a one {@link Station}.
 * See {@link useFkReviewablePhasesQuery}
 *
 * @returns a collection of unique PhaseTypes
 */
export const useAllFkReviewablePhases = (): string[] => {
  const fkReviewablePhasesByActivityNameByStation = useFkReviewablePhasesQuery();
  return React.useMemo(() => {
    if (fkReviewablePhasesByActivityNameByStation) {
      const allReviewablePhases = flatMap(
        Object.values(fkReviewablePhasesByActivityNameByStation).map(entry =>
          flatMap(Object.values(entry))
        )
      );
      return sortedUniq(sortBy(flatMap(Object.values(Object.values(allReviewablePhases)))));
    }
    return [];
  }, [fkReviewablePhasesByActivityNameByStation]);
};

/**
 * Hook that fetches the {@link FkSpectraTemplatesByStationByPhase}
 *
 * By default this hook queries and returns the {@link FkSpectraTemplatesByStationByPhase} for
 * the visible Stations and favorite/reviewable PhaseTypes.
 *
 * @returns a function callback that can accept additional PhaseTypes to query for {@link FkSpectraTemplatesByStationByPhase}
 */
export const useFkSpectraTemplatesQuery = (): ((
  phaseTypes?: string[]
) => FkTypes.FkSpectraTemplatesByStationByPhase) => {
  const dispatch = useAppDispatch();
  const stationVersionReferences = useGetVisibleStationsVersionReferences();

  // select and combine the reviewable and favorite PhaseTypes
  const reviewablePhaseTypes = useAllFkReviewablePhases();
  const favoritePhasesTypes = usePhaseTypeFavorites(reviewablePhaseTypes);

  const fkSpectraTemplates: FkTypes.FkSpectraTemplatesByStationByPhase = useAppSelector(
    state => state.data.fkSpectraTemplates
  );

  return React.useCallback(
    (phaseTypes: string[] = []) => {
      dispatch(
        getFkSpectraTemplates({
          stations: stationVersionReferences,
          phases: sortedUniq(sortBy(favoritePhasesTypes.concat(phaseTypes)))
        })
      ).catch(error => {
        throw new UIStateError(error);
      });

      return fkSpectraTemplates;
    },
    [dispatch, fkSpectraTemplates, favoritePhasesTypes, stationVersionReferences]
  );
};

/**
 * Hook that fetches the {@link FkSpectraTemplatesByStationByPhase}
 * for specific list of stations and phases. Expected use is for FK templates not
 * requested by default
 *
 * @returns a function callback to request missing FkSpectraTemplatesByStationByPhase record
 */

export const useGetMissingFkSpectraTemplates = (): ((
  args: GetFkSpectraTemplatesQueryArgs
) => Promise<FkTypes.FkSpectraTemplatesByStationByPhase | undefined>) => {
  const dispatch = useAppDispatch();
  return React.useCallback(
    async (args: GetFkSpectraTemplatesQueryArgs) =>
      dispatch(getFkSpectraTemplates(args))
        .then(unwrapResult)
        .catch(() => ({}) as FkTypes.FkSpectraTemplatesByStationByPhase),
    [dispatch]
  );
};

/**
 * Hook to set the current filter on Fk thumbnails
 *
 * @returns a callback to set the current filter on Fk thumbnails
 */

export const useSetCurrentFkThumbnailFilter = () => {
  const dispatch = useAppDispatch();

  return React.useCallback(
    (currentFkThumbnailFilter: FkThumbnailsFilterType) => {
      dispatch(fksActions.setCurrentFkThumbnailFilter(currentFkThumbnailFilter));
    },
    [dispatch]
  );
};

/**
 * Hook to set the current Displayed Signal Detection
 *
 * @returns a callback to set the current Displayed Signal Detection
 */

export const useSetDisplayedSignalDetectionId = () => {
  const dispatch = useAppDispatch();
  const displayedSignalDetectionId = useAppSelector(selectDisplayedSignalDetectionId);
  return React.useCallback(
    (signalDetectionId: string) => {
      // Revert the currently displayed FK (computeFk) before switching
      dispatch(revertFk({ signalDetectionId: displayedSignalDetectionId }));
      // Set measured values to undefined since we are changing displayed SDs
      dispatch(fksActions.setSignalDetectionMeasuredValue(undefined));
      // Set new signal detection id
      dispatch(fksActions.setDisplayedSignalDetectionId(signalDetectionId));
    },
    [dispatch, displayedSignalDetectionId]
  );
};

/**
 * @returns FkStationTypeConfigurations retrieved from the analyst configuration
 */
export const useFkStationTypeConfigurations = () => {
  const maybeFkStationTypeConfigs =
    useProcessingAnalystConfiguration().fkConfigurations.fkStationTypeConfigurations;

  return React.useMemo(() => {
    return maybeFkStationTypeConfigs ?? ({} as FkStationTypeConfigurations);
  }, [maybeFkStationTypeConfigs]);
};

/**
 * Hook that checks if FK beam is in an accepted state. In order to have been
 * accepted:
 * 1.) The signalDetection._uiFkBeamChannelSegmentDescriptorId and
 *     arrivalTime's measuredChannelSegment.id need to match
 * @returns boolean if FK beam is accepted
 */
export const useIsFkBeamAccepted = () => {
  return React.useCallback((signalDetection: SignalDetectionTypes.SignalDetection): boolean => {
    if (!signalDetection) return false;

    const currentSdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
      signalDetection.signalDetectionHypotheses
    );
    const arrivalTimeFeatureMeasurement =
      SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

    // If not set nothing to accept
    let arrivalTimeChannelSegmentIsAccepted = !signalDetection._uiFkBeamChannelSegmentDescriptorId;

    // If no arrival FM measuredChannelSegment then no arrival time segment
    if (
      arrivalTimeFeatureMeasurement &&
      arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id &&
      signalDetection._uiFkBeamChannelSegmentDescriptorId
    ) {
      const arrivalTimeChannelSegmentIdString = ChannelSegmentTypes.Util.createChannelSegmentString(
        arrivalTimeFeatureMeasurement.analysisWaveform?.waveform.id
      );
      arrivalTimeChannelSegmentIsAccepted = isEqual(
        ChannelSegmentTypes.Util.createChannelSegmentString(
          signalDetection._uiFkBeamChannelSegmentDescriptorId
        ),
        arrivalTimeChannelSegmentIdString
      );
    }
    return arrivalTimeChannelSegmentIsAccepted;
  }, []);
};

/**
 * Hook that checks if signal detection is in an accepted state. In order to have been
 * accepted:
 * 1.) The signalDetection._uiFkChannelSegmentDescriptorId and
 *     azimuth's measuredChannelSegment.id match
 * 2.) The FK measured values in redux (if defined) must match
 *     the signal detection's measured values or be undefined
 * @returns boolean if signal detection is in an accepted state
 */
export const useIsFkAccepted = () => {
  const fkMeasuredValues = useAppSelector(selectSignalDetectionMeasuredValues);
  return React.useCallback(
    (signalDetection: SignalDetectionTypes.SignalDetection): boolean => {
      if (!signalDetection) return false;
      // Get the azimuth feature measurement to check measuredChannelSegment.id
      // against signal detection's _uiFkChannelSegmentDescriptorId
      const sdMeasuredValues =
        SignalDetectionTypes.Util.getAzimuthAndSlownessFromSD(signalDetection);

      const noMeasuredValuesToUpdate =
        !fkMeasuredValues ||
        signalDetection.id !== fkMeasuredValues.signalDetectionId ||
        isEqual(fkMeasuredValues.measuredValues, sdMeasuredValues);

      const currentSdHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      );
      const azimuthFeatureMeasurement = SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(
        currentSdHypothesis.featureMeasurements
      );

      let azimuthChannelSegmentIsAccepted = !signalDetection._uiFkChannelSegmentDescriptorId; // If not set nothing to set
      // If no azimuth FM measuredChannelSegment then no FK entry
      if (
        azimuthFeatureMeasurement &&
        azimuthFeatureMeasurement.analysisWaveform?.waveform.id &&
        signalDetection._uiFkChannelSegmentDescriptorId
      ) {
        const azimuthChannelSegmentIdString = ChannelSegmentTypes.Util.createChannelSegmentString(
          azimuthFeatureMeasurement.analysisWaveform?.waveform.id
        );
        azimuthChannelSegmentIsAccepted = isEqual(
          ChannelSegmentTypes.Util.createChannelSegmentString(
            signalDetection._uiFkChannelSegmentDescriptorId
          ),
          azimuthChannelSegmentIdString
        );
      }
      return azimuthChannelSegmentIsAccepted && noMeasuredValuesToUpdate;
    },
    [fkMeasuredValues]
  );
};

/**
 * Finds the Fk Channel Segment using the Azimuth Feature Measurement
 *
 * @param sd Signal Detection used to look up associated FK
 *
 * @returns FkChannelSegment or undefined if not found
 */
export const useGetFkChannelSegment = () => {
  const fkChannelSegments = useAppSelector(selectFkChannelSegments);
  const isAccepted = useIsFkAccepted();
  return React.useCallback(
    (sd: SignalDetectionTypes.SignalDetection | undefined) => {
      if (!sd) {
        return undefined;
      }

      if (!isAccepted(sd) && sd._uiFkChannelSegmentDescriptorId) {
        return fkChannelSegments[
          ChannelSegmentTypes.Util.createChannelSegmentString(sd._uiFkChannelSegmentDescriptorId)
        ];
      }

      const { featureMeasurements } = SignalDetectionTypes.Util.getCurrentHypothesis(
        sd.signalDetectionHypotheses
      );
      const azimuthFm =
        SignalDetectionTypes.Util.findAzimuthFeatureMeasurement(featureMeasurements);

      // Find the corresponding ChannelSegment using ChannelSegmentDescriptor
      if (azimuthFm?.measuredChannelSegment?.id) {
        const azimuthMeasurementId = ChannelSegmentTypes.Util.createChannelSegmentString(
          azimuthFm.measuredChannelSegment.id
        );
        return fkChannelSegments[azimuthMeasurementId];
      }
      return undefined;
    },
    [fkChannelSegments, isAccepted]
  );
};

/**
 * Finds Fk Spectra timeseries
 *
 * @param sd Signal Detection
 *
 * @returns FkData or undefined if not found
 */
export const useGetFkData = () => {
  const getFkChannelSegment = useGetFkChannelSegment();
  return React.useCallback(
    (sd: SignalDetectionTypes.SignalDetection | undefined) => {
      return getFkChannelSegment(sd)?.timeseries[0];
    },
    [getFkChannelSegment]
  );
};

/**
 * Hook to find peak FK Attributes in a FK Spectra thru wasm
 *
 * @returns Callable function
 */
export const useGetPeakFkAttributes = () => {
  return React.useCallback(
    async (fkSpectra: FkTypes.FkSpectraCOI): Promise<FkTypes.FkAttributes> => {
      return getPeakFkAttributesApi(fkSpectra);
    },
    []
  );
};

/**
 * Hook that returns a FkTypes.FkSpectraTemplatesByStationByPhase
 *
 * @returns Callback function
 */
export const useGetFkSpectraTemplate = () => {
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const fkSpectraTemplates: FkTypes.FkSpectraTemplatesByStationByPhase =
    useAppSelector(selectFkSpectraTemplates);
  const getMissingFkSpectraTemplates = useGetMissingFkSpectraTemplates();
  return React.useCallback(
    async (
      signalDetection: SignalDetectionTypes.SignalDetection
    ): Promise<FkSpectraTemplate | undefined> => {
      // Find the station for this SD to get get the contributing channels
      const station = stationsQuery.data?.find(sta => sta.name === signalDetection.station.name);

      const currentHypothesis = SignalDetectionTypes.Util.getCurrentHypothesis(
        signalDetection.signalDetectionHypotheses
      );

      if (station && currentHypothesis) {
        const signalDetectionPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
          currentHypothesis.featureMeasurements
        )?.value;
        if (signalDetectionPhase) {
          // Need to use station and phase to get fk spectra template
          if (
            fkSpectraTemplates[station.name] &&
            fkSpectraTemplates[station.name][signalDetectionPhase]
          ) {
            return fkSpectraTemplates[station.name][signalDetectionPhase];
          }
          // If missing request template
          const stationVersionRef = {
            name: station.name,
            effectiveAt: station.effectiveAt
          };
          const missingTemplateRecord = await getMissingFkSpectraTemplates({
            stations: [stationVersionRef],
            phases: [signalDetectionPhase]
          });
          if (
            missingTemplateRecord &&
            missingTemplateRecord[station.name] &&
            missingTemplateRecord[station.name][signalDetectionPhase]
          ) {
            return missingTemplateRecord[station.name][signalDetectionPhase];
          }
        }
      }
      return undefined;
    },
    [fkSpectraTemplates, getMissingFkSpectraTemplates, stationsQuery.data]
  );
};

/**
 * Hook to compute the FK and thumbnails
 * @deprecated Need to remove once computeFk wasm is implemented
 * @returns Callable function
 */
export const useLegacyComputeFk = () => {
  const dispatch = useAppDispatch();
  const getFkData = useGetFkData();
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);
  const fkStationTypeConfigurations = useFkStationTypeConfigurations();

  return React.useCallback(
    async (
      updatedFkConfiguration: FkTypes.FkSpectraTemplate,
      signalDetection: SignalDetectionTypes.SignalDetection
    ) => {
      if (!stationsQuery.data) {
        throw new Error(`Unable to compute FK, no station data available`);
      }

      if (!fkStationTypeConfigurations) {
        throw new Error(`Unable to compute FK, no FK station type configuration available`);
      }

      const fk = getFkData(signalDetection);
      const osdFkInput = createComputeFkInput(signalDetection, fk, updatedFkConfiguration, false);
      if (!osdFkInput) {
        throw new Error(`Failed to create Fk Request for Signal Detection ${signalDetection.id}`);
      }

      await dispatch(computeLegacyFkSpectra(osdFkInput)).catch(err =>
        logger.error(`Failed to compute FK spectra: ${err.message}`)
      );

      // Create thumbnail request
      const thumbnailFkInput = createComputeFkInput(
        signalDetection,
        fk,
        updatedFkConfiguration,
        true
      );
      await queryFkFrequencyThumbnails(
        thumbnailFkInput,
        signalDetection,
        stationsQuery.data,
        fkStationTypeConfigurations,
        dispatch
      ).catch(err => logger.error(`Failed to compute FK thumbnails: ${err.message}`));
    },
    [dispatch, fkStationTypeConfigurations, getFkData, stationsQuery.data]
  );
};

/**
 * Hook to compute FK Previews through wasm
 *
 * @returns Callable function
 */
export function useCreateFkPreviews(): (params: CreateFKPreviewsUserInput) => Promise<void> {
  const dispatch = useAppDispatch();
  const fkStationTypeConfigurations = useFkStationTypeConfigurations();
  const getPeakFkAttributes = useGetPeakFkAttributes();

  return React.useCallback(
    async function createFkPreviews(
      params: CreateFKPreviewsUserInput,
      computePreviews: boolean = true
    ) {
      const {
        inputChannels,
        station,
        detectionTime,
        fkSpectraDefinition,
        uiChannelSegmentsForProcessingMasks,
        expandedTimeBufferSeconds,
        maskTaperDefinition,
        processingMasksByChannel,
        signalDetectionId,
        fkSpectraTemplate
      } = params;
      if (!computePreviews) return;
      if (!fkStationTypeConfigurations) {
        throw new Error(`Unable to create FK Preview, no FK station type configuration available`);
      }
      const startTime = detectionTime - fkSpectraDefinition.fkParameters.fkSpectrumWindow.lead;
      const endTime = startTime + fkSpectraDefinition.fkParameters.fkSpectrumWindow.duration;
      const halfSampleRate =
        fkSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz / 2;
      let filteredFrequencyBands: FkTypes.FkFrequencyRangeWithPrefilter[] =
        fkStationTypeConfigurations[`${station.type}`].frequencyBands;
      filteredFrequencyBands = filteredFrequencyBands.filter(
        band => band.highFrequencyHz <= halfSampleRate
      );

      const promises = filteredFrequencyBands.map(
        async (fb: FkTypes.FkFrequencyRangeWithPrefilter) => {
          const fkThumbnail = await computeFkApi({
            fkSpectraDefinition: {
              ...fkSpectraDefinition,
              fkParameters: {
                ...fkSpectraDefinition.fkParameters,
                fkFrequencyRange: {
                  lowFrequencyHz: fb.lowFrequencyHz,
                  highFrequencyHz: fb.highFrequencyHz
                },
                preFilter: fb.previewPreFilterDefinition
              }
            },
            detectionTime,
            startTime,
            endTime,
            station,
            inputChannels,
            uiChannelSegments: uiChannelSegmentsForProcessingMasks,
            processingMasksByChannel,
            maskTaperDefinition,
            expandedTimeBufferSeconds
          });
          const peakFkAttributes = await getPeakFkAttributes(fkThumbnail.timeseries[0]);
          const fkSpectra = updateFkMetadata(
            fkThumbnail.timeseries[0],
            fkSpectraTemplate,
            peakFkAttributes
          );
          dispatch(
            updateFkThumbnail({
              fkSpectra,
              signalDetectionId
            })
          );
          return fkThumbnail;
        }
      );
      await Promise.all(promises);
    },
    [dispatch, fkStationTypeConfigurations, getPeakFkAttributes]
  );
}

/**
 * Hook to compute the FK through wasm call
 *
 * @returns Callable function
 */
export const useComputeFk = () => {
  const dispatch = useAppDispatch();
  const getPeakFkAttributes = useGetPeakFkAttributes();

  return React.useCallback(
    async function computeFk(
      params: ComputeFkParams
    ): Promise<ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectraCOI>> {
      const {
        fkSpectraTemplate,
        signalDetection,
        fkSpectraDefinition,
        detectionTime,
        startTime,
        endTime,
        station,
        inputChannels,
        uiChannelSegmentsForProcessingMasks,
        processingMasksByChannel,
        maskTaperDefinition,
        expandedTimeBufferSeconds
      } = params;
      const fkChannelSegmentCOI: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectraCOI> =
        await computeFkApi({
          fkSpectraDefinition,
          detectionTime,
          startTime,
          endTime,
          station,
          inputChannels,
          uiChannelSegments: uiChannelSegmentsForProcessingMasks,
          processingMasksByChannel,
          maskTaperDefinition,
          expandedTimeBufferSeconds
        });

      if (fkChannelSegmentCOI.timeseries.length > 1) {
        logger.warn("ComputeFk returned multiple FK's");
      }
      const peakFkAttributes = await getPeakFkAttributes(fkChannelSegmentCOI.timeseries[0]);
      const fkSpectra: FkTypes.FkSpectra = updateFkMetadata(
        fkChannelSegmentCOI.timeseries[0],
        fkSpectraTemplate,
        peakFkAttributes
      );

      const fkChannelSegment: ChannelSegmentTypes.ChannelSegment<FkTypes.FkSpectra> = {
        ...fkChannelSegmentCOI,
        timeseries: [fkSpectra]
      };

      dispatch(
        updateFk({
          fkChannelSegment,
          signalDetectionId: signalDetection.id
        })
      );

      return fkChannelSegment;
    },
    [dispatch, getPeakFkAttributes]
  );
};

/**
 * TODO: This will need to be adjusted once computeFkSpectra is handled through WASM
 * Determines the status of FK queries 'computeFkSpectra' and 'getFkSpectraTemplates'.
 *
 * Possible statuses include one or both queries are still pending, no FK spectra template
 * available for the given signal detection's station, incorrect phase or station type for
 * the given signal detection, or a general network issue.
 *
 * @returns FkQueryStatus enum value
 */
export const useGetFkQueryStatus = () => {
  const { phasesWithoutPredictions } = useProcessingAnalystConfiguration();

  const getFkSpectraTemplatesHistory = useAppSelector(
    state => state.data.queries.getFkSpectraTemplates
  );

  // Get fully-populated station object from the signal detection
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);

  const fkSpectraTemplates: FkTypes.FkSpectraTemplatesByStationByPhase =
    useAppSelector(selectFkSpectraTemplates);

  const computeFkSpectraHistory = useAppSelector(state => state.data.queries.computeFkSpectra);

  return React.useCallback(
    (
      signalDetection: SignalDetectionTypes.SignalDetection | undefined
    ): FkQueryStatus | undefined => {
      if (!signalDetection) return undefined;

      const station = ArrayUtil.findOrThrow(
        stationsQuery.data ?? [],
        sta => sta.name === signalDetection.station.name
      );

      const signalDetectionPhase = SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(
        SignalDetectionTypes.Util.getCurrentHypothesis(signalDetection.signalDetectionHypotheses)
          .featureMeasurements
      )?.value;

      // Look up fkSpectraTemplate for this SD's station and phase
      let fkSpectraTemplate: FkTypes.FkSpectraTemplate | undefined;
      if (
        fkSpectraTemplates[station.name] &&
        fkSpectraTemplates[station.name][signalDetectionPhase]
      ) {
        fkSpectraTemplate = fkSpectraTemplates[station.name][signalDetectionPhase];
      }

      // Re-build the computeFkSpectra args to use as a lookup key
      const computeFkSpectraArgs = createComputeFkInput(
        signalDetection,
        undefined,
        fkSpectraTemplate,
        false
      );
      const computeFkSpectraRequestString = createRequestString(
        computeFkSpectraArgs ?? ({} as FkTypes.FkInputWithConfiguration)
      );

      const computeFkSpectraRequest:
        | Record<string, AsyncFetchHistoryEntry<FkTypes.FkInputWithConfiguration>>
        | undefined = computeFkSpectraHistory[computeFkSpectraRequestString];

      const fkSpectraTemplatesArgs: GetFkSpectraTemplatesQueryArgs = {
        stations: [station],
        phases: [signalDetectionPhase]
      };

      const fkSpectraTemplateRequest:
        | Record<string, AsyncFetchHistoryEntry<GetFkSpectraTemplatesQueryArgs>>
        | undefined =
        getFkSpectraTemplatesHistory[fkSpectraTemplatesQuery.idGenerator(fkSpectraTemplatesArgs)];

      // Query is pending
      if (
        // assuming that undefined history objects === PENDING because the request hasn't been added to redux yet
        !computeFkSpectraRequest ||
        !fkSpectraTemplateRequest ||
        requestIsPending(computeFkSpectraRequest, computeFkSpectraArgs) ||
        requestIsPending(fkSpectraTemplateRequest, fkSpectraTemplatesArgs)
      ) {
        return FkQueryStatus.PENDING_QUERY;
      }

      // If queries aren't pending and there's still no template then this is a true missing template
      if (!fkSpectraTemplate) {
        return FkQueryStatus.NO_TEMPLATE;
      }

      // If this fails it means the query was rejected. Determine why
      if (!hasBeenRejected(computeFkSpectraRequest, computeFkSpectraArgs))
        return FkQueryStatus.SUCCESS;

      // Invalid phase
      if (phasesWithoutPredictions?.includes(signalDetectionPhase))
        return FkQueryStatus.INVALID_PHASE;

      // Invalid station
      if (
        station?.type !== StationTypes.StationType.HYDROACOUSTIC_ARRAY &&
        station?.type !== StationTypes.StationType.INFRASOUND_ARRAY &&
        station?.type !== StationTypes.StationType.SEISMIC_ARRAY
      ) {
        return FkQueryStatus.INVALID_STATION_TYPE;
      }

      // If phase and station type ARE VALID then conclude it must be network issues
      return FkQueryStatus.NETWORK_FAILURE;
    },
    [
      computeFkSpectraHistory,
      fkSpectraTemplates,
      getFkSpectraTemplatesHistory,
      phasesWithoutPredictions,
      stationsQuery.data
    ]
  );
};

/**
 * Hook to mark Fk as reviewed
 *
 * @returns a callback that requires SignalDetection to mark reviewed. Will return true
 * if successful, otherwise false.
 */
export const useMarkFkReviewed = () => {
  const dispatch = useAppDispatch();
  const getFkChannelSegment = useGetFkChannelSegment();
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  const reviewablePhases: FkTypes.FkReviewablePhasesByStation =
    useFkReviewablePhasesByActivityNameQuery(openActivityNames[0]);

  return React.useCallback(
    (sd: SignalDetectionTypes.SignalDetection) => {
      const fkChannelSegment = getFkChannelSegment(sd);
      if (!fkChannelSegment) return false;

      // mark as reviewed if Fk has not been reviewed yet and
      // the station/phase is reviewable
      const fkNeedsReview = FkTypes.Util.fkNeedsReview(
        fkChannelSegment.timeseries[0],
        reviewablePhases[sd.station.name],
        sd
      );

      if (fkNeedsReview) {
        dispatch(markFkReviewed({ channelSegmentDescriptor: fkChannelSegment.id }));
        return true;
      }
      return false;
    },
    [dispatch, getFkChannelSegment, reviewablePhases]
  );
};

/**
 * Hook that sets azimuth and slowness values for a Signal Detection
 */
export const useSetFkMeasuredValues = () => {
  const dispatch = useAppDispatch();
  const stations = useAllStations();
  // const getStationRawUnfilteredUiChannelSegments = useGetStationRawUnfilteredUiChannelSegments();
  // const createFkBeam = useCreateFkBeam();
  // const getFkData = useGetFkData();

  return React.useCallback(
    (
      signalDetection: SignalDetectionTypes.SignalDetection,
      measuredValues: FkTypes.AzimuthSlownessValues
    ) => {
      const station = stations.find(stat => stat.name === signalDetection.station.name);
      if (!station) throw new Error(`Could not find station ${signalDetection.station.name}`);
      // const fkSpectra: FkTypes.FkSpectra | undefined = getFkData(signalDetection);
      dispatch(
        fksActions.setSignalDetectionMeasuredValue({
          signalDetectionId: signalDetection.id,
          measuredValues
        })
      );

      // if (fkSpectra) {
      //   // Fetch all channel segments for station, convert to record for faster lookups
      //   getStationRawUnfilteredUiChannelSegments(station)
      //     .then(stationUiChannelSegments => {
      //       const uiChannelSegments = Object.values(stationUiChannelSegments)
      //         .map(uiCSList => (uiCSList.length > 0 ? mergeUiChannelSegments(uiCSList) : undefined))
      //         .filter(notEmpty);
      //       return uiChannelSegments;
      //     })
      //     .then(async uiChannelSegments =>
      //       createFkBeam(
      //         signalDetection,
      //         measuredValues,
      //         station,
      //         fkSpectra.configuration.inputChannels,
      //         uiChannelSegments
      //       )
      //     )
      //     .catch(e => {
      //       throw new Error(e);
      //     });
      // }
    },
    [dispatch, stations]
  );
};

/**
 * Hook that returns azimuth and slowness values for the displayed signal detection,
 * if the last FkMeasuredValue was set for the currently displayed signal detection, and
 * the requested signal detection also matches. This helps the FK thumbnails not to have to track
 * if they are the displayed FK.
 * @returns Azimuth/Slowness measured values or undefined
 */
export const useGetDisplayedFkMeasuredValues = () => {
  const fkMeasuredValues = useAppSelector(selectSignalDetectionMeasuredValues);
  const signalDetectionId = useAppSelector(selectDisplayedSignalDetectionId);
  return React.useCallback(
    (requestedSignalDetectionId: string): FkTypes.AzimuthSlownessValues | undefined => {
      return fkMeasuredValues?.signalDetectionId === signalDetectionId &&
        fkMeasuredValues?.signalDetectionId === requestedSignalDetectionId
        ? fkMeasuredValues.measuredValues
        : undefined;
    },
    [fkMeasuredValues, signalDetectionId]
  );
};

/**
 * Hook that returns azimuth and slowness values for a signal detection from ui-state record or SD
 * if not in ui-state. To retrieve from ui-state the signal detection must be the displayed signal
 * detection and was the last measured value set from the FK main display.
 * @returns Azimuth/Slowness measured values or undefined
 */
export const useGetFkMeasuredValues = () => {
  const getDisplayedFkMeasuredValues = useGetDisplayedFkMeasuredValues();
  return React.useCallback(
    (
      signalDetection: SignalDetectionTypes.SignalDetection
    ): FkTypes.AzimuthSlownessValues | undefined => {
      const measuredValues = getDisplayedFkMeasuredValues(signalDetection.id);
      if (measuredValues) {
        return measuredValues;
      }
      return SignalDetectionTypes.Util.getAzimuthAndSlownessFromSD(signalDetection);
    },
    [getDisplayedFkMeasuredValues]
  );
};

export const useComputeFkAndBeam = () => {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const stations = useAllStations();
  const getStationRawUnfilteredUiChannelSegments = useGetStationRawUnfilteredUiChannelSegments();
  const populatedChannels = useChannels();
  const createProcessingMasks = useCreateProcessingMasksFromChannelSegment();
  const computeFk = useComputeFk();
  const createFkPreviews = useCreateFkPreviews();
  const createFkBeam = useCreateFkBeam();
  const { expandedTimeBuffer } = useProcessingAnalystConfiguration().beamforming;
  const isArrayStation = (stationType: StationTypes.StationType): boolean =>
    stationType === StationTypes.StationType.HYDROACOUSTIC_ARRAY ||
    stationType === StationTypes.StationType.INFRASOUND_ARRAY ||
    stationType === StationTypes.StationType.SEISMIC_ARRAY;
  const getOrientationAngles = (inputChannels: ChannelTypes.Channel[]) => {
    const orientationAngles: ChannelTypes.OrientationAngles[] = [];
    inputChannels.forEach(channel => {
      if (channel.orientationAngles) orientationAngles.push(channel.orientationAngles);
    });

    // Removes possible undefined values
    const horizontalAngleDeg = mean(
      orientationAngles.map(o => o.horizontalAngleDeg).filter(notEmpty)
    );
    const verticalAngleDeg = mean(orientationAngles.map(o => o.verticalAngleDeg).filter(notEmpty));
    return { horizontalAngleDeg, verticalAngleDeg };
  };

  return React.useCallback(
    async (
      signalDetection: SignalDetectionTypes.SignalDetection,
      fkSpectraTemplate: FkTypes.FkSpectraTemplate
    ) => {
      const station = stations.find(stat => stat.name === signalDetection.station.name);
      if (!station) throw new Error(`Could not find station ${signalDetection.station.name}`);
      if (!isArrayStation(station.type)) {
        toast('Failed to compute FK. FKs can only be computed for array stations.');
      }
      const inputChannelNames = fkSpectraTemplate.inputChannels.map(channel => channel.name);
      const populatedInputChannels = populatedChannels.filter(inputChannel =>
        inputChannelNames.includes(inputChannel.name)
      );
      const filteredInputChannelsByPriority = inputChannelsByPrioritization(
        populatedInputChannels,
        processingAnalystConfiguration.beamAndFkInputChannelPrioritization,
        fkSpectraTemplate.fkSpectraParameters.minimumWaveformsForSpectra
      );
      if (
        filteredInputChannelsByPriority.length <
        fkSpectraTemplate.fkSpectraParameters.minimumWaveformsForSpectra
      ) {
        toast.error(`There was a problem with configuration for station ${station.name}`, {
          toastId: signalDetection.id
        });
        logger.error(`Unable to compute FK Spectra for station ${station.name} due to a configuration issue. Input channels within the FK Spectra
        template do not meet the minimum waveform criteria to compute a FK.`);
        return;
      }
      const orientationAngles = getOrientationAngles(filteredInputChannelsByPriority);
      const fkSpectraDefinition: FkTypes.FkSpectraDefinition = {
        fkParameters: {
          ...fkSpectraTemplate.fkSpectraParameters
        },
        orientationAngles
      };
      const detectionTime =
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementUsingSignalDetection(
          signalDetection
        ).measurementValue.arrivalTime.value;

      const startTime = detectionTime - fkSpectraTemplate.fkSpectraWindow.lead;
      const endTime = startTime + fkSpectraTemplate.fkSpectraWindow.duration;

      validateChannels(
        {
          sampleRateHz: fkSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
          sampleRateToleranceHz:
            fkSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateToleranceHz,
          orientationAngles: fkSpectraDefinition.orientationAngles,
          orientationAngleToleranceDeg:
            fkSpectraDefinition.fkParameters.orientationAngleToleranceDeg
        },
        filteredInputChannelsByPriority,
        station.name
      );

      // Fetch all channel segments for station, convert to record for faster lookups
      const stationUiChannelSegments = await getStationRawUnfilteredUiChannelSegments(station);
      const uiChannelSegments = Object.values(stationUiChannelSegments)
        .map(uiCSList => (uiCSList.length > 0 ? mergeUiChannelSegments(uiCSList) : undefined))
        .filter(notEmpty);

      // Get corresponding UiChannelSegments for each inputChannel
      const uiChannelSegmentsForProcessingMasks: UiChannelSegment<WaveformTypes.Waveform>[] = [];
      filteredInputChannelsByPriority.forEach(channel => {
        const inputChannelSegment = uiChannelSegments.find(
          uiCS => uiCS.channelSegmentDescriptor.channel.name === channel.name
        );

        // Combine all the timeseries in a single channel segment
        if (inputChannelSegment) {
          // Add the single entry for this channel
          uiChannelSegmentsForProcessingMasks.push(inputChannelSegment);
        }
      });

      // This causes a race condition when it's set inside an async, crap
      let maskTaperDefinition: ProcessingMaskDefinitionTypes.TaperDefinition | undefined;
      const processingMasksByChannel: {
        channel: ChannelTypes.Channel;
        processingMasks: ChannelSegmentTypes.ProcessingMask[];
      }[] = [];

      // Create processing masks
      const procMaskPromises = uiChannelSegmentsForProcessingMasks.map(async uiChannelSegment => {
        return createProcessingMasks(
          uiChannelSegment,
          ChannelSegmentTypes.ProcessingOperation.FK_SPECTRA,
          fkSpectraDefinition.fkParameters.phase
        );
      });
      const channelsWithProcMasks = await Promise.all(procMaskPromises);

      // Find taperDefinition, re-organize into a record of channel: ProcessingMask[]
      channelsWithProcMasks.forEach(chanProcMask => {
        if (!maskTaperDefinition) {
          maskTaperDefinition = (
            chanProcMask.channel
              .processingDefinition as ProcessingMaskDefinitionTypes.ProcessingMaskDefinition
          )?.taperDefinition;
        }
        processingMasksByChannel.push({
          channel: chanProcMask.channel,
          processingMasks: chanProcMask.processingMasks
        });
      });

      computeFk({
        fkSpectraDefinition,
        fkSpectraTemplate,
        station,
        inputChannels: filteredInputChannelsByPriority,
        detectionTime,
        startTime,
        endTime,
        signalDetection,
        expandedTimeBufferSeconds: expandedTimeBuffer,
        maskTaperDefinition,
        processingMasksByChannel,
        uiChannelSegmentsForProcessingMasks
      })
        .then(async result => {
          const measuredValues: FkTypes.AzimuthSlownessValues = {
            azimuth: result?.timeseries[0]?.peakFkAttributes?.receiverToSourceAzimuth.value ?? 0,
            slowness: result?.timeseries[0]?.peakFkAttributes?.slowness.value ?? 0
          };
          await createFkBeam(
            signalDetection,
            measuredValues,
            station,
            filteredInputChannelsByPriority,
            uiChannelSegments
          );
        })
        .catch(e => {
          throw new Error(e);
        });
      await createFkPreviews({
        detectionTime,
        expandedTimeBufferSeconds: expandedTimeBuffer,
        fkSpectraDefinition,
        fkSpectraTemplate,
        inputChannels: filteredInputChannelsByPriority,
        maskTaperDefinition,
        processingMasksByChannel,
        signalDetectionId: signalDetection.id,
        station,
        uiChannelSegmentsForProcessingMasks
      });
    },
    [
      computeFk,
      createFkBeam,
      createFkPreviews,
      createProcessingMasks,
      expandedTimeBuffer,
      getStationRawUnfilteredUiChannelSegments,
      populatedChannels,
      processingAnalystConfiguration.beamAndFkInputChannelPrioritization,
      stations
    ]
  );
};
