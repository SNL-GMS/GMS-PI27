import {
  Button,
  ButtonGroup,
  Dialog,
  DialogBody,
  DialogFooter,
  Icon,
  Intent,
  Radio,
  RadioGroup
} from '@blueprintjs/core';
import { TimePicker } from '@blueprintjs/datetime';
import { TimePrecision } from '@blueprintjs/datetime2';
import { IconNames } from '@blueprintjs/icons';
import type { ChannelTypes, FilterTypes } from '@gms/common-model';
import { StationTypes } from '@gms/common-model';
import { createChannelSegmentString } from '@gms/common-model/lib/channel-segment/util';
import { UNFILTERED_FILTER } from '@gms/common-model/lib/filter';
import {
  convertDateToUTCDate,
  SECONDS_IN_HOUR,
  SECONDS_IN_MINUTES,
  toDate
} from '@gms/common-util';
import { DialogTitle, FormContent, FormGroup, FormMessage } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import {
  addEventBeamsAndChannels,
  analystActions,
  getBeamformingTemplateForStation,
  reportBeamformingErrors,
  selectOpenEvent,
  selectOpenIntervalName,
  selectSelectedWaveforms,
  useAppDispatch,
  useAppSelector,
  useBeamformingTemplatesForEvent,
  useChannels,
  usePredictFeaturesForEventLocation,
  useProcessingAnalystConfiguration,
  useSelectedFilter,
  useSetSelectedWaveformsByChannelSegmentDescriptorIds,
  useSignalDetections,
  useVisibleStations
} from '@gms/ui-state';
import {
  consolidateSelectedStationsAndChannels,
  filterSelectedStationsAndChannelsForCreateEventBeams,
  useCreateEventBeams
} from '@gms/ui-state/lib/app/util/beamforming-util';
import React from 'react';

import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs/phase-selector/phase-selector-dialog';
import { ChannelSelector } from '~analyst-ui/common/forms/inputs/channel-selector';
import { StationSelector } from '~analyst-ui/common/forms/inputs/station-selector';
import { FormattedText } from '~analyst-ui/common/help-text/title-tooltip';
import { useGetWaveformsKeyboardShortcut } from '~analyst-ui/common/hotkey-configs/hooks';
import { setFocusToWaveformDisplay } from '~analyst-ui/components/waveform/utils';
import { HotkeyReminder } from '~common-ui/components/keyboard-shortcuts/hotkey-reminder';

import { FilterSelector } from '../../../../../common/forms/inputs/filter-selector';
import {
  useChannelSelections,
  useStationSelection
} from '../rotation-dialog/rotation-dialog-hooks';
import type { EventBeamValidationMessage } from './event-beam-utils';
import {
  eventBeamStationValidation,
  nonArrayStationValidation,
  validateEventBeamFPLoad,
  validateEventBeamTemplateLoad
} from './event-beam-utils';

const channelSelectorPlaceholders = {
  multipleStationsSelected: 'Multiple stations selected. Using default channels',
  invalidRowsSelected: 'Invalid selection. Using default channels',
  noneSelected: 'None selected. Using default channels'
} as const;
type ChannelSelectorPlaceholders =
  (typeof channelSelectorPlaceholders)[keyof typeof channelSelectorPlaceholders];

const emptyChannelIdList: string[] = [];

const useBuildChannelTag = (): ((channel: ChannelTypes.Channel) => string) => {
  const populatedChannels = useChannels();
  return React.useCallback(
    channel => {
      const fullyPopulatedChannel = populatedChannels.find(
        populatedChannel => populatedChannel.name === channel.name
      );
      const sampleRateStr = ` (${fullyPopulatedChannel.nominalSampleRateHz}hz)`;
      return `${channel.name}${sampleRateStr}`;
    },
    [populatedChannels]
  );
};

/**
 * The type of the props for the {@link EventBeamDialog} component
 */
export interface EventBeamDialogProps {
  isEventBeamDialogVisible: boolean;
  setEventBeamDialogVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * A dialog component for creating event beams with the user's desired settings
 */
export function EventBeamDialog({
  isEventBeamDialogVisible,
  setEventBeamDialogVisibility
}: Readonly<EventBeamDialogProps>) {
  const processingAnalystConfiguration = useProcessingAnalystConfiguration();
  const {
    createEventBeamsDescription,
    leadDuration,
    beamDuration,
    beamSummationMethods,
    interpolationMethods,
    defaultSummationMethod,
    defaultInterpolationMethod
  } = processingAnalystConfiguration.beamforming;

  const dispatch = useAppDispatch();
  const visibleStations = useVisibleStations();
  const signalDetections = useSignalDetections();
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const setSelectedWaveforms = useSetSelectedWaveformsByChannelSegmentDescriptorIds();

  const currentPhase = useAppSelector(state => state.app.analyst.currentPhase);
  const [phase, setPhase] = React.useState(currentPhase);
  const openIntervalName = useAppSelector(selectOpenIntervalName);
  const currentEvent = useAppSelector(selectOpenEvent);
  const defaultFilter = useSelectedFilter().selectedFilter;
  const { validStations, targetStations, selectStations } = useStationSelection(
    React.useCallback(
      station =>
        station.type === StationTypes.StationType.SEISMIC_ARRAY ||
        station.type === StationTypes.StationType.HYDROACOUSTIC_ARRAY ||
        station.type === StationTypes.StationType.INFRASOUND_ARRAY,
      []
    )
  );
  const { validChannels, targetChannels, selectChannels } = useChannelSelections(
    validStations,
    targetStations
  );

  const phaseArray = React.useMemo(() => [phase], [phase]);
  const featurePredictionsForEventLocation = usePredictFeaturesForEventLocation(phaseArray);

  const beamformingTemplates = useBeamformingTemplatesForEvent(phaseArray);
  const beamformingTemplate =
    targetChannels.length > 0
      ? getBeamformingTemplateForStation(
          beamformingTemplates.data,
          targetChannels[0].station,
          phase
        )
      : undefined;
  const buildChannelTag = useBuildChannelTag();

  const [isPhaseSelectorOpen, setPhaseSelectorOpen] = React.useState(false);
  const [coherency, setCoherency] = React.useState<string>(defaultSummationMethod);
  const [interpolation, setInterpolation] = React.useState<string>(defaultInterpolationMethod);
  const [selectedFilter, setSelectedFilter] = React.useState<FilterTypes.Filter>(defaultFilter);
  const [formMessage, setFormMessage] = React.useState<Message>();
  const [channelSelectorPlaceholderText, setChannelSelectorPlaceholderText] =
    React.useState<ChannelSelectorPlaceholders>(channelSelectorPlaceholders.noneSelected);
  const [leadDurationTime, setLeadDurationTime] = React.useState<Date>(
    convertDateToUTCDate(toDate(leadDuration))
  );
  const [beamDurationTime, setBeamDurationTime] = React.useState<Date>(
    convertDateToUTCDate(toDate(beamDuration))
  );

  const onCloseCallback = React.useCallback(() => {
    setCoherency(defaultSummationMethod);
    setInterpolation(defaultInterpolationMethod);
    setSelectedFilter(defaultFilter);
    setFormMessage(undefined);
    setChannelSelectorPlaceholderText(channelSelectorPlaceholders.noneSelected);
    setLeadDurationTime(convertDateToUTCDate(toDate(leadDuration)));
    setBeamDurationTime(convertDateToUTCDate(toDate(beamDuration)));
    setEventBeamDialogVisibility(false);
    setFocusToWaveformDisplay();
  }, [
    defaultSummationMethod,
    defaultInterpolationMethod,
    defaultFilter,
    leadDuration,
    beamDuration,
    setEventBeamDialogVisibility
  ]);

  const isChannelSelectorEnabled = React.useCallback(
    () => targetStations?.length === 1,
    [targetStations?.length]
  );

  const noStationsMessage = React.useMemo((): Message => {
    if (targetStations.length === 0 && targetChannels.length === 0) {
      return {
        summary: 'No stations selected',
        details: `Because no stations are selected, using all stations without ${phase}.`
      };
    }
    return null;
  }, [phase, targetChannels.length, targetStations.length]);

  const [stations, channels] = React.useMemo(
    () => consolidateSelectedStationsAndChannels(targetStations, targetChannels, visibleStations),
    [targetChannels, targetStations, visibleStations]
  );

  const nonArrayStationNamesAndError = React.useMemo(
    () => nonArrayStationValidation(targetStations),
    [targetStations]
  );

  const errorMessage = React.useMemo((): EventBeamValidationMessage => {
    if (!isEventBeamDialogVisible) return null; // No error if the dialog is not visible

    if (nonArrayStationNamesAndError) {
      return nonArrayStationNamesAndError[0];
    }

    const [, , , , message] = filterSelectedStationsAndChannelsForCreateEventBeams(
      targetStations,
      targetChannels,
      visibleStations,
      signalDetections,
      currentEvent,
      openIntervalName,
      phase
    );

    if (message) {
      return message;
    }

    return eventBeamStationValidation(stations, channels, phase, beamformingTemplates);
  }, [
    isEventBeamDialogVisible,
    nonArrayStationNamesAndError,
    targetStations,
    targetChannels,
    visibleStations,
    signalDetections,
    currentEvent,
    openIntervalName,
    phase,
    stations,
    channels,
    beamformingTemplates
  ]);

  const stationIntent = React.useCallback(
    (value: string): Intent => {
      return nonArrayStationNamesAndError?.[1].includes(value) ? errorMessage.intent : Intent.NONE;
    },
    [errorMessage, nonArrayStationNamesAndError]
  );

  const dataLoadMessage = React.useMemo((): EventBeamValidationMessage => {
    if (!isEventBeamDialogVisible) return null; // No error if the dialog is not visible

    const [filteredStations, filteredChannels] =
      filterSelectedStationsAndChannelsForCreateEventBeams(
        targetStations,
        targetChannels,
        visibleStations,
        signalDetections,
        currentEvent,
        openIntervalName,
        phase
      );

    const validEventBeamTemplateMessage = validateEventBeamTemplateLoad(
      beamformingTemplates,
      phase,
      filteredStations,
      filteredChannels
    );

    if (validEventBeamTemplateMessage) {
      return validEventBeamTemplateMessage;
    }

    const validEventBeamPredictionsMessage = validateEventBeamFPLoad(
      featurePredictionsForEventLocation,
      phase,
      filteredStations,
      filteredChannels
    );

    if (validEventBeamPredictionsMessage) {
      return validEventBeamPredictionsMessage;
    }

    return null;
  }, [
    isEventBeamDialogVisible,
    targetStations,
    targetChannels,
    visibleStations,
    signalDetections,
    currentEvent,
    openIntervalName,
    phase,
    beamformingTemplates,
    featurePredictionsForEventLocation
  ]);

  const convertToSeconds = (date: Date): number => {
    return (
      date.getHours() * SECONDS_IN_HOUR + date.getMinutes() * SECONDS_IN_MINUTES + date.getSeconds()
    );
  };

  const beamKeyboardShortcut = useGetWaveformsKeyboardShortcut()?.createEventBeam;
  const createEventBeams = useCreateEventBeams();

  return (
    <>
      <PhaseSelectorDialog
        isOpen={isPhaseSelectorOpen}
        title="Set Phase"
        selectedPhases={[phase]}
        phaseSelectorCallback={val => {
          setPhase(val[0]);
        }}
        closeCallback={() => setPhaseSelectorOpen(false)}
      />
      <Dialog
        isOpen={isEventBeamDialogVisible}
        enforceFocus={false}
        onClose={onCloseCallback}
        shouldReturnFocusOnClose
        title={
          <DialogTitle
            titleText="Create Event Beams"
            tooltipContent={
              <FormattedText
                textToFormat={createEventBeamsDescription}
                concatString={
                  beamformingTemplate ? beamformingTemplate.minWaveformsToBeam.toString() : 'N/A'
                }
              />
            }
          />
        }
        isCloseButtonShown
        canEscapeKeyClose
      >
        <DialogBody className="event-beam-dialog">
          <FormContent className="create-event-beam-settings">
            <StationSelector
              helperText="If none are selected, create beams for all loaded array stations without the selected phase"
              validStations={validStations}
              selectedStations={targetStations}
              onChange={selection => {
                selectStations(selection);
                selectChannels(emptyChannelIdList);
              }}
              intent={stationIntent}
              placeholder={`None selected. Using all stations without ${phase}.`}
            />
            <FormGroup
              helperText="If none are selected, use default configured channels for the selected station."
              label="Input Channels"
            >
              <ChannelSelector
                disabled={!isChannelSelectorEnabled()}
                intent={errorMessage?.intent || 'none'}
                validChannels={validChannels}
                buildChannelTag={buildChannelTag}
                placeholder={channelSelectorPlaceholderText}
                selectedChannels={targetChannels}
                onChange={selection => {
                  selectChannels(selection.map(channel => channel.name));
                }}
              />
            </FormGroup>
            <FormGroup
              helperText="Beam for this phase at the predicted time"
              label="Phase"
              labelInfo="(current phase)"
            >
              <Button
                id="beam-phase-name"
                disabled={formMessage?.intent === 'danger'}
                className="event-beam-dialog__current-phase"
                onClick={() => setPhaseSelectorOpen(true)}
                value={phase}
                rightIcon={<Icon icon={IconNames.SELECT} size={14} />}
                fill
                alignText="left"
              >
                <span>{phase}</span>
              </Button>
            </FormGroup>
            <FormGroup helperText="Lead time before the predicted phase" label="Lead time">
              {/* Year, month and day are ignored */}
              <TimePicker
                disabled={formMessage?.intent === 'danger'}
                precision={TimePrecision.SECOND}
                value={leadDurationTime}
                onChange={setLeadDurationTime}
              />
            </FormGroup>
            <FormGroup helperText="Duration of the event beam" label="Duration">
              {/* Year, month and day are ignored */}
              <TimePicker
                disabled={formMessage?.intent === 'danger'}
                precision={TimePrecision.SECOND}
                value={beamDurationTime}
                onChange={setBeamDurationTime}
              />
            </FormGroup>
            <FormGroup helperText="Filter to apply before beaming" label="Prefilter">
              <FilterSelector
                // TODO: enable preFilter after implementation of Wasm.BaseFilterDefinition
                disabled
                selectedFilter={UNFILTERED_FILTER}
                setSelectedFilter={setSelectedFilter}
              />
            </FormGroup>
            <FormGroup helperText="How to sum waveforms" label="Beam summation method">
              {Object.entries(beamSummationMethods).length > 1 ? (
                <RadioGroup
                  name="Beam summation method"
                  disabled={formMessage?.intent === 'danger'}
                  onChange={c => {
                    setCoherency(c.currentTarget.value);
                  }}
                  selectedValue={coherency}
                >
                  {Object.entries(beamSummationMethods)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([key, displayValue]) => (
                      <Radio value={key} key={key}>
                        {displayValue}
                      </Radio>
                    ))}
                </RadioGroup>
              ) : (
                <span>{beamSummationMethods[defaultSummationMethod]}</span>
              )}
            </FormGroup>
            <FormGroup helperText="How to align samples" label="Interpolation method">
              {Object.keys(interpolationMethods).length > 1 ? (
                <RadioGroup
                  name="Interpolation method"
                  disabled={formMessage?.intent === 'danger'}
                  onChange={c => {
                    setInterpolation(c.currentTarget.value);
                  }}
                  selectedValue={interpolation}
                >
                  {Object.entries(interpolationMethods).map(([key, displayValue]) => (
                    <Radio value={key} key={key}>
                      {displayValue}
                    </Radio>
                  ))}
                </RadioGroup>
              ) : (
                <span>{interpolationMethods[defaultInterpolationMethod]}</span>
              )}
            </FormGroup>
          </FormContent>
        </DialogBody>
        <DialogFooter
          minimal
          actions={
            <>
              <HotkeyReminder
                description="Create beams with default settings"
                hotkeyConfig={beamKeyboardShortcut}
              />
              <ButtonGroup>
                <Button
                  onClick={() => {
                    setEventBeamDialogVisibility(false);
                    setFocusToWaveformDisplay();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  intent={errorMessage?.intent === 'danger' ? 'danger' : 'primary'}
                  loading={dataLoadMessage?.isLoading}
                  type="submit"
                  disabled={errorMessage?.intent === 'danger'}
                  onClick={async () => {
                    dispatch(analystActions.setCurrentPhase(phase));
                    onCloseCallback();
                    await createEventBeams({
                      phase,
                      summationMethod: coherency,
                      samplingMethod: interpolation,
                      arrivalTimeLead: convertToSeconds(leadDurationTime),
                      beamDuration: convertToSeconds(beamDurationTime),
                      preFilter: selectedFilter.filterDefinition,
                      selectedStations: targetStations,
                      selectedChannels: targetChannels
                    }).then(([payload, errors]) => {
                      dispatch(addEventBeamsAndChannels(payload));
                      reportBeamformingErrors(errors);
                      // update selected waveforms in case a selected beam was deleted
                      if (!!selectedWaveforms && !!payload) {
                        setSelectedWaveforms(
                          Object.values(selectedWaveforms).flatMap(csd =>
                            createChannelSegmentString(csd)
                          )
                        );
                      }
                    });
                  }}
                  title="Create Beams"
                >
                  Create beams
                </Button>
              </ButtonGroup>
            </>
          }
        >
          {noStationsMessage && <FormMessage message={noStationsMessage} />}
          {dataLoadMessage && <FormMessage message={dataLoadMessage} hasCopyButton />}
          {errorMessage && <FormMessage message={errorMessage} hasCopyButton />}
        </DialogFooter>
      </Dialog>
    </>
  );
}
