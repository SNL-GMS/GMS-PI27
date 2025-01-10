import { Classes, Popover, PopoverPosition } from '@blueprintjs/core';
import classNames from 'classnames';
import React from 'react';

import {
  ChannelSelectionInformation,
  EventSelectionInformation,
  SignalDetectionSelectionInformation,
  StationSelectionInformation,
  useSelectionInformationEntries,
  WaveformSelectionInformation
} from '~common-ui/common/selection-information';

/**
 * Selection information for stations, channels, waveforms, events, and signal detections
 *
 * @returns a fragment of popovers
 */
export const SelectionInformationWidget = React.memo(function LoadingWidget() {
  const selectionInformationEntries = useSelectionInformationEntries('Status Bar');
  return (
    <div className="selection-information-container">
      <Popover
        content={
          <StationSelectionInformation
            selectedStationsCheckboxEntries={
              selectionInformationEntries.selectedStationsCheckboxEntries
            }
            selectedChannelsCheckboxEntries={
              selectionInformationEntries.selectedChannelsCheckboxEntries
            }
          />
        }
        disabled={selectionInformationEntries.selectedStationsCheckboxEntries.length === 0}
        popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
        hoverOpenDelay={300}
        position={PopoverPosition.TOP_LEFT}
        autoFocus={false}
        enforceFocus={false}
        canEscapeKeyClose
        minimal
      >
        <div
          className={classNames('selection-information-widget', {
            'selection-information-widget--disabled':
              selectionInformationEntries.selectedStationsCheckboxEntries.length === 0
          })}
          role="button"
          title="Selected stations"
        >
          <span className="selection-information-widget__text">{`Stations: `}</span>
          <span className="selection-information-widget__text--medium">{`Sta: `}</span>
          {selectionInformationEntries.selectedStationsCheckboxEntries.length}
        </div>
      </Popover>
      <Popover
        content={
          <ChannelSelectionInformation
            selectedStationsCheckboxEntries={
              selectionInformationEntries.selectedStationsCheckboxEntries
            }
            selectedChannelsCheckboxEntries={
              selectionInformationEntries.selectedChannelsCheckboxEntries
            }
          />
        }
        disabled={selectionInformationEntries.selectedChannelsCheckboxEntries.length === 0}
        popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
        hoverOpenDelay={300}
        position={PopoverPosition.TOP_LEFT}
        autoFocus={false}
        enforceFocus={false}
        canEscapeKeyClose
        minimal
      >
        <div
          className={classNames('selection-information-widget', {
            'selection-information-widget--disabled':
              selectionInformationEntries.selectedChannelsCheckboxEntries.length === 0
          })}
          role="button"
          title="Selected channels"
        >
          <span className="selection-information-widget__text">{`Channels: `}</span>
          <span className="selection-information-widget__text--medium">{`Chan: `}</span>
          {selectionInformationEntries.selectedChannelsCheckboxEntries.length}
        </div>
      </Popover>
      <Popover
        content={
          <WaveformSelectionInformation
            selectedWaveformsCheckboxEntries={
              selectionInformationEntries.selectedWaveformsCheckboxEntries
            }
          />
        }
        disabled={selectionInformationEntries.selectedWaveformsCheckboxEntries.length === 0}
        popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
        hoverOpenDelay={300}
        position={PopoverPosition.TOP_LEFT}
        autoFocus={false}
        enforceFocus={false}
        canEscapeKeyClose
        minimal
      >
        <div
          className={classNames('selection-information-widget', {
            'selection-information-widget--disabled':
              selectionInformationEntries.selectedWaveformsCheckboxEntries.length === 0
          })}
          role="button"
          title="Selected waveforms"
        >
          <span className="selection-information-widget__text">{`Waveforms: `}</span>
          <span className="selection-information-widget__text--medium">{`Wave: `}</span>
          {selectionInformationEntries.selectedWaveformsCheckboxEntries.length}
        </div>
      </Popover>
      <Popover
        content={
          <EventSelectionInformation
            selectedEventsCheckboxEntries={
              selectionInformationEntries.selectedEventsCheckboxEntries
            }
          />
        }
        disabled={selectionInformationEntries.selectedEventsCheckboxEntries.length === 0}
        popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
        hoverOpenDelay={300}
        position={PopoverPosition.TOP_LEFT}
        autoFocus={false}
        enforceFocus={false}
        canEscapeKeyClose
        minimal
      >
        <div
          className={classNames('selection-information-widget', {
            'selection-information-widget--disabled':
              selectionInformationEntries.selectedEventsCheckboxEntries.length === 0
          })}
          role="button"
          title="Selected events"
        >
          <span className="selection-information-widget__text">{`Events: `}</span>
          <span className="selection-information-widget__text--medium">{`Evn: `}</span>
          {selectionInformationEntries.selectedEventsCheckboxEntries.length}
        </div>
      </Popover>
      <Popover
        content={
          <SignalDetectionSelectionInformation
            selectedSignalDetectionsCheckboxEntries={
              selectionInformationEntries.selectedSignalDetectionsCheckboxEntries
            }
          />
        }
        disabled={selectionInformationEntries.selectedSignalDetectionsCheckboxEntries.length === 0}
        popoverClassName={classNames([Classes.TOOLTIP, Classes.DARK])}
        hoverOpenDelay={300}
        position={PopoverPosition.TOP_LEFT}
        autoFocus={false}
        enforceFocus={false}
        canEscapeKeyClose
        minimal
      >
        <div
          className={classNames('selection-information-widget', {
            'selection-information-widget--disabled':
              selectionInformationEntries.selectedSignalDetectionsCheckboxEntries.length === 0
          })}
          role="button"
          title="Selected signal detections"
        >
          <span className="selection-information-widget__text">{`Signal Detections: `}</span>
          <span className="selection-information-widget__text--medium">{`SDs: `}</span>
          {selectionInformationEntries.selectedSignalDetectionsCheckboxEntries.length}
        </div>
      </Popover>
    </div>
  );
});
