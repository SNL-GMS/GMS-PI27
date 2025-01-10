import { Button, Menu, MenuItem, Popover } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ChannelSegmentTypes, Displays, EventTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  findPhaseFeatureMeasurement,
  getCurrentHypothesis
} from '@gms/common-model/lib/signal-detection/util';
import { formatTimeForDisplay, setDecimalPrecision } from '@gms/common-util';
import type { ToolbarTypes } from '@gms/ui-core-components';
import {
  CustomToolbarItem,
  hideImperativeContextMenu,
  SimpleCheckboxList
} from '@gms/ui-core-components';
import type { CheckboxEntry } from '@gms/ui-core-components/lib/components/ui-widgets/checkbox-list/types';
import {
  collectSdIdsToMultiSelect,
  selectSelectedEventIds,
  selectSelectedSignalDetections,
  selectSelectedStationsAndChannelIds,
  selectSelectedWaveforms,
  useAppSelector,
  useDeselect,
  useDeselectAll,
  useGetPreferredEventHypothesesByEventIds,
  useSetSelectedEventIds,
  useSetSelectedSdIds,
  useSetSelectedWaveformsByChannelSegmentDescriptorIds
} from '@gms/ui-state';
import defer from 'lodash/defer';
import * as React from 'react';

import { useSetSelectedStationIds } from '~analyst-ui/components/waveform/weavess-display/weavess-display-component';

import { getTableCellStringValue } from './table-utils';

interface SelectedCheckboxEntries {
  readonly selectedStationsCheckboxEntries: CheckboxEntry[];
  readonly selectedChannelsCheckboxEntries: CheckboxEntry[];
  readonly selectedSignalDetectionsCheckboxEntries: CheckboxEntry[];
  readonly selectedEventsCheckboxEntries: CheckboxEntry[];
  readonly selectedWaveformsCheckboxEntries: CheckboxEntry[];
}

interface SelectionInformationProps {
  readonly selectedCheckboxEntries: SelectedCheckboxEntries;
}

/**
 * Creates a checkbox list of selected stations
 *
 * @param selectedStationsCheckboxEntries entries of selected stations
 * @param selectedChannelsCheckboxEntries entries of selected channels
 * @returns Checkbox box list of selected stations
 */
export function StationSelectionInformation({
  selectedStationsCheckboxEntries,
  selectedChannelsCheckboxEntries
}: {
  readonly selectedStationsCheckboxEntries: CheckboxEntry[];
  readonly selectedChannelsCheckboxEntries: CheckboxEntry[];
}) {
  const setSelectedStationIds = useSetSelectedStationIds();
  const stationCheckboxRef = React.useRef<SimpleCheckboxList | null>(null);
  if (selectedStationsCheckboxEntries.length === 0) return null;
  return (
    <SimpleCheckboxList
      ref={stationCheckboxRef}
      checkBoxListEntries={selectedStationsCheckboxEntries}
      onChange={() => {
        if (selectedChannelsCheckboxEntries.length > 0) {
          setSelectedStationIds([
            ...selectedChannelsCheckboxEntries.map(entry => entry.name),
            ...(stationCheckboxRef.current?.checkedEntriesNames() ?? [])
          ]);
        } else {
          setSelectedStationIds(stationCheckboxRef.current?.checkedEntriesNames() ?? []);
        }
      }}
      deselectAll={() => {
        if (selectedChannelsCheckboxEntries.length > 0) {
          setSelectedStationIds(selectedChannelsCheckboxEntries.map(entry => entry.name));
        } else {
          setSelectedStationIds([]);
        }
      }}
    />
  );
}

/**
 * Creates a checkbox list wrapped in a menu item of selected stations
 *
 * @param selectedStationsCheckboxEntries entries of selected stations
 * @param selectedChannelsCheckboxEntries entries of selected channels
 * @returns Menu item checkbox box list of selected stations
 */
export function StationSelectionInformationMenuItem({
  selectedStationsCheckboxEntries,
  selectedChannelsCheckboxEntries
}: {
  readonly selectedStationsCheckboxEntries: CheckboxEntry[];
  readonly selectedChannelsCheckboxEntries: CheckboxEntry[];
}) {
  if (selectedStationsCheckboxEntries.length === 0) return null;
  return (
    <MenuItem text="Stations" key="station-selection-information">
      <StationSelectionInformation
        selectedStationsCheckboxEntries={selectedStationsCheckboxEntries}
        selectedChannelsCheckboxEntries={selectedChannelsCheckboxEntries}
      />
    </MenuItem>
  );
}

/**
 * Creates a checkbox list of selected channels
 *
 * @param selectedStationsCheckboxEntries entries of selected stations
 * @param selectedChannelsCheckboxEntries entries of selected channels
 * @returns Checkbox box list of selected channels
 */
export function ChannelSelectionInformation({
  selectedStationsCheckboxEntries,
  selectedChannelsCheckboxEntries
}: {
  readonly selectedStationsCheckboxEntries: CheckboxEntry[];
  readonly selectedChannelsCheckboxEntries: CheckboxEntry[];
}) {
  const setSelectedStationIds = useSetSelectedStationIds();
  const channelCheckboxRef = React.useRef<SimpleCheckboxList | null>(null);
  if (selectedChannelsCheckboxEntries.length === 0) return null;
  return (
    <SimpleCheckboxList
      ref={channelCheckboxRef}
      checkBoxListEntries={selectedChannelsCheckboxEntries}
      onChange={() => {
        if (selectedStationsCheckboxEntries.length > 0) {
          setSelectedStationIds([
            ...selectedStationsCheckboxEntries.map(entry => entry.name),
            ...(channelCheckboxRef.current?.checkedEntriesNames() ?? [])
          ]);
        } else {
          setSelectedStationIds(channelCheckboxRef.current?.checkedEntriesNames() ?? []);
        }
      }}
      deselectAll={() => {
        if (selectedStationsCheckboxEntries.length > 0) {
          setSelectedStationIds(selectedStationsCheckboxEntries.map(entry => entry.name));
        } else {
          setSelectedStationIds([]);
        }
      }}
    />
  );
}

/**
 * Creates a checkbox list wrapped in a menu item of selected channels
 *
 * @param selectedStationsCheckboxEntries entries of selected stations
 * @param selectedChannelsCheckboxEntries entries of selected channels
 * @returns Menu item checkbox box list of selected channels
 */
export function ChannelSelectionInformationMenuItem({
  selectedStationsCheckboxEntries,
  selectedChannelsCheckboxEntries
}: {
  readonly selectedStationsCheckboxEntries: CheckboxEntry[];
  readonly selectedChannelsCheckboxEntries: CheckboxEntry[];
}) {
  if (selectedChannelsCheckboxEntries.length === 0) return null;
  return (
    <MenuItem text="Channels" key="channels-selection-information">
      <ChannelSelectionInformation
        selectedStationsCheckboxEntries={selectedStationsCheckboxEntries}
        selectedChannelsCheckboxEntries={selectedChannelsCheckboxEntries}
      />
    </MenuItem>
  );
}

/**
 * Creates a checkbox list of selected waveforms
 *
 * @param selectedWaveformsCheckboxEntries entries of selected waveforms
 * @returns Checkbox box list of selected waveforms
 */
export function WaveformSelectionInformation({
  selectedWaveformsCheckboxEntries
}: {
  readonly selectedWaveformsCheckboxEntries: CheckboxEntry[];
}) {
  const setSelectedWaveforms = useSetSelectedWaveformsByChannelSegmentDescriptorIds();
  const waveformsCheckboxRef = React.useRef<SimpleCheckboxList | null>(null);

  if (selectedWaveformsCheckboxEntries.length === 0) return null;
  return (
    <SimpleCheckboxList
      ref={waveformsCheckboxRef}
      checkBoxListEntries={selectedWaveformsCheckboxEntries}
      onChange={() => {
        setSelectedWaveforms(waveformsCheckboxRef.current?.checkedEntriesIds() || []);
      }}
      deselectAll={() => {
        setSelectedWaveforms([]);
      }}
    />
  );
}

/**
 * Creates a checkbox list wrapped in a menu item of selected waveforms
 *
 * @param selectedWaveformsCheckboxEntries entries of selected waveforms
 * @returns Menu item checkbox box list of selected waveforms
 */
export function WaveformSelectionInformationMenuItem({
  selectedWaveformsCheckboxEntries
}: {
  readonly selectedWaveformsCheckboxEntries: CheckboxEntry[];
}) {
  if (selectedWaveformsCheckboxEntries.length === 0) return null;
  return (
    <MenuItem text="Waveforms" key="waveforms-selection-information">
      <WaveformSelectionInformation
        selectedWaveformsCheckboxEntries={selectedWaveformsCheckboxEntries}
      />
    </MenuItem>
  );
}

/**
 * Creates a checkbox list of selected events
 *
 * @param selectedEventsCheckboxEntries entries of selected events
 * @returns Checkbox box list of selected events
 */
export function EventSelectionInformation({
  selectedEventsCheckboxEntries
}: {
  readonly selectedEventsCheckboxEntries: CheckboxEntry[];
}) {
  const setSelectedEventIds = useSetSelectedEventIds();
  const eventsCheckboxRef = React.useRef<SimpleCheckboxList | null>(null);
  if (selectedEventsCheckboxEntries.length === 0) return null;
  return (
    <SimpleCheckboxList
      ref={eventsCheckboxRef}
      checkBoxListEntries={selectedEventsCheckboxEntries}
      onChange={() => {
        setSelectedEventIds(eventsCheckboxRef.current?.checkedEntriesIds() ?? []);
      }}
      deselectAll={() => setSelectedEventIds([])}
    />
  );
}

/**
 * Creates a checkbox list wrapped in a menu item of selected events
 *
 * @param selectedEventsCheckboxEntries entries of selected events
 * @returns Menu item checkbox box list of selected events
 */
export function EventSelectionInformationMenuItem({
  selectedEventsCheckboxEntries
}: {
  readonly selectedEventsCheckboxEntries: CheckboxEntry[];
}) {
  if (selectedEventsCheckboxEntries.length === 0) return null;
  return (
    <MenuItem text="Events" key="events-selection-information">
      <EventSelectionInformation selectedEventsCheckboxEntries={selectedEventsCheckboxEntries} />
    </MenuItem>
  );
}

/**
 * Creates a checkbox list of selected signal detections
 *
 * @param selectedSignalDetectionsCheckboxEntries entries of selected signal detections
 * @returns Checkbox box list of selected signal detections
 */
export function SignalDetectionSelectionInformation({
  selectedSignalDetectionsCheckboxEntries
}: {
  readonly selectedSignalDetectionsCheckboxEntries: CheckboxEntry[];
}) {
  const setSelectedSdIds = useSetSelectedSdIds();
  const signalDetectionCheckboxRef = React.useRef<SimpleCheckboxList>(null);

  if (selectedSignalDetectionsCheckboxEntries.length === 0) return null;
  return (
    <SimpleCheckboxList
      ref={signalDetectionCheckboxRef}
      checkBoxListEntries={selectedSignalDetectionsCheckboxEntries}
      onChange={() => {
        setSelectedSdIds(signalDetectionCheckboxRef.current?.checkedEntriesIds() ?? []);
      }}
      deselectAll={() => setSelectedSdIds([])}
    />
  );
}

/**
 * Creates a checkbox list wrapped in a menu item of selected signal detections
 *
 * @param selectedSignalDetectionsCheckboxEntries entries of selected signal detections
 * @returns Menu item checkbox box list of selected signal detections
 */
export function SignalDetectionSelectionInformationMenuItem({
  selectedSignalDetectionsCheckboxEntries
}: {
  readonly selectedSignalDetectionsCheckboxEntries: CheckboxEntry[];
}) {
  if (selectedSignalDetectionsCheckboxEntries.length === 0) return null;
  return (
    <MenuItem text="Signal detections" key="channels-selection-information">
      <SignalDetectionSelectionInformation
        selectedSignalDetectionsCheckboxEntries={selectedSignalDetectionsCheckboxEntries}
      />
    </MenuItem>
  );
}

/**
 * Creates a menu of selection information
 *
 * @param selectedCheckboxEntries
 * @returns Menu of selection information
 */
function SelectionInformation({ selectedCheckboxEntries }: SelectionInformationProps) {
  return (
    <Menu>
      <StationSelectionInformationMenuItem
        selectedStationsCheckboxEntries={selectedCheckboxEntries.selectedStationsCheckboxEntries}
        selectedChannelsCheckboxEntries={selectedCheckboxEntries.selectedChannelsCheckboxEntries}
      />
      <ChannelSelectionInformationMenuItem
        selectedStationsCheckboxEntries={selectedCheckboxEntries.selectedStationsCheckboxEntries}
        selectedChannelsCheckboxEntries={selectedCheckboxEntries.selectedChannelsCheckboxEntries}
      />
      <WaveformSelectionInformationMenuItem
        selectedWaveformsCheckboxEntries={selectedCheckboxEntries.selectedWaveformsCheckboxEntries}
      />
      <EventSelectionInformationMenuItem
        selectedEventsCheckboxEntries={selectedCheckboxEntries.selectedEventsCheckboxEntries}
      />
      <SignalDetectionSelectionInformationMenuItem
        selectedSignalDetectionsCheckboxEntries={
          selectedCheckboxEntries.selectedSignalDetectionsCheckboxEntries
        }
      />
    </Menu>
  );
}

const areAllSelectionInformationEntriesEmpty = (
  selectedCheckboxEntries: SelectedCheckboxEntries
) => {
  return (
    selectedCheckboxEntries.selectedStationsCheckboxEntries.length === 0 &&
    selectedCheckboxEntries.selectedChannelsCheckboxEntries.length === 0 &&
    selectedCheckboxEntries.selectedSignalDetectionsCheckboxEntries.length === 0 &&
    selectedCheckboxEntries.selectedEventsCheckboxEntries.length === 0 &&
    selectedCheckboxEntries.selectedWaveformsCheckboxEntries.length === 0
  );
};

const buildSelectionInformationControl = (
  key: string | number,
  selectedCheckboxEntries: SelectedCheckboxEntries,
  setFocusToDisplay: () => void,
  deselectAll: () => void,
  deselectAllInDisplay: () => void
): ToolbarTypes.ToolbarItemElement => {
  const handleOnClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (event.altKey) {
      event.stopPropagation();
      event.preventDefault();
      deselectAll();
      defer(() => {
        hideImperativeContextMenu();
        setFocusToDisplay();
      });
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    event.preventDefault();
    deselectAllInDisplay();
    defer(() => {
      hideImperativeContextMenu();
      setFocusToDisplay();
    });
  };

  const handleOnClickCollapsed = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (event.altKey) {
      deselectAll();
    }
  };

  const handleDoubleClickCollapsed = () => {
    deselectAllInDisplay();
  };

  const tooltip =
    'Selected items within display (double click: deselect all items within display, alt+click: global deselect)';

  return (
    <CustomToolbarItem
      key={key}
      label="Currently Selected"
      tooltip={tooltip}
      element={
        <Popover
          content={<SelectionInformation selectedCheckboxEntries={selectedCheckboxEntries} />}
          shouldReturnFocusOnClose
        >
          <Button
            title={tooltip}
            alignText="left"
            rightIcon={IconNames.MULTI_SELECT}
            data-cy="selection-information"
            disabled={areAllSelectionInformationEntriesEmpty(selectedCheckboxEntries)}
            onDoubleClick={handleDoubleClick}
            onClick={handleOnClick}
          />
        </Popover>
      }
      collapsed={{
        disabled: areAllSelectionInformationEntriesEmpty(selectedCheckboxEntries),
        element: <SelectionInformation selectedCheckboxEntries={selectedCheckboxEntries} />,
        onClick: handleOnClickCollapsed,
        onDoubleClick: handleDoubleClickCollapsed
      }}
    />
  );
};

/**
 * Generates selection information entries
 *
 * @param displayName app display name or section name
 * @returns generated selection information entries
 */
export const useSelectionInformationEntries = (displayName: string): SelectedCheckboxEntries => {
  const selectedStations = useAppSelector(selectSelectedStationsAndChannelIds);
  const selectedSignalDetections = useAppSelector(selectSelectedSignalDetections);
  const selectedEventIds = useAppSelector(selectSelectedEventIds);
  const selectedWaveforms = useAppSelector(selectSelectedWaveforms);
  const getPreferredEventHypothesesByEventIds = useGetPreferredEventHypothesesByEventIds;
  const selectedEventsPreferredHypotheses = getPreferredEventHypothesesByEventIds(selectedEventIds);

  const selectedStationsCheckboxEntries: CheckboxEntry[] = React.useMemo(() => {
    const result: CheckboxEntry[] = [];
    selectedStations.forEach(station => {
      if (!station.includes('.')) {
        const entry: CheckboxEntry = {
          isChecked: true,
          name: station
        };
        result.push(entry);
      }
    });
    return result;
  }, [selectedStations]);
  const selectedChannelsCheckboxEntries: CheckboxEntry[] = React.useMemo(() => {
    const result: CheckboxEntry[] = [];
    selectedStations.forEach(station => {
      if (station.includes('.')) {
        const entry: CheckboxEntry = {
          isChecked: true,
          name: station
        };
        result.push(entry);
      }
    });
    return result;
  }, [selectedStations]);
  const selectedWaveformsCheckboxEntries: CheckboxEntry[] = React.useMemo(() => {
    const result: CheckboxEntry[] = [];
    selectedWaveforms.forEach(channelSegmentDescriptor => {
      const stationName = channelSegmentDescriptor.channel.name.split('/')?.[0];
      const time = ` | ${formatTimeForDisplay(
        channelSegmentDescriptor.startTime
      )} - ${formatTimeForDisplay(channelSegmentDescriptor.endTime)}`;

      // Id of waveforms is the channel segment descriptor string
      const id = ChannelSegmentTypes.Util.createChannelSegmentString(channelSegmentDescriptor);

      const signalDetectionIds = collectSdIdsToMultiSelect(
        channelSegmentDescriptor,
        [],
        selectedSignalDetections
      );

      if (signalDetectionIds.length === 1) {
        const signalDetectionId = signalDetectionIds[0];
        const signalDetection = selectedSignalDetections.find(sd => sd.id === signalDetectionId);
        if (signalDetection) {
          const phaseFeatureMeasurement = findPhaseFeatureMeasurement(
            getCurrentHypothesis(signalDetection.signalDetectionHypotheses).featureMeasurements
          );
          const phase = ` | ${phaseFeatureMeasurement.measurementValue.value}`;
          const entry: CheckboxEntry = {
            isChecked: true,
            name: `${stationName}${phase}${time}`,
            id
          };
          result.push(entry);
        }
      } else {
        const entry: CheckboxEntry = {
          isChecked: true,
          name: `${stationName}${time}`,
          id
        };
        result.push(entry);
      }
    });
    return result;
  }, [selectedSignalDetections, selectedWaveforms]);
  const selectedSignalDetectionsCheckboxEntries: CheckboxEntry[] = selectedSignalDetections.map(
    sd => {
      const featureMeasurements = SignalDetectionTypes.Util.getCurrentHypothesis(
        sd.signalDetectionHypotheses
      )?.featureMeasurements;
      const phase = getTableCellStringValue(
        SignalDetectionTypes.Util.findPhaseFeatureMeasurementValue(featureMeasurements)?.value
      );
      const time = formatTimeForDisplay(
        SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(featureMeasurements)
          ?.arrivalTime?.value
      );
      const entry: CheckboxEntry = {
        isChecked: true,
        name: `${sd.station.name} | ${phase} | ${time}`,
        id: sd.id
      };
      return entry;
    }
  );
  const selectedEventsCheckboxEntries: CheckboxEntry[] = React.useMemo(
    () =>
      selectedEventsPreferredHypotheses.map(hypothesis => {
        const locationSolution = EventTypes.findPreferredLocationSolution(
          hypothesis.id.hypothesisId,
          selectedEventsPreferredHypotheses
        );
        const entry: CheckboxEntry = {
          isChecked: true,
          name: `${formatTimeForDisplay(
            locationSolution?.location.time
          )} | latitude: ${setDecimalPrecision(
            locationSolution?.location?.latitudeDegrees,
            3
          )} | longitude: ${setDecimalPrecision(locationSolution?.location?.longitudeDegrees, 3)}`,
          id: hypothesis.id.eventId
        };
        return entry;
      }),
    [selectedEventsPreferredHypotheses]
  );
  const result: SelectedCheckboxEntries = React.useMemo(() => {
    switch (displayName) {
      case Displays.IanDisplays.MAP:
        return {
          selectedStationsCheckboxEntries,
          selectedChannelsCheckboxEntries: [],
          selectedSignalDetectionsCheckboxEntries,
          selectedEventsCheckboxEntries,
          selectedWaveformsCheckboxEntries: []
        };
      case Displays.IanDisplays.WAVEFORM:
        return {
          selectedStationsCheckboxEntries,
          selectedChannelsCheckboxEntries,
          selectedSignalDetectionsCheckboxEntries,
          selectedEventsCheckboxEntries: [],
          selectedWaveformsCheckboxEntries
        };
      case Displays.IanDisplays.EVENTS:
        return {
          selectedStationsCheckboxEntries: [],
          selectedChannelsCheckboxEntries: [],
          selectedSignalDetectionsCheckboxEntries: [],
          selectedEventsCheckboxEntries,
          selectedWaveformsCheckboxEntries: []
        };
      case Displays.IanDisplays.SIGNAL_DETECTIONS:
      case Displays.IanDisplays.AZIMUTH_SLOWNESS:
        return {
          selectedStationsCheckboxEntries: [],
          selectedChannelsCheckboxEntries: [],
          selectedSignalDetectionsCheckboxEntries,
          selectedEventsCheckboxEntries: [],
          selectedWaveformsCheckboxEntries: []
        };
      default:
        return {
          selectedStationsCheckboxEntries,
          selectedChannelsCheckboxEntries,
          selectedSignalDetectionsCheckboxEntries,
          selectedEventsCheckboxEntries,
          selectedWaveformsCheckboxEntries
        };
    }
  }, [
    displayName,
    selectedChannelsCheckboxEntries,
    selectedEventsCheckboxEntries,
    selectedSignalDetectionsCheckboxEntries,
    selectedStationsCheckboxEntries,
    selectedWaveformsCheckboxEntries
  ]);
  return result;
};

/**
 * Creates custom toolbar element for selection information
 *
 * @param key string
 * @param displayName ian display name
 * @param display to return focus too
 * @returns custom toolbar element
 */
export const useSelectionInformationControl = (
  key: string | number,
  displayName: string,
  setFocusToDisplay: () => void
): ToolbarTypes.ToolbarItemElement => {
  const selectionInformationEntries = useSelectionInformationEntries(displayName);
  const deselectAll = useDeselectAll();
  const deselectAllPerDisplay = useDeselect(displayName);
  return React.useMemo<ToolbarTypes.ToolbarItemElement>(
    () =>
      buildSelectionInformationControl(
        key,
        selectionInformationEntries,
        setFocusToDisplay,
        deselectAll,
        deselectAllPerDisplay
      ),
    [deselectAll, deselectAllPerDisplay, key, selectionInformationEntries, setFocusToDisplay]
  );
};
