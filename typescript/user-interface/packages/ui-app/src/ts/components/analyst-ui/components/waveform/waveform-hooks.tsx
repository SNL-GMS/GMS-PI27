import type { ChannelSegmentTypes, EventTypes, StationTypes } from '@gms/common-model';
import { ChannelTypes, SignalDetectionTypes } from '@gms/common-model';
import type { FeaturePrediction } from '@gms/common-model/lib/event';
import {
  findPreferredEventHypothesisByOpenStageOrDefaultStage,
  findPreferredLocationSolution
} from '@gms/common-model/lib/event';
import { getFilterName, UNFILTERED } from '@gms/common-model/lib/filter';
import { isArrivalTimeMeasurementValue } from '@gms/common-model/lib/signal-detection/util';
import { Timer } from '@gms/common-util';
import type { CheckboxSearchListTypes } from '@gms/ui-core-components';
import { HotkeyTooltip } from '@gms/ui-core-components';
import type {
  AnalystWaveformTypes,
  ChannelFilterRecord,
  QcSegmentFetchResult,
  SignalDetectionFetchResult,
  StationQuery
} from '@gms/ui-state';
import {
  analystActions,
  AnalystWaveformUtil,
  prepareReceiverCollection,
  selectOpenEvent,
  selectOpenIntervalName,
  selectSelectedWaveforms,
  useAppDispatch,
  useAppSelector,
  useEffectiveTime,
  useGetAllStationsQuery,
  useGetEvents,
  useGetSignalDetections,
  useGetVisibleStationsFromStationList,
  useKeyboardShortcutConfigurations,
  usePhaseLists,
  usePredictFeaturesForEventLocation,
  usePredictFeaturesForEventLocationFunction,
  useProcessingAnalystConfiguration,
  useQcSegments,
  useRawChannels,
  useRawChannelsVersionReference,
  useRotate2dForChannels,
  useRotate2dForSignalDetections,
  useRotate2dForStations,
  useStationsVisibility,
  useViewableInterval,
  useVisibleChannelSegments,
  useZoomInterval,
  waveformActions
} from '@gms/ui-state';
import type { PredictFeatures } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import type { WaveformSortType } from '@gms/ui-state/lib/app/state/analyst/types';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { selectChannelFilters } from '@gms/ui-state/lib/app/state/waveform/selectors';
import type { WeavessTypes } from '@gms/weavess-core';
import type { WeavessInstance } from '@gms/weavess-core/lib/types';
import { produce } from 'immer';
import isEqual from 'lodash/isEqual';
import * as React from 'react';
import { batch } from 'react-redux';
import { toast } from 'react-toastify';

import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import { getDistanceToStationsForPreferredLocationSolutionId } from '~analyst-ui/common/utils/event-util';
import { formatHotkeysForOs } from '~common-ui/components/keyboard-shortcuts/keyboard-shortcuts-util';

import {
  useGetRotationTemplatesForDialog,
  useInitialRotationDialogState
} from './components/waveform-controls/rotation-dialog/rotation-dialog-hooks';
import { rotationLogger } from './components/waveform-controls/rotation-dialog/rotation-dialog-util';
import {
  useGetStationPhaseConfig,
  validateRotationSettingsOnSubmit
} from './components/waveform-controls/rotation-dialog/rotation-error-handling';
import type { RotationDialogState } from './components/waveform-controls/rotation-dialog/types';
import type { PhaseHotkey, WaveformDisplayProps } from './types';
import {
  calculateOffsetsObservedPhase,
  calculateOffsetsPredictedPhase,
  getSortedFilteredDefaultStations,
  getStationNameFromChannelName,
  setFocusToWaveformDisplay,
  sortProcessingStations
} from './utils';

/**
 * Takes checkbox items and a station visibility map and returns a function that can update redux when a checkbox is clicked
 *
 * @param checkboxItemsList list of check boxed items
 * @param stationsVisibility station visibility map from redux
 * @returns a function for changing stationsVisibility for on clicking a checkbox on station dropdown
 */
export const useStationsVisibilityFromCheckboxState = (
  checkboxItemsList: CheckboxSearchListTypes.CheckboxItem[]
): ((
  getUpdatedCheckboxItemsList: (
    previousList: CheckboxSearchListTypes.CheckboxItem[]
  ) => CheckboxSearchListTypes.CheckboxItem[]
) => void) => {
  const { stationsVisibility } = useStationsVisibility();
  const dispatch = useAppDispatch();

  return React.useCallback(
    (
      getUpdatedCheckboxItemsList: (
        previousList: CheckboxSearchListTypes.CheckboxItem[]
      ) => CheckboxSearchListTypes.CheckboxItem[]
    ) => {
      const updatedCheckboxItemsList = getUpdatedCheckboxItemsList(checkboxItemsList);
      const newStationsVisibility = produce(stationsVisibility, draft =>
        updatedCheckboxItemsList
          // filter to the checkbox items that we changed
          .filter(checkBoxItem => {
            const previousVersionCheckBoxItem = checkboxItemsList.find(
              item => item.name === checkBoxItem.name
            );
            if (previousVersionCheckBoxItem.checked !== checkBoxItem.checked) {
              return true;
            }
            return false;
          })
          .forEach(checkBoxItem => {
            const stationVisibilityObject: AnalystWaveformTypes.StationVisibilityChanges =
              draft[checkBoxItem.name] ??
              AnalystWaveformUtil.newStationVisibilityChangesObject(
                checkBoxItem.name,
                checkBoxItem.checked
              );
            stationVisibilityObject.visibility = checkBoxItem.checked;
            draft[checkBoxItem.name] = stationVisibilityObject;
          })
      );
      dispatch(waveformActions.setStationsVisibility(newStationsVisibility));
    },
    [checkboxItemsList, dispatch, stationsVisibility]
  );
};

/**
 * If a current interval is not open, then this will query for 'nowish.' Otherwise, query for the
 * effective time from the current interval.
 *
 * @returns the list of all station definitions from the query for all stations
 */
export const useWaveformStations = (): StationQuery => {
  // We should hit a non-ideal state because there is no current interval if we fetch 'nowish'.
  // This prevents us from caching stations effectiveAt a time of `null` (1970),
  // which would just use memory for no reason. Querying for the same effective time as other
  // displays, however, will result in a cache hit.
  const effectiveAt = useEffectiveTime();
  return useGetAllStationsQuery(effectiveAt);
};

/**
 * Creates a function to be called when weavess mounts
 * Note, this will cause update when the weavess zoom interval renders.
 *
 * @returns a function to be called when weavess mounts.
 */
export const useOnWeavessMount = (
  setWeavessInstance: React.Dispatch<React.SetStateAction<WeavessInstance>>
) => {
  const [zoomInterval] = useZoomInterval();
  // To avoid capturing the value, we store it in a ref so we
  // can pass down a referentially stable function
  // that does not cause renders when zoomInterval changes
  // which, in this case, we don't want, since we're just
  // trying to provide a function that is called once, when
  // WEAVESS mounts
  const zoomIntervalRef = React.useRef(zoomInterval);
  zoomIntervalRef.current = zoomInterval;

  const onWeavessUnmount = React.useCallback(() => {
    setWeavessInstance(undefined);
  }, [setWeavessInstance]);

  React.useEffect(() => {
    // Call unmount when this component unmounts
    return onWeavessUnmount;
  }, [onWeavessUnmount]);

  return {
    onWeavessMount: React.useCallback(
      (weavess: WeavessTypes.WeavessInstance) => {
        setWeavessInstance(weavess);
        if (weavess?.waveformPanelRef) {
          weavess?.waveformPanelRef.zoomToTimeWindow(zoomIntervalRef.current);
        }
      },
      [setWeavessInstance]
    ),
    onWeavessUnmount
  };
};

/**
 * Helper method to reduce cognitive complexity
 * calculates offsets
 */
const calculateOffsetsFunction = (
  alignWaveformsOn: AlignWaveformsOn,
  currentOpenEventId: string,
  eventResultData: EventTypes.Event[],
  featurePredictionQueryData: PredictFeatures,
  phaseToAlignOn: string,
  signalDetectionsQueryData: SignalDetectionTypes.SignalDetection[],
  sortedVisibleStations: StationTypes.Station[],
  stations: StationTypes.Station[],
  openIntervalName: string
) => {
  if (alignWaveformsOn === AlignWaveformsOn.OBSERVED_PHASE) {
    return calculateOffsetsObservedPhase(
      signalDetectionsQueryData || [],
      featurePredictionQueryData.receiverLocationsByName,
      sortedVisibleStations[0].name,
      eventResultData,
      currentOpenEventId,
      phaseToAlignOn,
      stations,
      openIntervalName
    );
  }
  if (alignWaveformsOn === AlignWaveformsOn.PREDICTED_PHASE) {
    return calculateOffsetsPredictedPhase(
      featurePredictionQueryData.receiverLocationsByName,
      sortedVisibleStations[0].name,
      phaseToAlignOn,
      stations
    );
  }
  return null;
};

/**
 * helper hook to build the calculate offsets function props
 * @returns
 */
export const useCalculateOffsets = (): ((
  eventId: string,
  phaseToAlignOn: string,
  alignWaveformsOn: string,
  selectedSortType: WaveformSortType,
  featurePredictions: PredictFeatures
) => Record<string, number>) => {
  const openIntervalName = useAppSelector(selectOpenIntervalName);

  // Query Dependencies
  const eventResult = useGetEvents();
  const signalDetectionsQuery = useGetSignalDetections();
  const stations = useWaveformStations();
  const getVisibleStationsFromStationList = useGetVisibleStationsFromStationList();

  const rawChannels = useRawChannels();

  const emptyOffsets = React.useRef({});

  return React.useCallback(
    (
      currentOpenEventId: string,
      phaseToAlignOn: string,
      alignWaveformsOn: AlignWaveformsOn,
      selectedSortType: WaveformSortType,
      featurePredictions: PredictFeatures
    ) => {
      if (Object.values(featurePredictions?.receiverLocationsByName || {}).length > 0) {
        const distances = getDistanceToStationsForPreferredLocationSolutionId(
          eventResult.data.find(event => event.id === currentOpenEventId),
          stations.data,
          openIntervalName,
          rawChannels
        );

        const sortedStations = sortProcessingStations(stations.data, selectedSortType, distances);
        const sortedVisibleStations = getVisibleStationsFromStationList(sortedStations);

        if (sortedVisibleStations !== undefined && sortedVisibleStations.length > 0) {
          return (
            calculateOffsetsFunction(
              alignWaveformsOn,
              currentOpenEventId,
              eventResult.data,
              featurePredictions,
              phaseToAlignOn,
              signalDetectionsQuery.data,
              sortedVisibleStations,
              stations.data,
              openIntervalName
            ) || emptyOffsets.current
          );
        }
      }
      return emptyOffsets.current;
    },
    [
      eventResult.data,
      stations.data,
      openIntervalName,
      signalDetectionsQuery.data,
      rawChannels,
      getVisibleStationsFromStationList
    ]
  );
};

/**
 * Calculates the number of seconds each channel and station waveform is offset from the base station
 *
 * @returns a record of offsets with key: station/channel name value: offset in seconds
 */
export const useWaveformOffsets = (): Record<string, number> => {
  // Redux dependencies
  const alignWaveformsOn = useAppSelector(state => state.app.analyst.alignWaveformsOn);
  const phaseToAlignOn = useAppSelector(state => state.app.analyst.phaseToAlignOn);
  const selectedSortType = useAppSelector(state => state.app.analyst.selectedSortType);
  const currentOpenEventId = useAppSelector(state => state.app.analyst.openEventId);

  const phaseToAlignOnArray = React.useMemo(() => [phaseToAlignOn], [phaseToAlignOn]);
  const featurePredictions = usePredictFeaturesForEventLocation(phaseToAlignOnArray).data;

  const calculateOffsets = useCalculateOffsets();

  return React.useMemo(() => {
    return calculateOffsets(
      currentOpenEventId,
      phaseToAlignOn,
      alignWaveformsOn,
      selectedSortType,
      featurePredictions
    );
  }, [
    calculateOffsets,
    currentOpenEventId,
    phaseToAlignOn,
    alignWaveformsOn,
    selectedSortType,
    featurePredictions
  ]);
};

export const useUpdateWaveformAlignment: () => (
  phase: string,
  alignWaveformsOn: AlignWaveformsOn,
  shouldShowPredictedPhases: boolean,
  waveformProps: WaveformDisplayProps
) => void = () => {
  const predictFeatures = usePredictFeaturesForEventLocationFunction();
  const openEvent = useAppSelector(selectOpenEvent);
  const openIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);
  const dispatch = useAppDispatch();
  const [zoomInterval] = useZoomInterval();
  const getVisibleStationsFromStationList = useGetVisibleStationsFromStationList();

  return React.useCallback(
    async (
      phase: string,
      alignWaveformsOn: AlignWaveformsOn,
      shouldShowPredictedPhases: boolean,
      waveformProps: WaveformDisplayProps
    ) => {
      batch(() => {
        dispatch(analystActions.setAlignWaveformsOn(alignWaveformsOn));
        dispatch(analystActions.setPhaseToAlignOn(phase));
        dispatch(waveformActions.setShouldShowPredictedPhases(shouldShowPredictedPhases));
      });

      if (alignWaveformsOn === AlignWaveformsOn.PREDICTED_PHASE) {
        const preferredHypothesis = findPreferredEventHypothesisByOpenStageOrDefaultStage(
          openEvent,
          openIntervalName
        );

        const preferredLocationSolution = findPreferredLocationSolution(
          preferredHypothesis?.id.hypothesisId,
          openEvent.eventHypotheses
        );

        const station = getVisibleStationsFromStationList(
          getSortedFilteredDefaultStations(waveformProps)
        )[0];
        await predictFeatures({
          receivers: prepareReceiverCollection(null, [station]),
          sourceLocation: preferredLocationSolution.location,
          phases: [phase]
        }).then(fpResult => {
          const featurePrediction: FeaturePrediction = fpResult?.receiverLocationsByName[
            station.name
          ]?.featurePredictions.find(
            fp =>
              fp.phase === phase &&
              fp.predictionType === SignalDetectionTypes.FeatureMeasurementType.ARRIVAL_TIME
          );

          const range = (zoomInterval.endTimeSecs - zoomInterval.startTimeSecs) / 2;

          if (
            featurePrediction &&
            isArrivalTimeMeasurementValue(featurePrediction.predictionValue.predictedValue)
          ) {
            const baseTime = featurePrediction.predictionValue.predictedValue.arrivalTime.value;

            dispatch(
              waveformActions.setZoomInterval({
                startTimeSecs: baseTime - range,
                endTimeSecs: baseTime + range
              })
            );
          } else {
            toast.warn(`Failed to load feature predictions for phase ${phase}. Cannot align.`, {
              toastId: `toast-failed-to-load-feature-predictions`
            });
          }
        });
      }
    },
    [
      dispatch,
      getVisibleStationsFromStationList,
      openEvent,
      openIntervalName,
      predictFeatures,
      zoomInterval.endTimeSecs,
      zoomInterval.startTimeSecs
    ]
  );
};

/**
 * Filters the signal detections in the current viewable interval down to only ones visible accounting for offset
 *
 * @param isSyncedToWaveformDisplay if the list should be filtered, if false the filtering is bypassed
 * @returns an array of filtered signal detections
 */
export const useVisibleSignalDetections = (
  isSyncedToWaveformDisplay: boolean
): SignalDetectionFetchResult => {
  const offsets = useWaveformOffsets();
  const [zoomInterval] = useZoomInterval();
  const signalDetections = useGetSignalDetections();

  return React.useMemo(() => {
    Timer.start(`[Waveform Hooks]: Build filtered SD List`);
    const filteredDetections = [];
    // if either zoomInterval or offsets are undefined/null dont filter
    // if not synced don't filter
    if (signalDetections.isLoading || !isSyncedToWaveformDisplay || !zoomInterval) {
      Timer.end(`[Waveform Hooks]: Build filtered SD List`);

      return signalDetections;
    }

    signalDetections.data.forEach(sd => {
      const channelName = SignalDetectionUtils.getSignalDetectionChannelName(sd);
      let receiverName = sd.station.name;
      const beamType = ChannelTypes.Util.parseWaveformChannelType(channelName);
      if (beamType === 'Raw channel') {
        receiverName = channelName;
      }

      const offset = offsets[receiverName] || 0;
      const arrivalTimeFeatureMeasurementValue =
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
          SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses)
            .featureMeasurements
        );

      if (
        arrivalTimeFeatureMeasurementValue?.arrivalTime?.value >=
          zoomInterval.startTimeSecs - offset &&
        arrivalTimeFeatureMeasurementValue.arrivalTime.value <= zoomInterval.endTimeSecs - offset
      ) {
        filteredDetections.push(sd);
      }
    });
    Timer.end(`[Waveform Hooks]: Build filtered SD List`);

    // Keep the query meta data
    return produce(signalDetections, draft => {
      draft.data = filteredDetections;
    });
  }, [isSyncedToWaveformDisplay, offsets, signalDetections, zoomInterval]);
};

/**
 * Helper hook to to get the mask visibility record
 *
 * @returns mask visibility record
 */
export const useMaskVisibility = (): Record<string, boolean> => {
  const maskVisibility = useAppSelector(state => state.app.waveform.maskVisibility);
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();

  // start with the mask default visibility and add any changes in redux state
  return React.useMemo(
    () => ({
      ...processingAnalystConfiguration.qcMaskTypeVisibilities,
      ...maskVisibility
    }),
    [maskVisibility, processingAnalystConfiguration]
  );
};

/**
 * Helper hook to set up the params and request the masks for the waveform display
 *
 * @returns qc masks record
 */
export const useQcMasksForWaveformDisplay = (): QcSegmentFetchResult => {
  const [viewableInterval] = useViewableInterval();
  const channelVersionReferences = useRawChannelsVersionReference();

  const args = React.useMemo(
    () => ({
      startTime: viewableInterval?.startTimeSecs,
      endTime: viewableInterval?.endTimeSecs,
      channels: channelVersionReferences
    }),
    [channelVersionReferences, viewableInterval]
  );
  return useQcSegments(args);
};

/**
 * Hook to obtain a single processing mask from UI channel segments in Redux
 * for the waveform display
 * Produces empty object if 0 or >1 signal detections selected
 *
 * @param signalDetectionResults signal detection query results
 * @returns
 */
export const useProcessingMasksForWaveformDisplay = (): ChannelSegmentTypes.ProcessingMask[] => {
  const uiChannelSegments = useVisibleChannelSegments();
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const channelFilters: ChannelFilterRecord = useAppSelector(selectChannelFilters);
  const emptyMaskArray = React.useRef<ChannelSegmentTypes.ProcessingMask[]>([]);

  return React.useMemo(() => {
    if (selectedWaveforms.length === 1 && Object.keys(uiChannelSegments).length > 0) {
      const stationName = getStationNameFromChannelName(selectedWaveforms[0].channel.name);
      const filterName = getFilterName(channelFilters?.[stationName], UNFILTERED);
      const waveformSelectedUIChannelSegment = uiChannelSegments?.[stationName]?.[filterName]?.find(
        cs =>
          isEqual(
            cs.channelSegment?._uiConfiguredInput || cs.channelSegmentDescriptor,
            selectedWaveforms[0]
          )
      );
      return waveformSelectedUIChannelSegment?.channelSegment?.maskedBy || emptyMaskArray.current;
    }
    return emptyMaskArray.current;
  }, [channelFilters, selectedWaveforms, uiChannelSegments]);
};

export const useGetPhaseHotkeys = (): PhaseHotkey[] => {
  const currentPhase = useAppSelector(state => state.app.analyst.currentPhase);
  const phaseLists = usePhaseLists();
  const keyboardShortcutConfigurations = useKeyboardShortcutConfigurations();
  return React.useMemo(() => {
    const defaultPhaseLabelAssignment =
      phaseLists?.length > 0 ? phaseLists[0].defaultPhaseLabelAssignment : null;
    const currentPhaseHotkey: PhaseHotkey = {
      hotkey: `${formatHotkeysForOs(
        keyboardShortcutConfigurations?.hotkeys?.currentPhaseLabel?.combos[0]
      )}`,
      phase: currentPhase,
      tooltip: (
        <HotkeyTooltip
          info="Current Phase"
          hotkey={formatHotkeysForOs(
            keyboardShortcutConfigurations?.hotkeys?.currentPhaseLabel?.combos[0]
          )}
        />
      )
    };
    const defaultPhaseHotkey: PhaseHotkey = {
      hotkey: `${formatHotkeysForOs(
        keyboardShortcutConfigurations?.hotkeys?.defaultPhaseLabel?.combos[0]
      )}`,
      phase: defaultPhaseLabelAssignment,
      tooltip: (
        <HotkeyTooltip
          info="Default Phase"
          hotkey={formatHotkeysForOs(
            keyboardShortcutConfigurations?.hotkeys?.defaultPhaseLabel?.combos[0]
          )}
        />
      )
    };
    return [currentPhaseHotkey, defaultPhaseHotkey];
  }, [
    currentPhase,
    keyboardShortcutConfigurations?.hotkeys?.currentPhaseLabel?.combos,
    keyboardShortcutConfigurations?.hotkeys?.defaultPhaseLabel?.combos,
    phaseLists
  ]);
};

/**
 * TODO: actually call to rotate in the handler
 * TODO: actually validate selection and only open the dialog if at a warning or danger level
 *
 * @returns an object containing the following
 *   isRotationDialogVisible: whether the dialog is visible
 *   setRotationDialogVisibility: a setter for setting the dialog visibility
 *   handleRotationClose: a handler which is called when the rotation dialog should close. This closes the dialog, and calls to rotate.
 *   rotate: a function to rotate, which pops up the dialog if the user's selection is not clear or invalid
 */
export const useRotation = () => {
  const [isRotationDialogVisible, setRotationDialogVisibility] = React.useState(false);
  const getRotationTemplates = useGetRotationTemplatesForDialog();

  const handleRotationClose = React.useCallback(() => {
    setRotationDialogVisibility(false);
    setFocusToWaveformDisplay();
  }, [setRotationDialogVisibility]);
  const initialState = useInitialRotationDialogState();

  const setRotationDialogVisibilityAndFetchRotationTemplates = React.useCallback(
    (dialogVisibility: boolean) => {
      setRotationDialogVisibility(dialogVisibility);
      if (dialogVisibility) {
        getRotationTemplates(
          initialState.inputMode,
          initialState.targetStations,
          initialState.targetSignalDetections,
          initialState.rotationPhase,
          rotationLogger
        ).catch(rotationLogger.error);
      }
    },
    [getRotationTemplates, initialState]
  );

  const [viewableInterval] = useViewableInterval();
  const openEvent = useAppSelector(selectOpenEvent);
  const getStationPhaseConfig = useGetStationPhaseConfig();
  const rotate2dForStations = useRotate2dForStations();
  const rotate2dForSignalDetections = useRotate2dForSignalDetections();
  const rotate2dForChannels = useRotate2dForChannels();

  const rotate = React.useCallback(
    async (maybeOverrideState?: RotationDialogState) => {
      const rotationDialogInputs = maybeOverrideState?.isRotationDialogState
        ? maybeOverrideState
        : initialState;
      const validateRotationInputs = validateRotationSettingsOnSubmit(
        viewableInterval,
        openEvent,
        getStationPhaseConfig
      );

      const location =
        rotationDialogInputs.steeringMode === 'reference-location'
          ? {
              latitudeDegrees: parseFloat(rotationDialogInputs.latitude),
              longitudeDegrees: parseFloat(rotationDialogInputs.longitude),
              // Given we only perform 2d rotations, elevation and depth are set to 0
              elevationKm: 0,
              depthKm: 0
            }
          : undefined;
      const azimuth =
        rotationDialogInputs.steeringMode !== 'reference-location'
          ? parseFloat(rotationDialogInputs.azimuth)
          : undefined;

      if (validateRotationInputs(rotationDialogInputs)?.length) {
        // deal with errors by opening the dialog
        setRotationDialogVisibilityAndFetchRotationTemplates(true);
      } else if (rotationDialogInputs?.targetSignalDetections?.length > 0) {
        rotate2dForSignalDetections(rotationDialogInputs.targetSignalDetections).catch(
          rotationLogger.error
        );
      } else if (rotationDialogInputs?.targetChannels?.length === 2) {
        // Selected stations are used as input to the rotate2dForStations operation
        await rotate2dForChannels(
          [rotationDialogInputs.targetChannels[0], rotationDialogInputs.targetChannels[1]],
          rotationDialogInputs.rotationPhase,
          undefined,
          parseFloat(rotationDialogInputs.leadSecs),
          parseFloat(rotationDialogInputs.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
      } else if (rotationDialogInputs?.targetStations?.length > 0) {
        // Selected stations are used as input to the rotate2dForStations operation
        rotate2dForStations(
          rotationDialogInputs.targetStations,
          rotationDialogInputs.rotationPhase,
          undefined,
          parseFloat(rotationDialogInputs.leadSecs),
          parseFloat(rotationDialogInputs.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
      } else {
        // All visible loaded stations within the Waveform Display with channels configured for rotation for
        // current event & default phase are used as input to the rotate2dForStations operation
        rotate2dForStations(
          rotationDialogInputs.validStations,
          rotationDialogInputs.rotationPhase,
          undefined,
          parseFloat(rotationDialogInputs.leadSecs),
          parseFloat(rotationDialogInputs.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
      }
    },
    [
      getStationPhaseConfig,
      initialState,
      openEvent,
      rotate2dForChannels,
      rotate2dForSignalDetections,
      rotate2dForStations,
      setRotationDialogVisibilityAndFetchRotationTemplates,
      viewableInterval
    ]
  );

  return {
    isRotationDialogVisible,
    setRotationDialogVisibility: setRotationDialogVisibilityAndFetchRotationTemplates,
    handleRotationCancel: handleRotationClose, // this may need to diverge, but they are the same for now
    handleRotationClose,
    initialRotationState: initialState,
    rotate
  };
};
