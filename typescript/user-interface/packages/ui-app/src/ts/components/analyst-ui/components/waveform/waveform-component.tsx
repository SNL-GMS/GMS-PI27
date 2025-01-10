/* eslint-disable react/destructuring-assignment */
import { Endpoints, type EventTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import {
  memoizedLocationToEventAzimuth,
  memoizedLocationToEventDistance
} from '@gms/common-model/lib/event/util';
import { capitalizeFirstLetters } from '@gms/common-util';
import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import { nonIdealStateWithError, WithNonIdealStates } from '@gms/ui-core-components';
import type { EventsFetchResult, SignalDetectionFetchResult } from '@gms/ui-state';
import {
  selectCurrentPhase,
  selectDefaultPhase,
  selectWorkflowIntervalUniqueId,
  useAppSelector,
  useBaseStationTime,
  useBeamformingTemplatesForEvent,
  useCacheChannelSegmentsByChannels,
  useChannelFilters,
  useChannelHeight,
  useChannels,
  useCreatePreconfiguredEventBeams,
  useCreateSignalDetection,
  useEffectiveTime,
  useFilterQueue,
  useGetChannelSegments,
  useGetEvents,
  useGetProcessingStationGroupNamesConfigurationQuery,
  useGetRotationTemplatesForVisibleStationsAndFavoritePhases,
  useGetSignalDetections,
  useGetStationGroupsByNamesQuery,
  useGetVisibleStationsFromStationList,
  useKeyboardShortcutConfigurationsWithValidation,
  useLoadData,
  useMaximumOffset,
  useMinimumOffset,
  usePredictFeaturesForEventLocation,
  useProcessingAnalystConfiguration,
  useSelectedWaveforms,
  useSetSignalDetectionActionTargets,
  useShouldShowPredictedPhases,
  useShouldShowTimeUncertainty,
  useSplitStation,
  useStationsVisibility,
  useUiTheme,
  useUpdateSignalDetectionPhase,
  useViewableInterval,
  useZoomInterval
} from '@gms/ui-state';
import type { WeavessInstance } from '@gms/weavess-core/lib/types';
import React from 'react';

import { CreateEventDialog } from '~analyst-ui/common/dialogs/create-event/create-event-dialog';
import {
  useCloseCreateEventDialog,
  useCloseCurrentPhaseMenu,
  useClosePhaseMenu,
  useCreateSignalDetectionPhaseSelectorProps,
  usePhaseSelectorCallback,
  useSelectedPhases
} from '~analyst-ui/common/dialogs/phase-selector/phase-hooks';
import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';
import type { CreateEventMenuState } from '~analyst-ui/common/menus/create-event-menu-item';
import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import {
  STATUS_CODE_404,
  STATUS_CODE_503
} from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { getDistanceToStationsForPreferredLocationSolutionId } from '~analyst-ui/common/utils/event-util';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import { useSetCurrentPhase } from './components/waveform-controls/current-phase-control';
import { EventBeamDialog } from './components/waveform-controls/event-beam-dialog/event-beam-dialog';
import { RotationDialog } from './components/waveform-controls/rotation-dialog/rotation-dialog';
import type { WaveformComponentProps, WaveformDisplayProps } from './types';
import { useWeavessHotkeys } from './utils';
import {
  useGetPhaseHotkeys,
  useOnWeavessMount,
  useRotation,
  useUpdateWaveformAlignment,
  useWaveformStations
} from './waveform-hooks';
import { WaveformPanel } from './waveform-panel';
import type { WeavessContextData } from './weavess-context';
import { WeavessContext } from './weavess-context';
import { useWeavessStationUtilWrapper } from './weavess-stations-util-wrapper';

interface WaveformNonIdealStateProps
  extends Omit<WaveformDisplayProps, 'signalDetections' | 'events'> {
  signalDetectionResults: SignalDetectionFetchResult;
  eventResults: EventsFetchResult;
}

const waveformEventsNonIdealStateDefinitions: NonIdealStateDefinition<
  {
    eventResults: EventsFetchResult;
  },
  { events: EventTypes.Event[] }
>[] = [
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      const errors = props.eventResults?.error?.map(e => e.code).join(';') ?? '';
      return (
        props.eventResults?.isError &&
        (errors.includes(STATUS_CODE_404) || errors.includes(STATUS_CODE_503))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.EventManagerUrls.getEventsWithDetectionsAndSegmentsByTime.friendlyName
      )} Service`
    ),
    converter: (props: { eventResults: EventsFetchResult }): { events: EventTypes.Event[] } => {
      return {
        ...props,
        events: props.eventResults.data
      };
    }
  },
  {
    condition: (props: { eventResults: EventsFetchResult }): boolean => {
      return props.eventResults.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading events'),
    converter: (props: { eventResults: EventsFetchResult }): { events: EventTypes.Event[] } => {
      return {
        ...props,
        events: props.eventResults.data
      };
    }
  }
];

const WaveformOrNonIdealState = WithNonIdealStates<
  WaveformNonIdealStateProps,
  WaveformDisplayProps
>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...AnalystNonIdealStates.timeRangeNonIdealStateDefinitions('waveforms', 'currentTimeInterval'),
    ...AnalystNonIdealStates.stationGroupQueryNonIdealStateDefinitions,
    ...AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions,
    ...AnalystNonIdealStates.signalDetectionsNonIdealStateDefinitions,
    ...AnalystNonIdealStates.waveformIntervalsNonIdealStateDefinitions,
    ...waveformEventsNonIdealStateDefinitions
  ],
  WaveformPanel,
  [...AnalystNonIdealStates.predictedPhasesNonIdealStateDefinitions]
);

export function WaveformComponent(props: WaveformComponentProps) {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const keyboardShortcuts = useKeyboardShortcutConfigurationsWithValidation();
  const weavessHotkeyDefinitions = useWeavessHotkeys(keyboardShortcuts);

  const effectiveTime = useEffectiveTime();
  const processingStationGroupNamesConfigurationQuery =
    useGetProcessingStationGroupNamesConfigurationQuery();
  const stationsGroupsByNamesQuery = useGetStationGroupsByNamesQuery({
    effectiveTime,
    stationGroupNames: processingStationGroupNamesConfigurationQuery?.data?.stationGroupNames
  });
  const stationDefResult = useWaveformStations();

  const [uiTheme] = useUiTheme();
  const [viewableInterval] = useViewableInterval();
  const [maximumOffset, setMaximumOffset] = useMaximumOffset();
  const [minimumOffset, setMinimumOffset] = useMinimumOffset();
  const [baseStationTime, setBaseStationTime] = useBaseStationTime();
  const [channelHeight, setChannelHeight] = useChannelHeight();
  const [zoomInterval, setZoomInterval] = useZoomInterval();
  const loadData = useLoadData();
  const signalDetectionPhaseUpdate = useUpdateSignalDetectionPhase();
  const stationsVisibilityProps = useStationsVisibility();
  const [shouldShowTimeUncertainty, setShouldShowTimeUncertainty] = useShouldShowTimeUncertainty();
  const [shouldShowPredictedPhases, setShouldShowPredictedPhases] = useShouldShowPredictedPhases();
  const [eventBeamDialogVisibility, setEventBeamDialogVisibility] = React.useState(false);

  const signalDetectionResults = useGetSignalDetections();
  const channelSegmentResults = useGetChannelSegments(viewableInterval);
  const [splitStation, setSplitStation] = useSplitStation();
  useGetRotationTemplatesForVisibleStationsAndFavoritePhases();

  // Hook that builds the weavess stations
  const weavessStations = useWeavessStationUtilWrapper();

  // start pre caching all channel segments
  useCacheChannelSegmentsByChannels(viewableInterval);

  const eventResults = useGetEvents();
  const setCurrentPhase = useSetCurrentPhase();
  const currentPhase = useAppSelector(selectCurrentPhase);
  const defaultSignalDetectionPhase = useAppSelector(selectDefaultPhase);
  const phaseHotkeys = useGetPhaseHotkeys();
  const setSignalDetectionActionTargets = useSetSignalDetectionActionTargets();
  const createSignalDetection = useCreateSignalDetection();
  // TODO: calling event beamforming templates to verify, remove later
  useBeamformingTemplatesForEvent();
  const [, updateSelectedWaveforms] = useSelectedWaveforms();

  // Use state rather than a ref because we want things to rerender when this updates.
  const [weavessInstance, setWeavessInstance] = React.useState<WeavessInstance>();
  const [createEventMenuState, setCreateEventMenuState] = React.useState<CreateEventMenuState>({
    visibility: false
  });
  const [phaseMenuVisibility, setPhaseMenuVisibility] = React.useState(false);
  const [currentPhaseMenuVisibility, setCurrentPhaseMenuVisibility] = React.useState(false);
  const [clickedSdId, setClickedSdId] = React.useState(null as string);

  React.useEffect(() => {
    memoizedLocationToEventDistance.cache.clear();
    memoizedLocationToEventAzimuth.cache.clear();
  }, [props.currentOpenEventId]);

  const populatedChannels = useChannels();

  const currentOpenEvent = eventResults.data?.find(event => event.id === props.currentOpenEventId);
  const distances = React.useMemo(() => {
    return getDistanceToStationsForPreferredLocationSolutionId(
      currentOpenEvent,
      stationDefResult.data,
      props.currentStageName,
      populatedChannels
    );
  }, [currentOpenEvent, populatedChannels, props.currentStageName, stationDefResult.data]);

  const phaseToAlignOn = React.useMemo(() => [props.phaseToAlignOn], [props.phaseToAlignOn]);
  const featurePredictionQuery = usePredictFeaturesForEventLocation(phaseToAlignOn);

  const weavessContextValue = React.useMemo<WeavessContextData>(
    () => ({
      weavessRef: weavessInstance,
      setWeavessRef: setWeavessInstance
    }),
    [weavessInstance]
  );

  const { onWeavessMount, onWeavessUnmount } = useOnWeavessMount(setWeavessInstance);
  const channelFilters = useChannelFilters();

  useFilterQueue(channelFilters);

  const workflowIntervalUniqueId = useAppSelector(selectWorkflowIntervalUniqueId);

  const {
    isRotationDialogVisible,
    setRotationDialogVisibility,
    handleRotationCancel,
    handleRotationClose,
    initialRotationState,
    rotate
  } = useRotation();

  const createPreconfiguredEventBeams = useCreatePreconfiguredEventBeams();

  const currentPhaseArray = React.useMemo(() => [currentPhase], [currentPhase]);
  const beamformingTemplates = useBeamformingTemplatesForEvent(currentPhaseArray);

  const closeCreateEventDialog = useCloseCreateEventDialog(setCreateEventMenuState);
  const closeCurrentPhaseMenu = useCloseCurrentPhaseMenu(setCurrentPhaseMenuVisibility);
  const closePhaseMenu = useClosePhaseMenu(setPhaseMenuVisibility, setSignalDetectionActionTargets);
  const createSignalDetectionPhaseSelectorProps = useCreateSignalDetectionPhaseSelectorProps();
  const selectedPhases = useSelectedPhases(
    signalDetectionResults,
    clickedSdId,
    props.selectedSdIds
  );
  const phaseSelectorCallback = usePhaseSelectorCallback(
    clickedSdId,
    props.selectedSdIds,
    signalDetectionPhaseUpdate
  );

  const updateWaveformAlignment = useUpdateWaveformAlignment();

  return (
    <BaseDisplay
      key={workflowIntervalUniqueId}
      tabName={IanDisplays.WAVEFORM}
      glContainer={props.glContainer}
      className="waveform-display-window gms-body-text"
      data-cy="waveform-display-window"
    >
      <WeavessContext.Provider value={weavessContextValue}>
        <WaveformOrNonIdealState
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          isStationVisible={stationsVisibilityProps.isStationVisible}
          setStationExpanded={stationsVisibilityProps.setStationExpanded}
          setChannelVisibility={stationsVisibilityProps.setChannelVisibility}
          setStationVisibility={stationsVisibilityProps.setStationVisibility}
          showAllChannels={stationsVisibilityProps.showAllChannels}
          baseStationTime={baseStationTime}
          channelSegments={channelSegmentResults.data}
          clickedSdId={clickedSdId}
          createEventMenuState={createEventMenuState}
          createSignalDetection={createSignalDetection}
          currentPhase={currentPhase}
          currentPhaseMenuVisibility={currentPhaseMenuVisibility}
          defaultSignalDetectionPhase={defaultSignalDetectionPhase}
          distances={distances}
          eventResults={eventResults}
          featurePredictionQuery={featurePredictionQuery}
          keyboardShortcuts={keyboardShortcuts}
          maximumOffset={maximumOffset}
          minimumOffset={minimumOffset}
          onWeavessMount={onWeavessMount}
          onWeavessUnmount={onWeavessUnmount}
          loadData={loadData}
          phaseHotkeys={phaseHotkeys}
          phaseMenuVisibility={phaseMenuVisibility}
          populatedChannels={populatedChannels}
          processingAnalystConfiguration={processingAnalystConfiguration}
          setBaseStationTime={setBaseStationTime}
          setClickedSdId={setClickedSdId}
          // TODO remove after hoisting hotkeys
          setCreateEventMenuState={setCreateEventMenuState}
          // TODO remove after hoisting hotkeys
          setCurrentPhase={setCurrentPhase}
          // TODO remove after hoisting hotkeys
          setCurrentPhaseMenuVisibility={setCurrentPhaseMenuVisibility}
          setMaximumOffset={setMaximumOffset}
          setMinimumOffset={setMinimumOffset}
          setPhaseMenuVisibility={setPhaseMenuVisibility}
          showCreateSignalDetectionPhaseSelector={
            createSignalDetectionPhaseSelectorProps.openDialog
          }
          setShouldShowPredictedPhases={setShouldShowPredictedPhases}
          setShouldShowTimeUncertainty={setShouldShowTimeUncertainty}
          setSignalDetectionActionTargets={setSignalDetectionActionTargets}
          setZoomInterval={setZoomInterval}
          shouldShowPredictedPhases={shouldShowPredictedPhases}
          shouldShowTimeUncertainty={shouldShowTimeUncertainty}
          signalDetectionPhaseUpdate={signalDetectionPhaseUpdate}
          signalDetectionResults={signalDetectionResults}
          stationsQuery={stationDefResult}
          stationsGroupsByNamesQuery={stationsGroupsByNamesQuery}
          uiTheme={uiTheme}
          updateSelectedWaveforms={updateSelectedWaveforms}
          viewableInterval={viewableInterval}
          weavessHotkeyDefinitions={weavessHotkeyDefinitions}
          zoomInterval={zoomInterval}
          weavessStations={weavessStations}
          splitStation={splitStation}
          channelHeight={channelHeight}
          setChannelHeight={setChannelHeight}
          getVisibleStationsFromStationList={useGetVisibleStationsFromStationList()}
          setRotationDialogVisibility={setRotationDialogVisibility}
          setEventBeamDialogVisibility={setEventBeamDialogVisibility}
          rotate={rotate}
          setSplitStation={setSplitStation}
          createPreconfiguredEventBeams={createPreconfiguredEventBeams}
          beamformingTemplates={beamformingTemplates}
          updateWaveformAlignment={updateWaveformAlignment}
        >
          {isRotationDialogVisible ? (
            <RotationDialog
              initialRotationState={initialRotationState}
              onCloseCallback={handleRotationClose}
              onCancel={handleRotationCancel}
              rotationHotkeyConfig={keyboardShortcuts?.hotkeys.rotate}
            />
          ) : null}
          {eventBeamDialogVisibility ? (
            <EventBeamDialog
              // Making this key controlled effectively resets its internal state every time it is opened
              key={`event-beam-dialog-${eventBeamDialogVisibility ? 'open' : 'closed'}`}
              isEventBeamDialogVisible={eventBeamDialogVisibility}
              setEventBeamDialogVisibility={setEventBeamDialogVisibility}
            />
          ) : null}
          {createEventMenuState.visibility ? (
            <CreateEventDialog
              isOpen={createEventMenuState.visibility}
              onClose={closeCreateEventDialog}
            />
          ) : null}
          {phaseMenuVisibility ? (
            <PhaseSelectorDialog
              isOpen={phaseMenuVisibility}
              title="Set Phase"
              selectedPhases={selectedPhases}
              phaseSelectorCallback={phaseSelectorCallback}
              closeCallback={closePhaseMenu}
              hotkeyCombo={keyboardShortcuts?.hotkeys?.toggleSetPhaseMenu?.combos[0]}
            />
          ) : null}
          {currentPhaseMenuVisibility ? (
            <PhaseSelectorDialog
              isOpen={currentPhaseMenuVisibility}
              title="Current Phase"
              hotkeyCombo={keyboardShortcuts?.hotkeys?.toggleCurrentPhaseMenu?.combos[0]}
              phaseHotkeys={phaseHotkeys}
              selectedPhases={[currentPhase]}
              phaseSelectorCallback={setCurrentPhase}
              closeCallback={closeCurrentPhaseMenu}
            />
          ) : null}
          {createSignalDetectionPhaseSelectorProps.isOpen ? (
            <PhaseSelectorDialog
              isOpen={createSignalDetectionPhaseSelectorProps.isOpen}
              title="Select Phase for Signal Detection"
              hotkeyCombo={createSignalDetectionPhaseSelectorProps.hotkey.concat('+click')}
              phaseSelectorCallback={createSignalDetectionPhaseSelectorProps.callBack}
              closeCallback={createSignalDetectionPhaseSelectorProps.closeDialog}
            />
          ) : null}
        </WaveformOrNonIdealState>
      </WeavessContext.Provider>
    </BaseDisplay>
  );
}
