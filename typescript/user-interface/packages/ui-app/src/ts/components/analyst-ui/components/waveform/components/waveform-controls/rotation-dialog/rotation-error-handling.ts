import type { CommonTypes, EventTypes, StationTypes } from '@gms/common-model';
import {
  degToKm,
  greatCircleAngularSeparation,
  stringArrayToFormattedString
} from '@gms/common-util';
import type { ValidationDefinition } from '@gms/ui-core-components';
import { getMessageValidator, getPriorityMessage } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import {
  areChannelLocationsWithinTolerance,
  areChannelOrientationCodesCompatible,
  areChannelsOrthogonal,
  areChannelsWithinSampleRateTolerance,
  isChannelWithinVerticalTolerance,
  selectOpenEvent,
  useAppSelector,
  useGetRotationTemplateForStationAndPhase,
  useViewableInterval,
  validateChannelsMatchStations,
  validateStationMatchesChannel
} from '@gms/ui-state';
import produce from 'immer';
import React from 'react';

import { isInvalidNumberInput } from '../waveform-control-util';
import type {
  RotationDialogMessage,
  RotationDialogState,
  RotationErrorMessages,
  RotationMessageAction,
  RotationValidationDefinition,
  StationPhaseConfig
} from './types';

const OUT_OF_TOLERANCE_INTENT = 'warning' as const;

// TODO: Get actual configuration per station/phase and remove this mock function
export function getMockStationPhaseConfig() {
  return {
    channelOrientationTolerance: 1,
    channelSampleRateTolerance: 1,
    locationToleranceKm: 0.5
  };
}

// *******************
// Validation Utils
// *******************

export function isValid<T>(validationDefs: ValidationDefinition<T>[], valueToCheck: T) {
  return validationDefs.reduce((v: boolean, validationDef: ValidationDefinition<T>) => {
    if (validationDef.valueIsInvalid(valueToCheck)) {
      return false;
    }
    return v;
  }, true);
}

const isInvalidNumberInputOrEmpty = (val: string) =>
  val != null && val !== '' && isInvalidNumberInput(val);

// *******************
// Validation Defs
// *******************

const latitudeRange = 90;
const longitudeRange = 180;

export const latitudeValidationDefs: (
  isStrictCheck: boolean
) => ValidationDefinition<string, RotationDialogMessage>[] = isStrictCheck => [
  {
    valueIsInvalid: val =>
      isStrictCheck ? isInvalidNumberInput(val) : isInvalidNumberInputOrEmpty(val),
    invalidMessage: {
      summary: 'Invalid latitude',
      details: `Latitude must be a number between -${latitudeRange}° and ${latitudeRange}°`,
      intent: 'danger',
      errorType: 'latInvalidMessage'
    }
  },
  {
    valueIsInvalid: lat => {
      const latFloat = parseFloat(lat);
      return latFloat > latitudeRange || latFloat < -latitudeRange;
    },
    invalidMessage: {
      summary: 'Latitude out of bounds',
      details: `Latitude must be between -${latitudeRange}° and ${latitudeRange}°`,
      intent: 'danger',
      errorType: 'latInvalidMessage'
    }
  }
];

/** {@link ValidationDefinition}s pertaining to longitude */
export const longitudeValidationDefs: (
  isStrictCheck: boolean
) => ValidationDefinition<string>[] = isStrictCheck => [
  {
    valueIsInvalid: val =>
      isStrictCheck ? isInvalidNumberInput(val) : isInvalidNumberInputOrEmpty(val),
    invalidMessage: {
      summary: 'Invalid longitude',
      details: `Longitude must be a number between -${longitudeRange}° and ${longitudeRange}°`,
      intent: 'danger',
      errorType: 'lonInvalidMessage'
    }
  },
  {
    valueIsInvalid: lon => {
      const lonFloat = parseFloat(lon);
      return lonFloat > longitudeRange || lonFloat < -longitudeRange;
    },
    invalidMessage: {
      summary: 'Longitude out of bounds',
      details: `Longitude must be between -${longitudeRange}° and ${longitudeRange}°`,
      intent: 'danger',
      errorType: 'lonInvalidMessage'
    }
  }
];

/**
 * {@link ValidationDefinition}s pertaining to rotation lead time
 */
export const rotationLeadValidationDefs: (
  isStrictCheck: boolean
) => (
  openEventTimeRange: CommonTypes.TimeRange,
  openEvent: EventTypes.Event | undefined
) => ValidationDefinition<string, RotationDialogMessage>[] =
  isStrictCheck => (openEventTimeRange, openEvent) => [
    {
      valueIsInvalid: val =>
        isStrictCheck ? isInvalidNumberInput(val) : isInvalidNumberInputOrEmpty(val),
      invalidMessage: {
        summary: 'Invalid lead time',
        details: 'Lead time should be an integer or decimal number in seconds',
        intent: 'danger',
        errorType: 'leadInvalidMessage'
      }
    },
    {
      valueIsInvalid: duration => {
        return (
          Math.abs(parseFloat(duration)) >
          openEventTimeRange.endTimeSecs - openEventTimeRange.startTimeSecs
        );
      },
      invalidMessage: {
        summary: `Lead is out of bounds`,
        details:
          'Lead is larger than the amount of time loaded in the Waveform Display. Resulting waveforms will be truncated.',
        intent: 'warning',
        errorType: 'leadInvalidMessage'
      }
    },
    {
      valueIsInvalid: lead => {
        const leadFloat = parseFloat(lead);
        if (openEvent == null) {
          return leadFloat > 0;
        }
        return false;
      },
      invalidMessage: {
        summary: `Lead time too large`,
        details:
          'Lead time is before the loaded time range in the Waveform Display. No event is open, so 0 is the start of the loaded time in the Waveform Display.',
        intent: 'warning',
        errorType: 'leadInvalidMessage'
      }
    }
  ];

/**
 * {@link ValidationDefinition}s pertaining to rotation duration
 */
export const rotationDurationValidationDefs: (
  isStrictCheck: boolean
) => (
  openEventTimeRange: CommonTypes.TimeRange
) => ValidationDefinition<string, RotationDialogMessage>[] =
  isStrictCheck => openEventTimeRange => [
    {
      // if a value is provided, validate that it is a valid number
      valueIsInvalid: val =>
        isStrictCheck ? isInvalidNumberInput(val) : isInvalidNumberInputOrEmpty(val),
      invalidMessage: {
        summary: 'Invalid duration',
        details: 'Duration must be a numeric value',
        intent: 'danger',
        errorType: 'durationInvalidMessage'
      }
    },
    {
      valueIsInvalid: duration => {
        const durationFloat = parseFloat(duration);
        return durationFloat <= 0;
      },
      invalidMessage: {
        summary: `Duration is invalid`,
        details: 'Duration must be a positive number',
        intent: 'danger',
        errorType: 'durationInvalidMessage'
      }
    },
    {
      valueIsInvalid: duration => {
        const durationFloat = parseFloat(duration);
        return durationFloat > openEventTimeRange.endTimeSecs - openEventTimeRange.startTimeSecs;
      },
      invalidMessage: {
        summary: `Duration is out of bounds`,
        details:
          'Duration is larger than the amount of time loaded in the Waveform Display. Resulting waveforms will be truncated.',
        intent: 'warning',
        errorType: 'durationInvalidMessage'
      }
    }
  ];

/**
 * {@link ValidationDefinition}s pertaining to rotation azimuth to be checked on submit
 */
export const azimuthValidationDefs: (
  isStrictCheck: boolean
) => ValidationDefinition<string>[] = isStrictCheck => [
  {
    // if a value is provided, validate that it is a valid number
    valueIsInvalid: val =>
      isStrictCheck ? isInvalidNumberInput(val) : isInvalidNumberInputOrEmpty(val),
    invalidMessage: {
      summary: 'Invalid azimuth',
      details: 'Azimuth should be a number between -360° and 360° from North.',
      intent: 'danger'
    }
  },
  {
    valueIsInvalid: azimuth => {
      const MAX_DEGREES_ALLOWED = 360;
      return Math.abs(parseFloat(azimuth)) > MAX_DEGREES_ALLOWED;
    },
    invalidMessage: {
      summary: `Azimuth out of bounds`,
      details: 'Azimuth should be a number between -360° and 360° from North.',
      intent: 'danger'
    }
  }
];

/**
 * Reducer test for if we have an invalid supplied testFunction based on all of the station configs
 *
 * returns invalid if any part of the stationPhaseConfig is undefined
 *
 * @param targetStations stations we want to get phase config for
 * @param rotationPhase the phase to use for the rotation templates
 * @param getStationPhaseConfig the function that retrieves the config
 * @param testIsInvalidFunction reducer test function
 * @returns true if invalid
 */
const isInvalid = (
  targetStations: StationTypes.Station[],
  rotationPhase: string,
  getStationPhaseConfig: (station: string, phase: string) => StationPhaseConfig,
  testIsInvalidFunction: (stationPhaseConfig: StationPhaseConfig) => boolean
) => {
  const result = targetStations?.reduce((accumulator, station) => {
    const stationPhaseConfig = getStationPhaseConfig(station.name, rotationPhase);
    if (
      !stationPhaseConfig ||
      stationPhaseConfig.channelOrientationTolerance === undefined ||
      stationPhaseConfig.channelSampleRateTolerance === undefined ||
      stationPhaseConfig.locationToleranceKm === undefined
    ) {
      return true;
    }
    return testIsInvalidFunction(stationPhaseConfig) || accumulator;
  }, false);
  return result;
};

/**
 * Generate channel validation definitions. Validate the entire dialog state against the
 * suite of channel validations:
 * * Correct number of stations/channels (one station and two channels, or only stations, or nothing)
 * * Channels belong to the selected station
 * * Channel sample rate tolerance is within configured range
 * * Channels are orthogonal (within configured range)
 * * Channels are within configured vertical angle tolerance
 * * Channels have compatible orientation codes
 * * Channels have compatible units
 * * Channels have compatible instrument codes
 * * Channels have compatible band codes
 *
 * @param stationPhaseConfig The configuration for the station and phase in the current state
 * @returns validation definitions for channel validation
 */
export const channelValidationDefs: (isStrictCheck: boolean) => (
  getStationPhaseConfig: (
    station: string,
    phase: string
  ) => {
    channelSampleRateTolerance: number;
    channelOrientationTolerance: number;
    locationToleranceKm: number;
  }
) => RotationValidationDefinition[] =
  isStrictCheck =>
  (
    getStationPhaseConfig: (
      station: string,
      phase: string
    ) => {
      channelSampleRateTolerance: number;
      channelOrientationTolerance: number;
      locationToleranceKm: number;
    }
  ) => [
    {
      valueIsInvalid: state => {
        return state.targetStations.some(station => !state.validStations.includes(station));
      },
      invalidMessage: state => {
        const invalidStationNames = state.targetStations
          .filter(station => !state.validStations.includes(station))
          .map(station => station.name);

        const doesOrDo = invalidStationNames.length === 1 ? 'does' : 'do';

        return {
          summary: `Invalid station${invalidStationNames.length === 1 ? '' : 's'}`,
          details: `${stringArrayToFormattedString(
            invalidStationNames
          )} ${doesOrDo} not have valid horizontal channels.`,
          intent: 'danger',
          errorType: 'stationInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state =>
        !validateChannelsMatchStations(state.targetChannels, state.targetStations),
      invalidMessage: {
        summary: 'Invalid selection',
        details: `Cannot have multiple stations and channels selected at the same time. Valid selections include: no selection; only stations; a single station plus two orthogonal raw channels.`,
        intent: 'danger',
        errorType: 'channelInvalidMessage'
      }
    },
    {
      valueIsInvalid: state =>
        state.targetStations?.length > 0 &&
        state.targetChannels != null &&
        !validateStationMatchesChannel(state.targetChannels, state.targetStations),
      invalidMessage: {
        summary: 'Invalid selection',
        details: `Incompatible station and channel selection. Valid selections include: no selection; only stations; a single station plus two orthogonal raw channels.`,
        intent: 'danger',
        errorType: 'channelInvalidMessage'
      }
    },
    {
      valueIsInvalid: state => {
        return state.targetChannels.length > 2;
      },
      invalidMessage: {
        summary: 'Too many channels selected',
        details:
          'Select exactly two channels from a single station, or no channels in order to use the default configured channels.',
        intent: 'danger',
        errorType: 'channelInvalidMessage'
      }
    },
    {
      valueIsInvalid: state => {
        const testFn = (stationPhaseConfig: StationPhaseConfig) =>
          state.targetChannels.length === 2 &&
          !areChannelsWithinSampleRateTolerance(stationPhaseConfig.channelSampleRateTolerance)(
            state.targetChannels[0]
          )(state.targetChannels[1]);
        return isInvalid(state.targetStations, state.rotationPhase, getStationPhaseConfig, testFn);
      },
      invalidMessage: state => {
        const stationPhaseConfig = getStationPhaseConfig(
          state.targetStations[0]?.name,
          state.rotationPhase
        );
        return {
          summary: 'Channels are out of sample rate tolerance',
          details: `Channels must have a sample rate within a tolerance of ${stationPhaseConfig?.channelSampleRateTolerance}hz. ${state.targetChannels[0]?.name} has a sample rate of ${state.targetChannels[0]?.nominalSampleRateHz}hz, and ${state.targetChannels[1]?.name} has a sample rate of ${state.targetChannels[1]?.nominalSampleRateHz}hz`,
          intent: 'danger',
          errorType: 'channelInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state =>
        state.targetChannels.length === 2 &&
        state.targetChannels[0].orientationAngles.horizontalAngleDeg ===
          state.targetChannels[1].orientationAngles.horizontalAngleDeg,
      invalidMessage: state => ({
        summary: 'Channels have the same orientation angle',
        details: `Channels must be orthogonal. ${state.targetChannels[0].name} has a horizontal orientation angle of ${state.targetChannels[0].orientationAngles.horizontalAngleDeg}°, and ${state.targetChannels[1].name} has a horizontal angle of ${state.targetChannels[1].orientationAngles.horizontalAngleDeg}°`,
        intent: 'danger',
        errorType: 'channelInvalidMessage'
      })
    },
    {
      valueIsInvalid: state => {
        const testFn = (stationPhaseConfig: StationPhaseConfig) =>
          state.targetChannels.length === 2 &&
          !areChannelsOrthogonal(stationPhaseConfig.channelOrientationTolerance)(
            state.targetChannels[0]
          )(state.targetChannels[1]);
        return isInvalid(state.targetStations, state.rotationPhase, getStationPhaseConfig, testFn);
      },
      invalidMessage: state => {
        const stationPhaseConfig = getStationPhaseConfig(
          state.targetStations[0]?.name,
          state.rotationPhase
        );
        return {
          summary: 'Channels are not orthogonal',
          details: `Channels must be orthogonal within a tolerance of ${stationPhaseConfig?.channelOrientationTolerance}°. ${state.targetChannels[0]?.name} has a horizontal orientation angle of ${state.targetChannels[0]?.orientationAngles?.horizontalAngleDeg}°, and ${state.targetChannels[1]?.name} has a horizontal angle of ${state.targetChannels[1]?.orientationAngles?.horizontalAngleDeg}°`,
          intent: OUT_OF_TOLERANCE_INTENT,
          errorType: 'channelInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state => {
        const testFn = (stationPhaseConfig: StationPhaseConfig) =>
          state.targetChannels.length === 2 &&
          !isChannelWithinVerticalTolerance(stationPhaseConfig.channelOrientationTolerance)(
            state.targetChannels[0]
          );
        return isInvalid(state.targetStations, state.rotationPhase, getStationPhaseConfig, testFn);
      },
      invalidMessage: state => {
        const stationPhaseConfig = getStationPhaseConfig(
          state.targetStations[0]?.name,
          state.rotationPhase
        );
        return {
          summary: 'Channel is out of vertical tolerance',
          details: `Channels must have a vertical angle within a tolerance of ${stationPhaseConfig?.channelOrientationTolerance}°. ${state.targetChannels[0]?.name} has a vertical orientation angle of of ${state.targetChannels[0]?.orientationAngles?.verticalAngleDeg}°`,
          intent: OUT_OF_TOLERANCE_INTENT,
          errorType: 'channelInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state => {
        const testFn = (stationPhaseConfig: StationPhaseConfig) =>
          state.targetChannels.length === 2 &&
          !isChannelWithinVerticalTolerance(stationPhaseConfig.channelOrientationTolerance)(
            state.targetChannels[1]
          );
        return isInvalid(state.targetStations, state.rotationPhase, getStationPhaseConfig, testFn);
      },
      invalidMessage: state => {
        const stationPhaseConfig = getStationPhaseConfig(
          state.targetStations[0]?.name,
          state.rotationPhase
        );
        return {
          summary: 'Channel is out of vertical tolerance',
          details: `Channels must have a vertical angle within a tolerance of ${stationPhaseConfig?.channelOrientationTolerance}°. ${state.targetChannels[1]?.name} has a vertical orientation angle of of ${state.targetChannels[0]?.orientationAngles?.verticalAngleDeg}°`,
          intent: OUT_OF_TOLERANCE_INTENT,
          errorType: 'channelInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state =>
        state.targetChannels.length === 2 &&
        !areChannelOrientationCodesCompatible(state.targetChannels[0])(state.targetChannels[1]),
      invalidMessage: state => ({
        summary: 'Incompatible channel orientation codes',
        details: `Channels have different orientation codes. ${state.targetChannels[0].name} has code ${state.targetChannels[0].channelOrientationCode}, and ${state.targetChannels[1].name} has code ${state.targetChannels[1].channelOrientationCode}.`,
        intent: OUT_OF_TOLERANCE_INTENT,
        errorType: 'channelInvalidMessage'
      })
    },
    {
      valueIsInvalid: state =>
        state.targetChannels.length === 2 &&
        state.targetChannels[0].units !== state.targetChannels[1].units,
      invalidMessage: state => ({
        summary: 'Incompatible channel units',
        details: `Channels have different units. ${state.targetChannels[0].name} uses ${state.targetChannels[0].units}, and ${state.targetChannels[1].name} uses ${state.targetChannels[1].units}.`,
        intent: OUT_OF_TOLERANCE_INTENT,
        errorType: 'channelInvalidMessage'
      })
    },
    {
      valueIsInvalid: state =>
        state.targetChannels.length === 2 &&
        state.targetChannels[0].channelInstrumentType !==
          state.targetChannels[1].channelInstrumentType,
      invalidMessage: state => ({
        summary: 'Incompatible channel instrument types',
        details: `Channels have different instrument types. ${state.targetChannels[0].name} has instrument type ${state.targetChannels[0].channelInstrumentType}, and ${state.targetChannels[1].name} has instrument type ${state.targetChannels[1].channelInstrumentType}.`,
        intent: OUT_OF_TOLERANCE_INTENT,
        errorType: 'channelInvalidMessage'
      })
    },
    {
      valueIsInvalid: state =>
        state.targetChannels.length === 2 &&
        state.targetChannels[0].channelBandType !== state.targetChannels[1].channelBandType,
      invalidMessage: state => ({
        summary: 'Incompatible channel band codes',
        details: `Channels have different band codes. ${state.targetChannels[0].name} has band code ${state.targetChannels[0].channelBandType}, and ${state.targetChannels[1].name} has band code ${state.targetChannels[1].channelBandType}.`,
        intent: OUT_OF_TOLERANCE_INTENT,
        errorType: 'channelInvalidMessage'
      })
    },
    {
      valueIsInvalid: state => {
        const testFn = (stationPhaseConfig: StationPhaseConfig) =>
          state.targetChannels.length === 2 &&
          !areChannelLocationsWithinTolerance(stationPhaseConfig.channelOrientationTolerance)(
            state.targetChannels[0]
          )(state.targetChannels[1]);
        return isInvalid(state.targetStations, state.rotationPhase, getStationPhaseConfig, testFn);
      },
      invalidMessage: state => {
        const stationPhaseConfig = getStationPhaseConfig(
          state.targetStations[0]?.name,
          state.rotationPhase
        );
        const difference = degToKm(
          greatCircleAngularSeparation(
            state.targetChannels[0]?.location?.latitudeDegrees,
            state.targetChannels[0]?.location?.longitudeDegrees,
            state.targetChannels[1]?.location?.latitudeDegrees,
            state.targetChannels[1]?.location?.longitudeDegrees
          )
        ).toFixed(4);
        return {
          summary: 'Channel locations are out of tolerance',
          details: `Channels must have locations within a tolerance of ${stationPhaseConfig?.locationToleranceKm}km. ${state.targetChannels[0]?.name} and ${state.targetChannels[1]?.name} longitudes differ by ${difference}`,
          intent: OUT_OF_TOLERANCE_INTENT,
          errorType: 'channelInvalidMessage'
        };
      }
    },
    {
      valueIsInvalid: state => {
        return isStrictCheck && state.targetChannels.length === 1;
      },
      invalidMessage: {
        summary: 'Not enough channels selected',
        details:
          'Select exactly two channels from a single station, or no channels in order to use the default configured channels.',
        intent: 'danger',
        errorType: 'channelInvalidMessage'
      }
    }
  ];

/**
 * Validation definitions for validating steering mode settings against the entire state.
 * This validates azimuth, and lat, lon based on the mode we are in
 */
const steeringValidationDefs: (
  isStrictCheck: boolean
) => RotationValidationDefinition[] = isStrictCheck => [
  {
    valueIsInvalid: state => {
      return (
        state.steeringMode === 'azimuth' &&
        !isValid(azimuthValidationDefs(isStrictCheck), state.azimuth)
      );
    },
    invalidMessage: {
      summary: 'Invalid azimuth',
      details: 'Azimuth should be a number between -360° and 360° from North.',
      intent: 'danger',
      errorType: 'azimuthInvalidMessage'
    }
  },
  {
    valueIsInvalid: state => {
      return (
        state.steeringMode === 'reference-location' &&
        !isValid(latitudeValidationDefs(isStrictCheck), state.latitude)
      );
    },
    invalidMessage: {
      summary: 'Invalid latitude',
      details: latitudeValidationDefs(isStrictCheck)[0].invalidMessage.details,
      intent: 'danger',
      errorType: 'latInvalidMessage'
    }
  },
  {
    valueIsInvalid: state => {
      return (
        state.steeringMode === 'reference-location' &&
        !isValid(longitudeValidationDefs(isStrictCheck), state.longitude)
      );
    },
    invalidMessage: {
      summary: 'Invalid longitude',
      details: longitudeValidationDefs(isStrictCheck)[0].invalidMessage.details,
      intent: 'danger',
      errorType: 'lonInvalidMessage'
    }
  },
  {
    valueIsInvalid: state => {
      return isStrictCheck && state.steeringMode === 'azimuth' && !state.azimuth;
    },
    invalidMessage: {
      summary: 'No azimuth provided',
      details: 'Because the steering mode was set to "azimuth," an azimuth must be provided',
      intent: 'danger',
      errorType: 'azimuthInvalidMessage'
    }
  },
  {
    valueIsInvalid: state => {
      return isStrictCheck && state.steeringMode === 'reference-location' && !state.latitude;
    },
    invalidMessage: {
      summary: 'No latitude provided',
      details:
        'Because the steering mode was set to "reference location," a latitude must be provided',
      intent: 'danger',
      errorType: 'azimuthInvalidMessage'
    }
  },
  {
    valueIsInvalid: state => {
      return isStrictCheck && state.steeringMode === 'reference-location' && !state.longitude;
    },
    invalidMessage: {
      summary: 'No longitude provided',
      details:
        'Because the steering mode was set to "reference location," a longitude must be provided',
      intent: 'danger',
      errorType: 'azimuthInvalidMessage'
    }
  }
];

/**
 * Wraps the {@link rotationLeadValidationDefs} and {@link rotationDurationValidationDefs} so that they may be validated against
 * the full state object
 *
 * @param openEventTimeRange time range for the open event so that lead & duration may be validated against it
 * @param openEvent the open event so that lead may be validated against it
 * @returns a list of validation definitions for validating lead and duration
 */
const leadDurationValidationDefs: (
  isStrictCheck: boolean
) => (
  openEventTimeRange: CommonTypes.TimeRange,
  openEvent: EventTypes.Event | undefined
) => RotationValidationDefinition[] = isStrictCheck => (openEventTimeRange, openEvent) => [
  {
    valueIsInvalid: state => {
      return (
        state.leadDurationMode === 'custom-lead-duration' &&
        !isValid(
          rotationLeadValidationDefs(isStrictCheck)(openEventTimeRange, openEvent),
          state.leadSecs
        )
      );
    },
    invalidMessage: state => {
      return getPriorityMessage(
        getMessageValidator(
          rotationLeadValidationDefs(isStrictCheck)(openEventTimeRange, openEvent)
        )(state.leadSecs)
      );
    }
  },
  {
    valueIsInvalid: state => {
      return (
        state.leadDurationMode === 'custom-lead-duration' &&
        !isValid(
          rotationDurationValidationDefs(isStrictCheck)(openEventTimeRange),
          state.durationSecs
        )
      );
    },
    invalidMessage: state => {
      return getPriorityMessage(
        getMessageValidator(rotationDurationValidationDefs(isStrictCheck)(openEventTimeRange))(
          state.durationSecs
        )
      );
    }
  }
];

/**
 * Validation defs for validating the entire state when in signal detection mode
 */
const signalDetectionModeValidationDefs: (
  isStrictCheck: boolean
) => RotationValidationDefinition[] = isStrictCheck => [
  {
    valueIsInvalid: state => {
      // verify that we have signal detections selected
      return (
        isStrictCheck &&
        state.inputMode === 'signal-detection-mode' &&
        !state.targetSignalDetections?.length
      );
    },
    invalidMessage: {
      summary: 'Signal detections not selected',
      details:
        'Signal detections are required when "using selected signal detections" is selected. Signal detections may be selected outside of this dialog.',
      intent: 'danger',
      errorType: 'signalDetectionInvalidMessage'
    }
  }
];

/**
 * Validation definitions for non error, non warning messages
 */
const infoValidationDefs: (
  isStrictCheck: boolean
) => (openEvent: EventTypes.Event | undefined) => RotationValidationDefinition[] =
  isStrictCheck => openEvent => [
    {
      valueIsInvalid: state =>
        !isStrictCheck &&
        state.inputMode === 'station-phase-mode' &&
        state.targetStations.length === 0 &&
        state.targetChannels.length === 0,
      invalidMessage: {
        summary: 'No stations selected',
        details: `Because no stations are selected, using all valid stations.`,
        errorType: 'infoMessage'
      }
    },
    {
      valueIsInvalid: state =>
        openEvent == null && (state.targetChannels.length > 0 || state.targetStations.length > 0),
      invalidMessage: {
        summary: 'No open event',
        details: `Because no event is open, please provide a reference location or azimuth.`,
        errorType: 'infoMessage'
      }
    }
  ];

export const validateRotationSettingsOnChange: (
  openEventTimeRange: CommonTypes.TimeRange,
  openEvent: EventTypes.Event | undefined,
  getStationPhaseConfig: (
    station: string,
    phase: string
  ) => {
    channelSampleRateTolerance: number;
    channelOrientationTolerance: number;
    locationToleranceKm: number;
  }
) => (value: RotationDialogState) => RotationDialogMessage[] = (
  openEventTimeRange,
  openEvent,
  getStationPhaseConfig
) =>
  //
  getMessageValidator<RotationDialogState, RotationDialogMessage>([
    ...channelValidationDefs(false)(getStationPhaseConfig),
    ...steeringValidationDefs(false),
    ...leadDurationValidationDefs(false)(openEventTimeRange, openEvent),
    ...infoValidationDefs(false)(openEvent) // Should be last
  ]);

export const validateRotationSettingsOnSubmit: (
  openEventTimeRange: CommonTypes.TimeRange,
  openEvent: EventTypes.Event | undefined,
  getStationPhaseConfig: (
    station: string,
    phase: string
  ) => {
    channelSampleRateTolerance: number;
    channelOrientationTolerance: number;
    locationToleranceKm: number;
  }
) => (value: RotationDialogState) => RotationDialogMessage[] = (
  openEventTimeRange,
  openEvent,
  getStationPhaseConfig
) =>
  getMessageValidator<RotationDialogState, RotationDialogMessage>([
    ...channelValidationDefs(true)(getStationPhaseConfig),
    ...steeringValidationDefs(true),
    ...signalDetectionModeValidationDefs(true),
    ...leadDurationValidationDefs(true)(openEventTimeRange, openEvent),
    ...infoValidationDefs(true)(openEvent) // Should be last
  ]);

const getErrorMessagesToDisplay = (
  errorMessages: RotationErrorMessages,
  rotationDialogState: RotationDialogState
) => {
  if (
    errorMessages.channelInvalidMessage &&
    rotationDialogState.inputMode === 'station-phase-mode'
  ) {
    return errorMessages.channelInvalidMessage;
  }

  if (
    errorMessages.stationInvalidMessage &&
    rotationDialogState.inputMode === 'station-phase-mode'
  ) {
    return errorMessages.stationInvalidMessage;
  }

  if (
    errorMessages.latInvalidMessage &&
    // Lat errors are ignored in station phase mode since its disabled
    rotationDialogState.steeringMode === 'reference-location'
  ) {
    return errorMessages.latInvalidMessage;
  }
  if (
    errorMessages.lonInvalidMessage &&
    // Long errors are ignored in station phase mode since its disabled
    rotationDialogState.steeringMode === 'reference-location'
  ) {
    return errorMessages.lonInvalidMessage;
  }
  if (
    errorMessages.azimuthInvalidMessage &&
    // Azimuth errors are ignored in signal detection mode since its disabled
    rotationDialogState.steeringMode === 'azimuth'
  ) {
    return errorMessages.azimuthInvalidMessage;
  }
  if (
    errorMessages.leadInvalidMessage?.intent === 'danger' &&
    rotationDialogState.leadDurationMode === 'custom-lead-duration'
  ) {
    return errorMessages.leadInvalidMessage;
  }
  if (
    errorMessages.durationInvalidMessage?.intent === 'danger' &&
    rotationDialogState.leadDurationMode === 'custom-lead-duration'
  ) {
    return errorMessages.durationInvalidMessage;
  }

  return null;
};

const getWarningMessageToDisplay = (
  errorMessages: RotationErrorMessages,
  rotationDialogState: RotationDialogState
) => {
  if (
    errorMessages.leadInvalidMessage &&
    rotationDialogState.leadDurationMode === 'custom-lead-duration'
  ) {
    return errorMessages.leadInvalidMessage;
  }
  if (
    errorMessages.durationInvalidMessage &&
    rotationDialogState.leadDurationMode === 'custom-lead-duration'
  ) {
    return errorMessages.durationInvalidMessage;
  }

  if (
    errorMessages.signalDetectionInvalidMessage &&
    rotationDialogState.inputMode === 'signal-detection-mode'
  ) {
    return errorMessages.signalDetectionInvalidMessage;
  }
  return null;
};

const getInfoMessagesToDisplay = (
  rotationDialogState: RotationDialogState,
  openEvent: EventTypes.Event
) => {
  // Get the first info message based on the state
  const infoMessageValidator = getMessageValidator<RotationDialogState, RotationDialogMessage>(
    infoValidationDefs(false)(openEvent)
  );
  const infoMessages = infoMessageValidator(rotationDialogState);
  return infoMessages?.length ? infoMessages[0] : null;
};

// *******************
// Reducer
// *******************

const reduceErrorMessage = (
  errorMessageState: RotationErrorMessages,
  action: RotationMessageAction
) => {
  if (action.type === 'clearMessages') {
    return produce(errorMessageState, draft => {
      Object.keys(errorMessageState).forEach(key => {
        draft[key] = undefined;
      });
    });
  }
  return produce(errorMessageState, draft => {
    draft[action.type] = action.payload ? action.payload : undefined;
  });
};

// *******************
// Hooks
// *******************
export const useGetStationPhaseConfig = () => {
  const getRotationTemplate = useGetRotationTemplateForStationAndPhase();
  return React.useCallback(
    (station: string, phase: string) => {
      const rotationTemplate = getRotationTemplate(station, phase);
      return {
        channelSampleRateTolerance: rotationTemplate?.sampleRateToleranceHz,
        channelOrientationTolerance: rotationTemplate?.orientationAngleToleranceDeg,
        locationToleranceKm: rotationTemplate?.locationToleranceKm
      };
    },
    [getRotationTemplate]
  );
};

/**
 * Rotation dialog error message middleware, merges error messages into final state.
 *
 * @param rotationDialogState the displayed state of the rotation dialog to validate
 * @returns the state and dispatcher updated with error messages and error dispatch handler
 */
export const useRotationDialogMessages = (
  rotationDialogState: RotationDialogState
): [
  { displayedMessage: Message; errorMessages: RotationErrorMessages },
  React.Dispatch<RotationMessageAction>
] => {
  const [viewableInterval] = useViewableInterval();
  const openEvent = useAppSelector(selectOpenEvent);
  const getStationPhaseConfig = useGetStationPhaseConfig();
  const [messages, dispatchMessage] = React.useReducer(reduceErrorMessage, {
    latInvalidMessage: undefined,
    lonInvalidMessage: undefined,
    leadInvalidMessage: undefined,
    durationInvalidMessage: undefined,
    channelInvalidMessage: getPriorityMessage(
      validateRotationSettingsOnSubmit(
        viewableInterval,
        openEvent,
        getStationPhaseConfig
      )(rotationDialogState)
    ),
    azimuthInvalidMessage: undefined,
    signalDetectionInvalidMessage: undefined,
    infoMessage: undefined,
    stationInvalidMessage: undefined
  });

  const displayedMessage = React.useMemo((): Message => {
    return (
      getErrorMessagesToDisplay(messages, rotationDialogState) ??
      getWarningMessageToDisplay(messages, rotationDialogState) ??
      getInfoMessagesToDisplay(rotationDialogState, openEvent)
    );
  }, [messages, openEvent, rotationDialogState]);

  return [{ displayedMessage, errorMessages: messages }, dispatchMessage];
};
