import type {
  ChannelTypes,
  ConfigurationTypes,
  SignalDetectionTypes,
  StationTypes
} from '@gms/common-model';
import { CommonTypes, FacetedTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import { findSignalDetectionPhase } from '@gms/common-model/lib/signal-detection/util';
import type { Logger } from '@gms/common-util';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import {
  isListOfFullyPopulatedChannels,
  selectOpenActivityNames,
  selectOpenEvent,
  selectPreferredLocationSolution,
  selectProcessingConfiguration,
  selectSelectedSignalDetections,
  selectSelectedStationsAndChannelIds,
  useAppSelector,
  useGetOrFetchRotationTemplateForStationAndPhase,
  useRawChannels,
  useRotate2dForChannels,
  useRotate2dForSignalDetections,
  useRotate2dForStations,
  useSignalDetections,
  useViewableInterval,
  useVisibleStations
} from '@gms/ui-state';
import merge from 'lodash/merge';
import orderBy from 'lodash/orderBy';
import uniqBy from 'lodash/uniqBy';
import React from 'react';

import { isSignalDetectionSelected } from '~analyst-ui/common/utils/signal-detection-util';

import {
  canChannelBeRotated,
  getDefaultInputMode,
  getDefaultInterpolation,
  getDefaultLeadDurationMode,
  getDefaultRotationPhase,
  getDefaultSteeringMode,
  getShouldStationBeShownInSelector,
  getStationFromSD,
  rotationLogger
} from './rotation-dialog-util';
import {
  useGetStationPhaseConfig,
  validateRotationSettingsOnSubmit
} from './rotation-error-handling';
import type {
  DefaultRotatedChannelsRecord,
  InputMode,
  RotationAction,
  RotationDialogState,
  RotationErrorAction,
  RotationErrorMessages
} from './types';
import { rotationDialogActions, rotationErrorActions } from './types';

const emptyStationList: StationTypes.Station[] = [];
const emptySignalDetectionsList: SignalDetectionTypes.SignalDetection[] = [];

/**
 * Determine if a channel code ends in a particular character
 *
 * @example ```
 * const channel1 = useChannels()[0]; // assume this is the channel ABC.ABC01.BHN
 * doesChannelEndInChar(channel1, 'N'); // true
 * ```
 *
 * @param channel A channel to check
 * @param character the character for which to check
 * @returns whether a character appears as the last character in a the channel name's channel code
 */
function doesChannelEndInChar(channel: ChannelTypes.Channel, character: string) {
  const channelNameParts = channel.name.split('.');
  return (
    channelNameParts[channelNameParts.length - 1].charAt(
      channelNameParts[channelNameParts.length - 1].length - 1
    ) === character
  );
}

/**
 * TODO: get the default rotated channels from config instead of generating a list of the first orthogonal channels found
 *
 * @returns the default channels to be rotated for each station
 */
function useDefaultRotatedChannels(): DefaultRotatedChannelsRecord {
  const visibleStations = useVisibleStations();
  const defaultRotatedChannels = {};
  visibleStations?.forEach(station => {
    const nChannel = station.allRawChannels.find(channel => {
      return doesChannelEndInChar(channel, 'N') || doesChannelEndInChar(channel, '1');
    });
    const eChannel = station.allRawChannels.find(channel => {
      return doesChannelEndInChar(channel, 'E') || doesChannelEndInChar(channel, '2');
    });
    if (nChannel && eChannel) {
      defaultRotatedChannels[station.name] = [nChannel, eChannel];
    }
  });
  return defaultRotatedChannels;
}

/**
 * Gets the rotation config, the list of interpolation methods from beamforming config, and default rotated channels per station
 * TODO: get default rotated channels from config service
 *
 * @returns the rotation configuration from processing config and the default rotated channels per station
 */
export function useRotationConfig() {
  return {
    ...useAppSelector(selectProcessingConfiguration)?.rotation,
    ...useAppSelector(selectProcessingConfiguration)?.beamforming?.interpolationMethods,
    // TODO: get default rotated channels from config service
    defaultRotatedChannels: useDefaultRotatedChannels()
  };
}

/**
 * Return the default rotation phase from configuration for the open activities
 *
 * @param rotationConfig The configuration from which to get the default phase by activity
 * @returns The rotation phase based on the user's selected phase. Default is taken from rotation configuration
 * for the currently open activity
 */
export const useRotationPhase = (rotationConfig: ConfigurationTypes.RotationConfiguration) => {
  const openActivityNames = useAppSelector(selectOpenActivityNames);
  return React.useState<string | undefined>(
    getDefaultRotationPhase(openActivityNames, rotationConfig)
  );
};

/**
 * @returns the following
 * validStations: the stations which are valid targets for selection according to the provided comparator
 * targetStations: the local selected stations within the interface (not necessarily global selection)
 * selectStations: function for overriding the global station selection to select stations within the interface using this hook
 */
export const useInitialStationSelection = (
  stationComparator: (station: StationTypes.Station) => boolean
) => {
  const visibleStations = useVisibleStations() ?? emptyStationList;
  const validStations = React.useMemo(
    () => visibleStations?.filter(stationComparator),
    [stationComparator, visibleStations]
  );
  const selectedStationAndChannelIds = useAppSelector(selectSelectedStationsAndChannelIds);
  const initialStations = React.useMemo(() => {
    if (!validStations) return emptyStationList;
    // Filter to selected stations.  If an invalid station is selected do not filter it out
    let selectedStations = visibleStations.filter(station =>
      selectedStationAndChannelIds.includes(station.name)
    );
    if (selectedStationAndChannelIds.length > 0) {
      const implicitStations = validStations
        .filter(station => {
          return selectedStationAndChannelIds.find(channelId => {
            return station.allRawChannels.find(chan => chan.name === channelId);
          });
        })
        .filter(station => station != null);
      selectedStations = uniqBy([...selectedStations, ...implicitStations], 'name');
    }
    return selectedStations;
  }, [selectedStationAndChannelIds, validStations, visibleStations]);

  return { validStations, initialStations };
};

/**
 * @returns the following
 * validStations: the stations which are valid targets for selection according to the provided comparator
 * targetStations: the local selected stations within the interface (not necessarily global selection)
 * selectStations: function for overriding the global station selection to select stations within the interface using this hook
 */
export const useStationSelection = (
  stationComparator: (station: StationTypes.Station) => boolean
) => {
  const { initialStations, validStations } = useInitialStationSelection(stationComparator);
  const [stationSelectionOverrides, setStationSelectionOverrides] = React.useState<
    StationTypes.Station[] | null
  >(null);

  const targetStations = React.useMemo(() => {
    return stationSelectionOverrides ?? initialStations;
  }, [initialStations, stationSelectionOverrides]);

  return { validStations, targetStations, selectStations: setStationSelectionOverrides };
};

/**
 * @returns the following
 * validChannels: the channels which are valid targets for selection (channels of the selected station, if only one station is selected)
 * targetChannels: the local selected channels within this dialog
 * selectChannels: function for overriding the global channel selection to select channels within this dialog
 */
export function useInitialChannels(
  targetStations: StationTypes.Station[],
  channelComparator: (channel: ChannelTypes.Channel) => boolean = () => true
) {
  const selectedStationAndChannelIds = useAppSelector(selectSelectedStationsAndChannelIds);

  const allRawChannels = useRawChannels();

  const initialChannels = React.useMemo(
    () => allRawChannels?.filter(channel => selectedStationAndChannelIds.includes(channel.name)),
    [selectedStationAndChannelIds, allRawChannels]
  );

  const validChannels = React.useMemo(
    () =>
      orderBy(
        targetStations?.flatMap(station => station.allRawChannels).filter(channelComparator) ??
          initialChannels
      )
        .map(facetedChan => {
          return allRawChannels
            .filter(rawChan => FacetedTypes.isFullyPopulated(rawChan, 'name'))
            .find(
              channel =>
                channel.name === facetedChan.name && channel.effectiveAt === facetedChan.effectiveAt
            );
        })
        .filter(notEmpty),
    [allRawChannels, channelComparator, initialChannels, targetStations]
  );
  if (!isListOfFullyPopulatedChannels(validChannels)) {
    throw new Error(
      'Invalid set of channels for channel selector. Channels must be fully populated.'
    );
  }
  if (!isListOfFullyPopulatedChannels(initialChannels)) {
    throw new Error(
      'Invalid set of initial channels for channel selector. Channels must be fully populated.'
    );
  }
  return {
    validChannels,
    initialChannels
  };
}

/**
 * A hook for prefetching rotation templates for the target stations/channels/SDs in the rotation dialog
 * @returns a function used to query for rotation templates needed by the rotation dialog
 */
export function useGetRotationTemplatesForDialog() {
  const getOrFetchRotationTemplate = useGetOrFetchRotationTemplateForStationAndPhase();
  const visibleStations = useVisibleStations();
  return React.useCallback(
    async function getRotationTemplatesForDialog(
      inputMode: InputMode,
      targetStations: StationTypes.Station[],
      targetSignalDetections: SignalDetectionTypes.SignalDetection[],
      rotationPhase: string,
      logger: Logger
    ) {
      // handle stations/channels + single phase
      if (inputMode === 'station-phase-mode') {
        return Promise.all(
          targetStations.map(async station => {
            await getOrFetchRotationTemplate(station, rotationPhase);
          })
        ).catch(logger.error);
      }
      // handle SDs
      if (inputMode === 'signal-detection-mode') {
        return Promise.all(
          targetSignalDetections.map(async signalDetection => {
            // find associated station
            const station = getStationFromSD(signalDetection, visibleStations);

            // Selects the PhaseType literal from the PHASE FeatureMeasurement of the SignalDetection.
            const phaseType = findSignalDetectionPhase(signalDetection);

            // fetch the template
            await getOrFetchRotationTemplate(station, phaseType);
          })
        ).catch(logger.error);
      }
      return undefined;
    },
    [getOrFetchRotationTemplate, visibleStations]
  );
}

/**
 * Given incoming target station channels, or selected channels this will return an array
 * of just valid selectable channels within the context of the rotation dialog. Valid channels
 * are those with a matching fully populated channel in the all channels list.
 *
 * @param channels incoming channels to compare and validate
 * @param allChannels all known channels (fully populated)
 * @returns and array of validated channels
 */
export function getValidChannels(
  channels: ChannelTypes.Channel[],
  allChannels: ChannelTypes.Channel[]
) {
  return orderBy(channels)
    .map(facetedChan => {
      return allChannels
        .filter(rawChan => FacetedTypes.isFullyPopulated(rawChan, 'name'))
        .find(
          channel =>
            channel.name === facetedChan.name && channel.effectiveAt === facetedChan.effectiveAt
        );
    })
    .filter(notEmpty);
}

/**
 * @returns the following
 * validChannels: the channels which are valid targets for selection (channels of the selected station, if only one station is selected)
 * targetChannels: the local selected channels within this dialog
 * selectChannels: function for overriding the global channel selection to select channels within this dialog
 */
export function useChannelSelections(
  validStations,
  targetStations,
  channelComparator: (channel: ChannelTypes.Channel) => boolean = () => true
) {
  const selectedStationAndChannelIds = useAppSelector(selectSelectedStationsAndChannelIds);

  const allRawChannels = useRawChannels();

  const selectedChannels = React.useMemo(
    () => allRawChannels?.filter(channel => selectedStationAndChannelIds.includes(channel.name)),
    [selectedStationAndChannelIds, allRawChannels]
  );

  const [channelSelectionOverrides, setChannelSelectionOverrides] = React.useState<string[] | null>(
    null
  );

  const populatedChannelSelectionOverrides = React.useMemo(
    () =>
      channelSelectionOverrides == null
        ? null
        : allRawChannels?.filter(channel => channelSelectionOverrides?.includes(channel.name)),
    [channelSelectionOverrides, allRawChannels]
  );

  const validChannels = React.useMemo(
    () =>
      getValidChannels(
        targetStations?.[0]?.allRawChannels.filter(channelComparator) ?? selectedChannels,
        allRawChannels
      ),
    [allRawChannels, channelComparator, selectedChannels, targetStations]
  );
  const targetChannels = React.useMemo(() => {
    return populatedChannelSelectionOverrides != null
      ? populatedChannelSelectionOverrides
      : selectedChannels;
  }, [populatedChannelSelectionOverrides, selectedChannels]);

  if (!isListOfFullyPopulatedChannels(validChannels)) {
    throw new Error(
      'Invalid set of channels for channel selector. Channels must be fully populated.'
    );
  }
  if (!isListOfFullyPopulatedChannels(targetChannels)) {
    throw new Error(
      'Invalid set of target channels for channel selector. Channels must be fully populated.'
    );
  }
  return {
    validChannels,
    targetChannels,
    selectChannels: setChannelSelectionOverrides
  };
}

/**
 * Get the signal detections selected by default for the rotation signal detection input.
 * This may be overridden in other state.
 *
 * @param comparator an optional comparator function which is used to filter signal detections. If it returns true, then it is included.
 * If not provided, then default to include everything.
 * @returns the signal detections selected by default for the rotation signal detection input.
 */
export function useInitialSignalDetectionSelectionForRotation(
  comparator: (
    sd: SignalDetectionTypes.SignalDetection,
    selectedSignalDetections: SignalDetectionTypes.SignalDetection[]
  ) => boolean = () => true
) {
  const signalDetectionsRecord = useSignalDetections() ?? emptySignalDetectionsList;
  const globalSelectedSignalDetections = useAppSelector(selectSelectedSignalDetections);
  const validSignalDetections = React.useMemo(
    () =>
      Object.values(signalDetectionsRecord)?.filter(sd => {
        return comparator(sd, globalSelectedSignalDetections);
      }),
    [comparator, globalSelectedSignalDetections, signalDetectionsRecord]
  );
  const initialSignalDetections = React.useMemo(() => {
    if (!validSignalDetections) return emptySignalDetectionsList;
    const selected = validSignalDetections.filter(sd =>
      globalSelectedSignalDetections.includes(sd)
    );
    if (selected?.length >= 1) {
      return selected;
    }
    return emptySignalDetectionsList;
  }, [globalSelectedSignalDetections, validSignalDetections]);

  return {
    validSignalDetections,
    initialSignalDetections
  };
}

export function useSignalDetectionSelectionForRotation(
  comparator: (
    sd: SignalDetectionTypes.SignalDetection,
    selectedSignalDetections: SignalDetectionTypes.SignalDetection[]
  ) => boolean = () => true
) {
  const { initialSignalDetections, validSignalDetections } =
    useInitialSignalDetectionSelectionForRotation(comparator);

  const [signalDetectionSelectionOverrides, setSignalDetectionSelectionOverrides] = React.useState<
    SignalDetectionTypes.SignalDetection[] | null
  >(null);

  const targetSignalDetections = React.useMemo(() => {
    return signalDetectionSelectionOverrides ?? initialSignalDetections;
  }, [initialSignalDetections, signalDetectionSelectionOverrides]);

  return {
    validSignalDetections,
    targetSignalDetections,
    selectSignalDetections: setSignalDetectionSelectionOverrides
  };
}

/**
 * Get the stations that are valid, targeted, and a setter for those target stations.
 * These are used for rotation.
 * Note, this does not modify station selection in the rest of the app. It is
 * self-contained state.
 *
 * @param inputMode whether we are in signal detection mode or station/phase mode
 * @param targetSignalDetections the signal detections the user has actually targeted for
 * rotation. The channels of these signal detections will be included as valid stations,
 * and as target stations to start.
 * @returns
 */
export const useStationsForRotation = (
  inputMode: InputMode,
  targetSignalDetections: SignalDetectionTypes.SignalDetection[]
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filterValidStations = React.useCallback(
    getShouldStationBeShownInSelector(targetSignalDetections),
    [targetSignalDetections]
  );
  const { selectStations, targetStations, validStations } =
    useStationSelection(filterValidStations);
  const dialogSelectedStations = React.useMemo(() => {
    return inputMode === 'signal-detection-mode'
      ? targetSignalDetections.map(sd =>
          validStations.find(validStation => sd.station.name === validStation.name)
        )
      : targetStations;
  }, [inputMode, targetSignalDetections, targetStations, validStations]);
  return {
    selectStations,
    targetStations: dialogSelectedStations,
    validStations
  };
};

/**
 * Get the channels for the rotation selector.
 * Note, this does not modify channel selection in the rest of the app. It is
 * self-contained state.
 *
 * @param inputMode whether we are in signal detection mode or station/phase mode
 * @param validStations The stations which are valid to choose (ie, they have rotatable channels)
 * @param targetStations The stations that the user has actually targeted for rotation, which should be displayed in the station selector
 * @returns
 */
export const useChannelsForRotation = (
  inputMode: InputMode,
  validStations: StationTypes.Station[],
  targetStations: StationTypes.Station[]
) => {
  const { validChannels, targetChannels, selectChannels } = useChannelSelections(
    validStations,
    targetStations,
    canChannelBeRotated
  );

  const dialogSelectedChannels = React.useMemo(() => {
    return inputMode === 'signal-detection-mode' ? [] : targetChannels;
  }, [inputMode, targetChannels]);
  return {
    validChannels,
    targetChannels: dialogSelectedChannels,
    selectChannels
  };
};

function getInitialViewableIntervalTimeRange(viewableInterval: CommonTypes.TimeRange | undefined) {
  if (!viewableInterval) {
    return 0;
  }
  return viewableInterval.endTimeSecs - viewableInterval.startTimeSecs;
}

/**
 * Calling this as a hook means we can call other hooks to pull in those values from which to generate the initial state.
 * The value will be captured and set at the beginning. If these values change while the dialog is open,
 * it may not change in response, since these are only initial values.
 *
 * @returns an initial state for the RotationDialogState
 */
export function useInitialRotationDialogState(): RotationDialogState {
  const rotationConfig = useRotationConfig();
  const [viewableInterval] = useViewableInterval();

  const openEvent = useAppSelector(selectOpenEvent);

  const preferredLocationSolution = useAppSelector(selectPreferredLocationSolution);

  const { initialSignalDetections, validSignalDetections } =
    useInitialSignalDetectionSelectionForRotation(isSignalDetectionSelected);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filterValidStations = React.useCallback(
    getShouldStationBeShownInSelector(initialSignalDetections),
    [initialSignalDetections]
  );

  const { initialStations, validStations } = useInitialStationSelection(filterValidStations);

  const { validChannels, initialChannels } = useInitialChannels(
    initialStations,
    canChannelBeRotated
  );

  const steeringMode = getDefaultSteeringMode(initialSignalDetections);

  const openActivityNames = useAppSelector(selectOpenActivityNames);

  const initialInputMode = getDefaultInputMode(initialSignalDetections);
  return {
    azimuth: '',
    hasRotationTemplates: true,
    inputMode: initialInputMode,
    interpolation: getDefaultInterpolation(openEvent, rotationConfig),
    isRotationDialogState: true,
    latitude: preferredLocationSolution?.location.latitudeDegrees.toString() ?? '0',
    leadDurationMode: getDefaultLeadDurationMode(openEvent, initialInputMode),
    longitude: preferredLocationSolution?.location.longitudeDegrees.toString() ?? '0',
    rotationPhase: getDefaultRotationPhase(openActivityNames, rotationConfig),
    steeringMode,
    targetChannels: initialChannels,
    targetSignalDetections: initialSignalDetections,
    targetStations: initialStations,
    validChannels,
    validSignalDetections,
    validStations,
    leadSecs: openEvent == null ? '0' : rotationConfig?.defaultRotationLeadTime?.toString() ?? '60',
    durationSecs:
      openEvent == null
        ? `${getInitialViewableIntervalTimeRange(viewableInterval)}`
        : rotationConfig?.defaultRotationDuration?.toString() ?? '300'
  };
}

function validateExactlyTwoChannels(
  channels: ChannelTypes.Channel[]
): asserts channels is [ChannelTypes.Channel, ChannelTypes.Channel] {
  if (channels?.length !== 2) {
    throw new Error(
      'Not yet implemented: rotation with default channels. Choose exactly two channels for now.'
    );
  }
}

/**
 * Handle the rotation submission from the rotation dialog
 * TODO: Actually create rotated waveforms on submit
 *
 * @param inputMode whether we are in signal detection mode or station-phase mode
 * @param targetChannels the channels to use in rotation (will be validated by this function)
 * @param dispatchErrorMessage dispatch to set a form message state
 * @param onCloseCallback handler for when the dialog is closed (success)
 * @returns a function that handles when the user clicks the "rotate" submission button
 */
export const useHandleSubmit = (
  state: RotationDialogState,
  dispatchErrorMessage: React.Dispatch<{
    type: keyof RotationErrorMessages;
    payload: Message;
  }>,
  onCloseCallback: () => void
) => {
  const [viewableInterval] = useViewableInterval();
  const openEvent = useAppSelector(selectOpenEvent);
  const getStationPhaseConfig = useGetStationPhaseConfig();
  const rotate2dForChannels = useRotate2dForChannels();
  const rotate2dForStations = useRotate2dForStations();
  const rotate2dForSignalDetections = useRotate2dForSignalDetections();

  return React.useCallback(() => {
    rotationLogger.info('Create rotated waveforms');
    const messages = validateRotationSettingsOnSubmit(
      viewableInterval,
      openEvent,
      getStationPhaseConfig
    )(state);

    const location =
      state.steeringMode === 'reference-location'
        ? {
            latitudeDegrees: parseFloat(state.latitude),
            longitudeDegrees: parseFloat(state.longitude),
            // Given we only perform 2d rotations, elevation and depth are set to 0
            elevationKm: 0,
            depthKm: 0
          }
        : undefined;
    const azimuth =
      state.steeringMode !== 'reference-location' ? parseFloat(state.azimuth) : undefined;

    switch (true) {
      case !!messages?.find(message => message.intent === 'danger'):
        messages?.forEach(errorMsg => {
          dispatchErrorMessage({ type: errorMsg.errorType, payload: errorMsg });
        });
        break;
      case state.inputMode === 'signal-detection-mode' && state.targetSignalDetections?.length > 0:
        rotate2dForSignalDetections(
          state.targetSignalDetections, // SD's
          // state.interpolation could have a default value that is not a sampling type
          // in this case we can let the function determine the interpolation
          CommonTypes.SamplingType[state.interpolation] // sampling type
            ? CommonTypes.SamplingType[state.interpolation]
            : undefined,
          state.leadDurationMode === 'custom-lead-duration' ? Number(state.leadSecs) : undefined, // leadDuration
          state.leadDurationMode === 'custom-lead-duration'
            ? Number(state.durationSecs)
            : undefined, // duration
          state.steeringMode === 'reference-location'
            ? {
                latitudeDegrees: Number(state.latitude),
                longitudeDegrees: Number(state.longitude),
                elevationKm: 0, // set to 0 for now
                depthKm: 0 // set to 0 for now
              }
            : undefined, // location
          state.steeringMode === 'azimuth' ? Number(state.azimuth) : undefined // receiverToSourceAzimuthDeg
        ).catch(rotationLogger.error);
        break;
      case state.targetChannels.length === 2:
        validateExactlyTwoChannels(state.targetChannels);
        rotate2dForChannels(
          state.targetChannels,
          state.rotationPhase,
          undefined,
          parseFloat(state.leadSecs),
          parseFloat(state.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
        break;
      case state.targetStations.length === 0:
        rotate2dForStations(
          state.validStations,
          state.rotationPhase,
          undefined,
          parseFloat(state.leadSecs),
          parseFloat(state.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
        break;
      default:
        rotate2dForStations(
          state.targetStations,
          state.rotationPhase,
          undefined,
          parseFloat(state.leadSecs),
          parseFloat(state.durationSecs),
          location,
          azimuth
        ).catch(rotationLogger.error);
        break;
    }

    onCloseCallback();
  }, [
    dispatchErrorMessage,
    getStationPhaseConfig,
    onCloseCallback,
    openEvent,
    rotate2dForChannels,
    rotate2dForStations,
    rotate2dForSignalDetections,
    state,
    viewableInterval
  ]);
};

/**
 * Takes the merged dispatch function for the rotation state & error messages, and generates setters.
 *
 * @param dispatchRotationAction The dispatch action returned from the useRotationDialogMessages middleware
 * @returns
 */
export function useRotationStateSetters(
  dispatchRotationAction: React.Dispatch<RotationAction | RotationErrorAction>
) {
  return React.useMemo(
    () =>
      merge(
        Object.keys(rotationDialogActions).reduce<
          Record<keyof typeof rotationDialogActions, ((val) => void) | undefined>
        >(
          (
            setters: Record<keyof typeof rotationDialogActions, ((val) => void) | undefined>,
            actionKey
          ) => {
            return {
              ...setters,
              [actionKey]: val => dispatchRotationAction(rotationDialogActions[actionKey](val))
            };
          },
          {
            setTargetChannels: undefined,
            setTargetSignalDetections: undefined,
            setTargetStations: undefined,
            setAzimuth: undefined,
            setInputMode: undefined,
            setInterpolation: undefined,
            setLatitude: undefined,
            setLeadDurationMode: undefined,
            setLongitude: undefined,
            setPhase: undefined,
            setSteeringMode: undefined,
            setLead: undefined,
            setDuration: undefined
          }
        ),
        Object.keys(rotationErrorActions).reduce<
          Record<keyof typeof rotationErrorActions, ((val) => void) | undefined>
        >(
          (
            setters: Record<keyof typeof rotationErrorActions, ((val) => void) | undefined>,
            actionKey
          ) => {
            return {
              ...setters,
              [actionKey]: val => dispatchRotationAction(rotationErrorActions[actionKey](val))
            };
          },
          {
            setAzimuthInvalidMessage: undefined,
            setChannelInvalidMessage: undefined,
            setDurationInvalidMessage: undefined,
            setLatInvalidMessage: undefined,
            setLeadInvalidMessage: undefined,
            setLonInvalidMessage: undefined,
            setSignalDetectionInvalidMessage: undefined,
            setInfoMessage: undefined,
            clearMessages: undefined
          }
        )
      ),
    [dispatchRotationAction]
  );
}

export const loggerMiddleware = ([dialogState, dispatch]: [
  RotationDialogState & {
    displayedMessage: Message;
    errorMessages: RotationErrorMessages;
  },
  React.Dispatch<RotationAction | RotationErrorAction>
]): [
  RotationDialogState & { displayedMessage: Message; errorMessages: RotationErrorMessages },
  React.Dispatch<RotationAction | RotationErrorAction>
] => {
  return [dialogState, dispatch];
};
