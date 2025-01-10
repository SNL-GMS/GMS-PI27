export interface MessageConfig {
  invalidCellText: string;
  latestVersionCellText: string;
  tooltipMessages: {
    signalDetection: {
      associatedOpen: string;
      associatedComplete: string;
      associatedOther: string;
      unassociated: string;
      deleted: string;
    };
    history: {
      undoActionMessage: string;
      redoActionMessage: string;
      undoEventLevelActionMessage: string;
      redoEventLevelActionMessage: string;
    };
    location: {
      associatedOrCreatedMessage: string;
      locateCallInProgressMessage: string;
      deletedOrUnassociatedMessage: string;
    };
    magnitude: {
      azimuthSourceToReceiverMessage: string;
      noStationsSetToDefiningMessage: string;
      setAllStationsNotDefiningMessage: string;
      setAllStationsDefiningMessage: string;
      sourceToReceiverAzimuthMessage: string;
      noAmplitudeMessage: string;
    };
    workflowConfirmation: {
      discardTooltip: string;
      cancelTooltip: string;
      header: string;
      text: string;
      title: string;
      cancelText: string;
      discardText: string;
    };
  };
  labels: {
    syncToWaveformDisplayVisibleTimeRange: string;
  };
}
export const messageConfig: MessageConfig = {
  invalidCellText: 'Unknown',
  latestVersionCellText: 'Latest Version',
  tooltipMessages: {
    signalDetection: {
      associatedOpen: 'Associated to open event',
      associatedComplete: 'Associated to completed event',
      associatedOther: 'Associated to other event',
      unassociated: 'Unassociated',
      deleted: 'Deleted'
    },
    history: {
      undoActionMessage: 'Undo this action',
      redoActionMessage: 'Redo this action',
      undoEventLevelActionMessage: 'Undo event history',
      redoEventLevelActionMessage: 'Redo event history'
    },
    location: {
      associatedOrCreatedMessage: 'SD Associated or Created since last locate',
      locateCallInProgressMessage: 'Displays if a locate call is in progress',
      deletedOrUnassociatedMessage: 'SD Deleted or Unassociated since last locate'
    },
    magnitude: {
      azimuthSourceToReceiverMessage: 'Source-to-Receiver Azimuth (\u00B0)',
      noStationsSetToDefiningMessage:
        'Select at least one defining station to calculate network magnitude',
      setAllStationsNotDefiningMessage: 'Set all stations as not defining',
      setAllStationsDefiningMessage: 'Set all stations as defining',
      sourceToReceiverAzimuthMessage: 'Source to Receiver Azimuth (\u00B0)',
      noAmplitudeMessage: 'Make amplitude measurement to set as defining'
    },
    workflowConfirmation: {
      discardTooltip: 'Discard your changes and open a new interval',
      cancelTooltip: 'Cancel and do not open a new interval',
      title: 'Warning',
      header: 'You have unsaved changes in your workspace.',
      text: ' Do you want to discard these changes and load data for a different time range?',
      cancelText: 'Cancel',
      discardText: 'Discard my changes'
    }
  },
  labels: {
    syncToWaveformDisplayVisibleTimeRange: 'Sync to Waveform Display visible time range'
  }
};
