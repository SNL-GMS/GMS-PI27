import type { LegacyEventTypes } from '@gms/common-model';
import {
  DeprecatedToolbar,
  DeprecatedToolbarTypes,
  HorizontalDivider
} from '@gms/ui-core-components';
import { UILogger } from '@gms/ui-util';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { toast } from 'react-toastify';

import { showSignalDetectionDetails } from '~analyst-ui/common/dialogs/signal-detection-details/signal-detection-details';
import type { SignalDetectionDetailsProps } from '~analyst-ui/common/dialogs/signal-detection-details/types';
import type { SignalDetectionMenuProps } from '~analyst-ui/common/menus/signal-detection-menu';
import { showSignalDetectionMenu } from '~analyst-ui/common/menus/signal-detection-menu';
import {
  getLatestLocationSolutionSetLegacy,
  shouldUpdateSelectedLocationSolutionLegacy
} from '~analyst-ui/common/utils/event-util';
import {
  getLocationBehavior,
  getNewDefiningForSD,
  getSnapshots,
  initializeSDDiffs,
  updateLocBehaviorFromTableChanges
} from '~analyst-ui/common/utils/location-utils';
import { messageConfig } from '~analyst-ui/config/message-config';
import { systemConfig } from '~analyst-ui/config/system-config';
import { userPreferences } from '~analyst-ui/config/user-preferences';

import { MAX_DEPTH_KM, MAX_LAT_DEGREES, MAX_LON_DEGREES } from '../constants';
import { getLocationPanelElement, setFocusToLocation } from '../location-utils';
import type {
  LocationPanelProps,
  LocationPanelState,
  SignalDetectionTableRowChanges
} from '../types';
import { LocateButtonTooltipMessage } from '../types';
import { LocationHistory } from './location-history';
import { LocationSignalDetections } from './location-signal-detections';
import { DefiningChange, DefiningTypes } from './location-signal-detections/types';

const logger = UILogger.create('GMS_LOG_LOCATION', process.env.GMS_LOG_LOCATION);

export class LocationPanel extends React.Component<LocationPanelProps, LocationPanelState> {
  /**
   * constructor
   */
  public constructor(props: LocationPanelProps) {
    super(props);
    this.state = {
      outstandingLocateCall: false,
      sdDefiningChanges: initializeSDDiffs(props.signalDetectionsByStation)
    };
  }

  // ***************************************
  // BEGIN REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  /**
   * React component lifecycle
   *
   * @param prevProps The previous properties available to this react component
   */
  public componentDidUpdate(prevProps: LocationPanelProps): void {
    const { openEvent, setSelectedLocationSolution, signalDetectionsByStation } = this.props;
    // If new time interval, setup subscriptions

    // If the open event has changed, if a new locate has come in,
    // or if the event hyp has changed - update the state
    if (
      openEvent.id !== prevProps.openEvent.id ||
      shouldUpdateSelectedLocationSolutionLegacy(prevProps.openEvent, openEvent)
    ) {
      const currentLSS = getLatestLocationSolutionSetLegacy(openEvent);
      if (currentLSS) {
        setSelectedLocationSolution(currentLSS.id, currentLSS.locationSolutions[0].id);
      }

      this.setState({
        sdDefiningChanges: initializeSDDiffs(signalDetectionsByStation)
      });
    }
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const {
      openEvent,
      location,
      associatedSignalDetections,
      widthOfDisplayPx,
      selectedSdIds,
      distances,
      changeSignalDetectionAssociations,
      createEvent,
      deleteDetections,
      setSelectedLocationSolution,
      setSelectedPreferredLocationSolution,
      setSelectedSdIds,
      setMeasurementModeEntries,
      updateDetections
    } = this.props;
    const { sdDefiningChanges, outstandingLocateCall } = this.state;
    const height = 200;
    const snapshots = getSnapshots(
      this.isViewingPreviousLocation(),
      openEvent,
      location.selectedLocationSolutionSetId,
      location.selectedLocationSolutionId,
      sdDefiningChanges,
      associatedSignalDetections
    );

    const disableLocate: {
      isDisabled: boolean;
      reason: LocateButtonTooltipMessage | string;
    } = this.disableLocate();
    const toolbarItems: DeprecatedToolbarTypes.ToolbarItem[] = [];
    const locateButton: DeprecatedToolbarTypes.ButtonItem = {
      disabled: disableLocate.isDisabled,
      label: 'Locate',
      tooltip: disableLocate.reason,
      rank: 1,
      onClick: () => {
        this.locate();
      },
      widthPx: 60,
      type: DeprecatedToolbarTypes.ToolbarItemType.Button,
      cyData: 'location-locate-button'
    };
    toolbarItems.push(locateButton);
    const toolbarLeftItems: DeprecatedToolbarTypes.ToolbarItem[] = [];
    const locateSpinner: DeprecatedToolbarTypes.LoadingSpinnerItem = {
      tooltip: messageConfig.tooltipMessages.location.locateCallInProgressMessage,
      label: 'Locating',
      type: DeprecatedToolbarTypes.ToolbarItemType.LoadingSpinner,
      rank: 1,
      itemsToLoad: outstandingLocateCall ? 1 : 0,
      hideTheWordLoading: true,
      hideOutstandingCount: false,
      widthPx: 100
    };
    toolbarLeftItems.push(locateSpinner);

    return (
      <>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="location-wrapper"
          onKeyDown={this.onKeyPress}
          tabIndex={-1}
          data-cy="location"
          onMouseEnter={e => {
            e.currentTarget.focus();
          }}
        >
          <DeprecatedToolbar
            itemsRight={toolbarItems}
            itemsLeft={toolbarLeftItems}
            toolbarWidthPx={widthOfDisplayPx - userPreferences.list.widthOfTableMarginsPx}
          />
          <HorizontalDivider
            topHeightPx={height}
            setFocusToDisplay={setFocusToLocation}
            top={
              <LocationHistory
                event={openEvent}
                location={location}
                setSelectedLocationSolution={setSelectedLocationSolution}
                setSelectedPreferredLocationSolution={setSelectedPreferredLocationSolution}
              />
            }
            bottom={
              <LocationSignalDetections
                event={openEvent}
                distances={distances}
                signalDetectionDiffSnapshots={snapshots}
                historicalMode={this.isViewingPreviousLocation()}
                changeSignalDetectionAssociations={changeSignalDetectionAssociations}
                deleteDetections={deleteDetections}
                updateDetections={updateDetections}
                createEvent={createEvent}
                selectedSdIds={selectedSdIds}
                setSelectedSdIds={sdIds => {
                  setSelectedSdIds(sdIds);
                }}
                showSDContextMenu={event => {
                  showSignalDetectionMenu(event, this.getSignalDetectionMenuProps(), {
                    activeElementOnClose: getLocationPanelElement()
                  });
                }}
                showSDDetails={(event, signalDetectionId) => {
                  showSignalDetectionDetails(
                    event,
                    this.getSignalDetectionDetailsProps(signalDetectionId)
                  );
                }}
                updateIsDefining={this.updateIsDefining}
                setDefining={this.setDefiningForColumn}
                setMeasurementModeEntries={setMeasurementModeEntries}
                toast={message => {
                  toast.info(message);
                }}
              />
            }
          />
        </div>
      </>
    );
  }

  // ***************************************
  // END REACT COMPONENT LIFECYCLE METHODS
  // ***************************************

  private readonly onKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.nativeEvent.code === 'KeyL') {
        if (!this.disableLocate()) {
          this.locate();
        }
      }
    }
  };

  private readonly isViewingPreviousLocation = (): boolean => {
    const { location, openEvent } = this.props;
    const latestLocationSS = getLatestLocationSolutionSetLegacy(openEvent);
    return latestLocationSS && latestLocationSS.id !== location.selectedLocationSolutionSetId;
  };

  /**
   * Returns the props for {@link SignalDetectionMenuProps} for the provided
   * signal detection id.
   *
   * @param selectedSignalDetectionIds the selected signal detection ids
   */
  private readonly getSignalDetectionMenuProps = (): SignalDetectionMenuProps => {
    const { measurementMode, setMeasurementModeEntries } = this.props;
    return {
      measurementMode,
      setMeasurementModeEntries
    };
  };

  /**
   * Returns the props for {@link SignalDetectionDetailsProps} for the provided
   * signal detection id.
   *
   * @param signalDetectionId signal detection to populate the details display with
   */
  private readonly getSignalDetectionDetailsProps = (
    signalDetectionId: string
  ): SignalDetectionDetailsProps => {
    const { signalDetectionsByStation } = this.props;
    const signalDetection = signalDetectionsByStation.find(sd => sd.id === signalDetectionId);
    return {
      signalDetection
    };
  };

  /**
   * Update the Signal Detection isDefining value(checkbox) in the state
   *
   * @param definingType which isDefing value to update Arrival Time, Slowness or Azimuth
   * @param signalDetectionHypothesisId which Signal Detection hypothesis to update
   * @param setDefining if true sets defining to true, otherwise false
   */
  private readonly updateIsDefining = (
    definingType: DefiningTypes,
    signalDetectionId: string,
    setDefining: boolean
  ): void => {
    const { associatedSignalDetections, openEvent } = this.props;
    const { sdDefiningChanges } = this.state;
    const signalDetection = associatedSignalDetections.find(sd => sd.id === signalDetectionId);
    // If we do not find the signal detection then can't update
    if (!signalDetection) {
      return;
    }
    const sdRowChanges: SignalDetectionTableRowChanges = sdDefiningChanges.find(
      row => row.signalDetectionId === signalDetection.id
    )
      ? sdDefiningChanges.find(row => row.signalDetectionId === signalDetection.id)
      : {
          arrivalTimeDefining: DefiningChange.NO_CHANGE,
          azimuthDefining: DefiningChange.NO_CHANGE,
          slownessDefining: DefiningChange.NO_CHANGE,
          signalDetectionId: signalDetection.id
        };
    const newSdRow = getNewDefiningForSD(
      definingType,
      setDefining,
      signalDetection,
      sdRowChanges,
      openEvent
    );
    const newDefining = [
      ...sdDefiningChanges.filter(sdc => sdc.signalDetectionId !== signalDetection.id),
      newSdRow
    ];
    this.setState({ sdDefiningChanges: newDefining });
  };

  /**
   * Sets new sd rows to state
   *
   * @param isDefining whether the new row is defining
   * @param definingType which fm will be set
   */
  private readonly setDefiningForColumn = (isDefining: boolean, definingType: DefiningTypes) => {
    const { associatedSignalDetections, openEvent } = this.props;
    const { sdDefiningChanges } = this.state;
    const currentSdIds = associatedSignalDetections.map(sd => sd.id);
    const rowsWithNullEntriesFilled = currentSdIds.map(sdId =>
      sdDefiningChanges.find(sdc => sdc.signalDetectionId === sdId)
        ? sdDefiningChanges.find(sdc => sdc.signalDetectionId === sdId)
        : {
            arrivalTimeDefining: DefiningChange.NO_CHANGE,
            azimuthDefining: DefiningChange.NO_CHANGE,
            slownessDefining: DefiningChange.NO_CHANGE,
            signalDetectionId: sdId
          }
    );
    const newRows = rowsWithNullEntriesFilled.map(row =>
      getNewDefiningForSD(
        definingType,
        isDefining,
        associatedSignalDetections.find(sd => sd.id === row.signalDetectionId),
        row,
        openEvent
      )
    );
    this.setState(prevState => ({
      ...prevState,
      sdDefiningChanges: newRows
    }));
  };

  // ***************************************
  // BEGIN Helper functions, please move to a util when possible
  // ***************************************

  /**
   * Determines if a location is valid based on its depth, lat, and long
   */
  // eslint-disable-next-line class-methods-use-this
  private readonly isLocationValid = (location: LegacyEventTypes.LocationSolution): boolean => {
    let valid = true;
    valid = valid && location.location.depthKm <= MAX_DEPTH_KM && location.location.depthKm >= 0;
    valid = valid && Math.abs(location.location.latitudeDegrees) <= MAX_LAT_DEGREES;
    valid = valid && Math.abs(location.location.longitudeDegrees) <= MAX_LON_DEGREES;
    return valid;
  };

  /**
   * Returns true is the latest calculated location set has valid date
   */
  private readonly isLastLocationSetValid = (): boolean => {
    const { openEvent } = this.props;
    const preferred = getLatestLocationSolutionSetLegacy(openEvent);
    let valid = true;
    if (preferred) {
      preferred.locationSolutions.forEach(l => {
        valid = valid && this.isLocationValid(l);
      });
    }
    return valid;
  };

  /**
   * Determines if the locate button can be used
   */
  private readonly disableLocate = (): {
    isDisabled: boolean;
    reason: LocateButtonTooltipMessage | string;
  } => {
    if (!this.isLastLocationSetValid()) {
      return {
        isDisabled: true,
        reason: LocateButtonTooltipMessage.BadLocationAttributes
      };
    }

    const numberOfRequiredBehaviors =
      systemConfig.numberOfDefiningLocationBehaviorsRequiredForLocate;
    const locationBehaviors = this.getLocationBehaviors();
    const definingList = locationBehaviors.map(lb => lb.defining);
    const definingCount = definingList.reduce((prev, cur) => (cur ? prev + 1 : prev), 0);
    return definingCount < systemConfig.numberOfDefiningLocationBehaviorsRequiredForLocate
      ? {
          isDisabled: true,
          reason: `${numberOfRequiredBehaviors} ${LocateButtonTooltipMessage.NotEnoughDefiningBehaviors}`
        }
      : { isDisabled: false, reason: LocateButtonTooltipMessage.Correct };
  };

  /**
   * Sends location mutation to the gateway
   */
  private readonly locate = () => {
    const { openEvent, location, locateEvent } = this.props;
    const eventHypothesisId = openEvent.currentEventHypothesis.eventHypothesis.id;
    const locationBehaviors = this.getLocationBehaviors();
    // Call the mutation the return is the updated EventHypothesis
    const variables: LegacyEventTypes.LocateEventMutationArgs = {
      eventHypothesisId,
      preferredLocationSolutionId: location.selectedPreferredLocationSolutionId,
      locationBehaviors
    };
    this.setState({ outstandingLocateCall: true });
    locateEvent({ variables })
      .then(() => {
        this.setState({ outstandingLocateCall: false });
      })
      .catch(e => logger.error(`Failed to locate: ${e.message}`));
  };

  /**
   * Retrieve the Location Behaviors from the current SignalDetectionAssociations.
   * Used by Locate Event Mutation
   *
   * @param signalDetections list of sd's to get location behaviors from
   * @returns List of LocationBehaviors
   */
  private readonly getLocationBehaviors = (): LegacyEventTypes.LocationBehavior[] => {
    const locationBehaviors: LegacyEventTypes.LocationBehavior[] = [];
    const { openEvent, location, associatedSignalDetections, signalDetectionsByStation } =
      this.props;
    const { sdDefiningChanges } = this.state;
    // For each SD find the SD Row for the defining values.
    // Change the location behavior defining values according.
    const snaps = getSnapshots(
      this.isViewingPreviousLocation(),
      openEvent,
      location.selectedLocationSolutionSetId,
      location.selectedLocationSolutionId,
      sdDefiningChanges,
      associatedSignalDetections
    );
    snaps.forEach(sdsnap => {
      if (!sdsnap.deletedOrUnassociated) {
        const prevLocationBehaviors = cloneDeep(
          openEvent.currentEventHypothesis.eventHypothesis.preferredLocationSolution
            .locationSolution.locationBehaviors
        );
        const sdTableRowChange = sdDefiningChanges.find(
          sdRC => sdRC.signalDetectionId === sdsnap.signalDetectionId
        );
        const sd = signalDetectionsByStation.find(sdreal => sdreal.id === sdsnap.signalDetectionId);
        const arrivalLoc = getLocationBehavior(
          DefiningTypes.ARRIVAL_TIME,
          sd,
          prevLocationBehaviors
        );
        const azimuthLoc = getLocationBehavior(DefiningTypes.AZIMUTH, sd, prevLocationBehaviors);
        const slowLoc = getLocationBehavior(DefiningTypes.SLOWNESS, sd, prevLocationBehaviors);

        if (arrivalLoc) {
          const newArrivalBehavior = sdTableRowChange
            ? updateLocBehaviorFromTableChanges(arrivalLoc, sdTableRowChange, 'arrivalTimeDefining')
            : arrivalLoc;
          locationBehaviors.push(newArrivalBehavior);
        }
        if (azimuthLoc) {
          const newAzimuthBehavior = sdTableRowChange
            ? updateLocBehaviorFromTableChanges(azimuthLoc, sdTableRowChange, 'azimuthDefining')
            : arrivalLoc;
          locationBehaviors.push(newAzimuthBehavior);
        }
        if (slowLoc) {
          const newSlownessBehavior = sdTableRowChange
            ? updateLocBehaviorFromTableChanges(slowLoc, sdTableRowChange, 'slownessDefining')
            : arrivalLoc;
          locationBehaviors.push(newSlownessBehavior);
        }
      }
    });
    return locationBehaviors;
  };
}
