import { Button, Icon, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { ChannelTypes, SignalDetectionTypes, StationTypes } from '@gms/common-model';
import { FormGroup } from '@gms/ui-core-components';
import React from 'react';

import { PhaseSelectorDialog } from '~analyst-ui/common/dialogs';
import { ChannelSelector } from '~analyst-ui/common/forms/inputs/channel-selector';
import { SignalDetectionSelector } from '~analyst-ui/common/forms/inputs/signal-detection-selector';
import { StationSelector } from '~analyst-ui/common/forms/inputs/station-selector';

import type { InputMode } from './types';

const emptyStationIdList: StationTypes.Station[] = [];
const emptyChannelIdList: string[] = [];

const channelSelectorPlaceholders = {
  usingSelectedSignalDetections: 'Signal detections selected. Using default channels.',
  multipleStationsSelected: 'Multiple stations selected. Using default channels.',
  noStationsSelected: 'Using default channels for all stations.',
  noneSelected: 'None selected. Using default channels'
} as const;

type ChannelSelectorPlaceholders =
  (typeof channelSelectorPlaceholders)[keyof typeof channelSelectorPlaceholders];

function getChannelSelectorPlaceholder(
  inputMode: InputMode,
  selectedStations: StationTypes.Station[]
): ChannelSelectorPlaceholders {
  if (inputMode === 'signal-detection-mode') {
    return channelSelectorPlaceholders.usingSelectedSignalDetections;
  }
  if (selectedStations?.length > 1) {
    return channelSelectorPlaceholders.multipleStationsSelected;
  }
  if (!selectedStations || selectedStations.length === 0) {
    return channelSelectorPlaceholders.noStationsSelected;
  }
  return channelSelectorPlaceholders.noneSelected;
}

/**
 * A factory for a getter function for a channel tag. Returns the string portion of the tag.
 * The tag element itself is a blueprint component rendered by the selector input. This is just
 * the string.
 *
 * @returns a getter function that renders a tag in the channel input.
 */
const useBuildRotationChannelTag = (): ((channel: ChannelTypes.Channel) => string) => {
  return React.useCallback(channel => {
    return `${channel.name}`;
  }, []);
};

/**
 * The type of the props for the {@link RotationInputModeSelector} component
 */
export interface RotationInputModeSelectorProps {
  channelSelectorIntent: Intent;
  inputMode: InputMode;
  rotationPhase: string | undefined;
  targetChannels: ChannelTypes.Channel[];
  targetSignalDetections: SignalDetectionTypes.SignalDetection[];
  targetStations: StationTypes.Station[];
  validChannels: ChannelTypes.Channel[];
  validSignalDetections: SignalDetectionTypes.SignalDetection[];
  validStations: StationTypes.Station[];
  selectChannels: (selected: string[]) => void;
  selectSignalDetections: (selected: SignalDetectionTypes.SignalDetection[]) => void;
  selectStations: (selected: StationTypes.Station[]) => void;
  setRotationPhase: (phase: string) => void;
}

/**
 * A form group with radio buttons that toggle between different rotation input modes:
 * "using selected signal detections"
 * "using selected stations/channels and phase"
 */
export const RotationInputModeSelector = React.memo(function MemoizedRotationInputModeSelector({
  channelSelectorIntent,
  inputMode,
  rotationPhase,
  targetChannels,
  targetSignalDetections,
  targetStations,
  validChannels,
  validSignalDetections,
  validStations,
  selectChannels,
  selectSignalDetections,
  selectStations,
  setRotationPhase
}: RotationInputModeSelectorProps) {
  const buildChannelTag = useBuildRotationChannelTag();

  const isChannelSelectorEnabled = React.useCallback(
    () => targetStations?.length === 1 || targetChannels?.length > 0,
    [targetChannels?.length, targetStations?.length]
  );

  const [isPhaseSelectorOpen, setPhaseSelectorOpen] = React.useState(false);

  const stationIntent = React.useCallback(
    (value: string): Intent => {
      return validStations.findIndex(station => station.name === value) === -1
        ? Intent.DANGER
        : Intent.NONE;
    },
    [validStations]
  );
  return (
    <>
      <SignalDetectionSelector
        disabled={validSignalDetections.length === 0 || inputMode !== 'signal-detection-mode'}
        helperText="Use signal detection station, time, and azimuth"
        validSignalDetections={validSignalDetections}
        selectedSignalDetections={
          inputMode === 'signal-detection-mode' ? targetSignalDetections : []
        }
        onChange={React.useCallback(
          selection => {
            selectSignalDetections(selection);
            selectStations(emptyStationIdList);
            selectChannels(emptyChannelIdList);
          },
          [selectChannels, selectSignalDetections, selectStations]
        )}
        placeholder={
          inputMode === 'signal-detection-mode'
            ? 'None selected. Select signal detections to enable.'
            : 'N/A'
        }
      />
      <PhaseSelectorDialog
        isOpen={isPhaseSelectorOpen}
        title="Set Rotation Phase"
        selectedPhases={React.useMemo(() => [rotationPhase], [rotationPhase])}
        phaseSelectorCallback={React.useCallback(
          val => {
            if (val.length > 1) {
              throw new Error(
                'Invalid phases selected. Only one phase may be selected for rotation.'
              );
            }
            setRotationPhase(val[0]);
          },
          [setRotationPhase]
        )}
        closeCallback={React.useCallback(() => setPhaseSelectorOpen(false), [])}
      />
      <StationSelector
        disabled={inputMode !== 'station-phase-mode'}
        helperText="If none are selected, create rotated waveforms for all stations in the Waveform Display"
        validStations={validStations}
        intent={targetChannels.length > 0 && targetStations.length > 1 ? 'danger' : stationIntent}
        selectedStations={targetStations}
        onChange={React.useCallback(
          selection => {
            selectStations(selection);
            selectChannels(
              targetChannels
                .filter(chan => selection.find(station => station.name === chan.station.name))
                .map(chan => chan.name)
            );
          },
          [selectChannels, selectStations, targetChannels]
        )}
        placeholder="None selected. Using all stations."
      />
      <FormGroup
        helperText="If none are selected, use default configured channels for the selected station."
        label="Input Channels"
      >
        <ChannelSelector
          disabled={!isChannelSelectorEnabled() || inputMode !== 'station-phase-mode'}
          intent={channelSelectorIntent}
          validChannels={validChannels}
          buildChannelTag={buildChannelTag}
          placeholder={getChannelSelectorPlaceholder(inputMode, targetStations)}
          selectedChannels={targetChannels}
          onChange={React.useCallback(
            selection => {
              selectChannels(selection.map(channel => channel.name));
            },
            [selectChannels]
          )}
        />
      </FormGroup>
      <FormGroup
        helperText="Create rotated waveforms for this phase at its predicted time"
        label="Phase"
      >
        <Button
          id="rotation-phase-name"
          disabled={inputMode !== 'station-phase-mode'}
          className="rotation-dialog__current-phase"
          onClick={React.useCallback(() => setPhaseSelectorOpen(true), [])}
          value={rotationPhase}
          rightIcon={<Icon icon={IconNames.SELECT} size={14} />}
          fill
          alignText="left"
          title={
            inputMode !== 'station-phase-mode'
              ? 'Select "using selected stations/channels and phase" to enable'
              : ''
          }
        >
          <span>
            {inputMode === 'signal-detection-mode' ? 'Phase per signal detection' : rotationPhase}
          </span>
        </Button>
      </FormGroup>
    </>
  );
});
