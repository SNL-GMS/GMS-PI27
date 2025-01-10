import type { ChannelTypes, StationTypes } from '@gms/common-model';
import { SignalDetectionTypes } from '@gms/common-model';
import produce from 'immer';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';

import type { EventsRecord, SignalDetectionsRecord } from '../../../types';
import type {
  DefaultStationVisibility,
  StationVisibilityChanges,
  StationVisibilityChangesDictionary
} from './types';
import { defaultStationVisibility } from './types';

/**
 * @param stationOrName a station or station name from which to get the station's name
 * @returns the name of the station
 */
export const getStationName = (stationOrName: StationTypes.Station | string): string =>
  typeof stationOrName === 'string' ? stationOrName : stationOrName.name;

/**
 * @param channelOrName a channel or channel name from which to get the channel's name
 * @returns the name of the channel
 */
export const getChannelName = (channelOrName: ChannelTypes.Channel | string): string =>
  typeof channelOrName === 'string' ? channelOrName : channelOrName.name;

/**
 * For a given @interface StationVisibilityChanges object, return whether it is visible.
 * If none is given, return the default value.
 *
 * @param sv optional station visibility object. If not provided, defaults to the defaultStationVisibilityObject.
 * @returns whether the station is visible in the waveform display.
 */
export const isStationVisible = (
  sv: StationVisibilityChanges | DefaultStationVisibility = defaultStationVisibility
): boolean => {
  return sv.visibility ?? false;
};

/**
 * For a given @interface StationVisibilityChanges object, return whether the station has been expanded
 * in the waveform display. If no @interface StationVisibilityChanges object is given, return the default value.
 *
 * @param sv optional station visibility object. If not provided, defaults to the defaultStationVisibilityObject.
 * @returns whether the station has been expanded to show all channels in the waveform display.
 */
export const isStationExpanded = (
  sv: StationVisibilityChanges | DefaultStationVisibility = defaultStationVisibility
): boolean => {
  return sv.isStationExpanded ?? false;
};

/**
 * Checks in the provided @interface StationVisibilityChanges object to see if a station is expanded.
 * If the station is not found in @param visD, or if @param visD is undefined, then the default is returned.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param station the station object in question, or the station name
 * @default false
 * @returns whether the station is considered visible according to the @param visD provided
 */
export const isStationVisibleInChangesDict = (
  visD: StationVisibilityChangesDictionary,
  station: StationTypes.Station | string
): boolean => isStationVisible(visD[getStationName(station)]);

/**
 * For a given @interface StationVisibilityChanges object, return whether the named channel is considered visible,
 * meaning it is shown when the user expands that station in the waveform display.
 * If no @interface StationVisibilityChanges object is given, return the default value.
 *
 * @param channelName the name of the channel. Note, this does not check to make sure that the channelName a valid channel.
 * If the channelName is invalid, this will give a false positive.
 * @param sv optional station visibility object. If not provided, defaults to the defaultStationVisibilityObject.
 * @returns whether the channel with the given name is considered visible when the station is expanded to show channels.
 */
export const isChannelVisible = (
  channelName: string,
  sv: StationVisibilityChanges | DefaultStationVisibility = defaultStationVisibility
): boolean => {
  return !sv.hiddenChannels?.includes(channelName);
};

/**
 * When given a list of stations, filters that list to only include stations that are considered "visible,"
 * which indicates that the station appears in the waveform display (even if it is scrolled out of view).
 * If the station is not found in @param visD, or if the @param visD is undefined, then the
 * default (not visible) is returned.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param stations the list of stations to filter
 * @returns a list containing all of the stations that were considered visible from the @param stations list
 */
export const getVisibleStations = (
  visD: StationVisibilityChangesDictionary,
  stations: StationTypes.Station[]
): StationTypes.Station[] =>
  stations ? stations.filter(station => isStationVisible(visD[station.name])) : stations;

/**
 * returns an array of Station Names for visible Stations
 * @param visDict
 * @returns
 */
export const getVisibleStationNamesFromStationVisibilityChangesDictionary = (
  visDict: StationVisibilityChangesDictionary
): string[] => Object.keys(visDict).filter(stationName => isStationVisible(visDict[stationName]));

/**
 * Creates a station visibility changes object.
 *
 * @param stationName the name of the station - Required
 * @param visible is the station visible? Default to false
 * @param isExpanded is the station expanded? Default to false
 * @param hiddenChannels a list of channels that are hidden. Default to none.
 * @returns a new StationVisibilityChanges object with the provided settings.
 */
export const newStationVisibilityChangesObject = (
  stationName: string,
  visible: boolean = defaultStationVisibility.visibility,
  isExpanded = false,
  hiddenChannels: string[] = []
): StationVisibilityChanges => ({
  ...defaultStationVisibility,
  stationName,
  visibility: visible,
  isStationExpanded: isExpanded,
  hiddenChannels
});

/**
 * Creates a @interface StationVisibilityChanges object with the provided channel hidden
 *
 * @param vis the station visibility changes object for the hidden channel
 * @param channel the channel or name of the channel to hide
 * @returns a new visibility changes object with the channel hidden. Note, if the channel is already
 * hidden, this is a no-op, and the returned object will be exactly the same as @param vis.
 */
export const getChangesForHiddenChannel = (
  vis: StationVisibilityChanges,
  channel: string | ChannelTypes.Channel
): StationVisibilityChanges => {
  const channelName = getChannelName(channel);
  if (vis.hiddenChannels?.includes(channelName)) {
    return vis;
  }
  let hiddenChannels: string[];
  if (vis.hiddenChannels) {
    hiddenChannels = [...vis.hiddenChannels, channelName];
  } else {
    hiddenChannels = [channelName];
  }
  return {
    ...vis,
    hiddenChannels
  };
};

/**
 * Creates a @interface StationVisibilityChanges object with the provided channel hidden
 *
 * @param vis the station visibility changes object for the hidden channel
 * @param channel the channel or name of the channel to hide
 * @returns a new visibility changes object with the channel hidden. Note, if the channel is already
 * hidden, this is a no-op, and the returned object will be exactly the same as @param vis.
 */
export const getChangesForVisibleChannel = (
  vis: StationVisibilityChanges,
  channel: string | ChannelTypes.Channel
): StationVisibilityChanges => {
  const channelName = typeof channel === 'string' ? channel : channel.name;
  if (!vis.hiddenChannels?.includes(channelName)) {
    return vis;
  }
  return produce(vis, draft => {
    draft.hiddenChannels = vis.hiddenChannels?.filter(cName => cName !== channelName);
  });
};

/**
 * When given a station, returns a list of that station's channels that includes all channels that are
 * considered "visible," which indicates that the channel appears in the waveform display (even if it
 * is scrolled out of view or its parent station is collapsed).
 * If the station is not found in @param visD, or if the @param visD is undefined, or the channel
 * is not listed as a hidden channel in the corresponding @interface StationVisibilityChanges object,
 * then the default (visible) is assumed for that channel.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param station the station containing the channels to filter
 * @returns a list containing all of the station's channels that are considered visible
 */
export const getVisibleChannels = (
  visD: StationVisibilityChangesDictionary,
  station: StationTypes.Station
): ChannelTypes.Channel[] =>
  station?.allRawChannels?.filter(chan =>
    isChannelVisible(chan.name, visD[getStationName(station)])
  );

/**
 * For a given station, returns a list of that station's channels that are displayed. This means the channel
 * must be considered "visible," and, for all non-default channels, that the station must be expanded. For
 * default channels, they are considered "displayed" even if the station is collapsed.
 * Note, the default visibility for all channels is assumed if @param visD is undefined, or if it does
 * not contain a @interface StationVisibilityChanges corresponding to the changes.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param station the station object in question
 * @returns a list of all the channels belonging to the provided station that should be displayed
 */
export const getAllDisplayedChannelsForStation = (
  visD: StationVisibilityChangesDictionary,
  station: StationTypes.Station
): ChannelTypes.Channel[] => {
  let visibleChannels: ChannelTypes.Channel[] = [];
  const staVis = visD[getStationName(station)];
  if (isStationVisible(staVis)) {
    if (isStationExpanded(staVis)) {
      visibleChannels = visibleChannels.concat(getVisibleChannels(visD, station));
    }
  }
  return visibleChannels;
};

/**
 * Creates a list of all channels that are displayed in the waveform display. Note that this includes
 * channels that are included in the display, but are out of view. It does not include non-default
 * channels that are beneath a station that is not expanded.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param stations the list of all stations to check
 * @returns a list of channels that should be displayed in the waveform display
 */
export const getAllDisplayedChannels = (
  visD: StationVisibilityChangesDictionary,
  stations: StationTypes.Station[]
): ChannelTypes.Channel[] => {
  const visibleStations = getVisibleStations(visD, stations);
  return flatMap(visibleStations, sta => getAllDisplayedChannelsForStation(visD, sta));
};

/**
 * Gets a list of channel names that are displayed in Weavess for the provided stations. Note that this includes
 * channels that are included in the display, but are out of view. It does not include non-default
 * channels that are beneath a station that is not expanded.
 *
 * @param visD the visibility dictionary to check, mapping station names to @interface StationVisibilityChanges objects.
 * @param stations the list of all stations to check
 */
export const getNamesOfAllDisplayedChannels = (
  visD: StationVisibilityChangesDictionary,
  stations: StationTypes.Station[]
): string[] => {
  const visibleChannels = getAllDisplayedChannels(visD, stations);
  return visibleChannels.map(chan => chan.name).sort();
};

/**
 * Get the station names from the signal detections within the open interval
 *
 * @param events events from store
 * @param signalDetections signal detections from store
 * @returns station names as an array of strings
 */
export function getStationNamesFromIntervalSds(
  events: EventsRecord,
  signalDetections: SignalDetectionsRecord
): string[] {
  const stationNames: string[] = [];
  const associatedSignalDetectionHypothesisIds = flatMap(
    flatMap(events, event => {
      const { eventHypotheses } = event;
      return event.preferredEventHypothesisByStage?.map(prefHypothesis => {
        const preferredEventHypothesis = eventHypotheses.find(
          e => e.id.hypothesisId === prefHypothesis.preferred.id.hypothesisId
        );
        return preferredEventHypothesis?.associatedSignalDetectionHypotheses.map(
          assocHypothesis => assocHypothesis.id.id
        );
      });
    })
  );

  Object.values(signalDetections).forEach(sd => {
    if (
      !SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).deleted &&
      includes(
        associatedSignalDetectionHypothesisIds,
        SignalDetectionTypes.Util.getCurrentHypothesis(sd.signalDetectionHypotheses).id.id
      )
    ) {
      stationNames.push(sd.station.name);
    }
  });

  return stationNames;
}
