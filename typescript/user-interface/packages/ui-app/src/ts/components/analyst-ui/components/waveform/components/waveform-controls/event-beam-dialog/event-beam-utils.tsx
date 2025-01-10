import type { ChannelTypes } from '@gms/common-model';
import { StationTypes } from '@gms/common-model';
import { notEmpty } from '@gms/common-model/lib/array-util';
import type { BeamformingTemplate } from '@gms/common-model/lib/beamforming-templates/types';
import { stringArrayToFormattedString } from '@gms/common-util';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import type { BeamformingTemplateFetchResult } from '@gms/ui-state';
import { findIncompatibleChannels, getBeamformingTemplateForStation } from '@gms/ui-state';
import type { PredictFeaturesForEventLocationQueryResult } from '@gms/ui-state/lib/app/api/data/event/predict-features-for-event-location';
import mean from 'lodash/mean';

export interface EventBeamValidationMessage extends Message {
  isLoading?: boolean;
}

/**
 * helper function to validate that an array of channels have compatible ground motion.  Exported for testing
 *
 * @param selectedChannels channel array
 * @param angleTolerance the angle tolerance degrees pulled from the beam definition
 * @returns EventBeamValidationMessage - error message if applicable or null if no errors are found
 */
export function validateEventBeamGroundMotion(
  selectedChannels: ChannelTypes.Channel[],
  angleTolerance: number,
  orientationAngles: ChannelTypes.OrientationAngles
): EventBeamValidationMessage {
  const channelErrorFields = findIncompatibleChannels(
    selectedChannels,
    angleTolerance,
    orientationAngles
  );

  // if no error fields are found return null
  if (Object.entries(channelErrorFields).length === 0) return null;

  // build the error message showing all fields in error on all channels
  let errorMessage = 'Select channels with consistent types of ground motion: ';

  selectedChannels.forEach((channel, index) => {
    if (index > 0) {
      errorMessage = errorMessage.concat(', ');
    }
    errorMessage = errorMessage.concat(`${channel.name} (`);

    if (channelErrorFields.channelBandType) {
      errorMessage = errorMessage.concat(`band type: ${channel.channelBandType} `);
    }
    if (channelErrorFields.channelInstrumentType) {
      errorMessage = errorMessage.concat(`instrument type: ${channel.channelInstrumentType} `);
    }
    if (channelErrorFields.units) {
      errorMessage = errorMessage.concat(`units: ${channel.units} `);
    }
    if (channelErrorFields.channelOrientationCode) {
      errorMessage = errorMessage.concat(`orientation code: ${channel.channelOrientationCode} `);
    }
    if (channelErrorFields.horizontalAngleDeg) {
      errorMessage = errorMessage.concat(
        `horizontal angle: ${channel.orientationAngles.horizontalAngleDeg} `
      );
    }
    if (channelErrorFields.verticalAngleDeg) {
      errorMessage = errorMessage.concat(
        `vertical angle: ${channel.orientationAngles.verticalAngleDeg} `
      );
    }

    errorMessage = errorMessage.concat(')');
  });

  return {
    summary: 'Incompatible selected channels',
    details: errorMessage,
    intent: 'danger'
  };
}

/**
 * validates that an array of channels have compatible sample rate and ground motion
 *
 * @param selectedChannels channel array
 * @param beamDefinition a beamDefinition to validate against
 * @returns message - error message if applicable or null if no errors are found
 */
export function validateEventBeamChannels(
  selectedChannels: ChannelTypes.Channel[],
  beamformingTemplate: BeamformingTemplate
): EventBeamValidationMessage {
  if (selectedChannels.length < beamformingTemplate.minWaveformsToBeam)
    return {
      summary: 'Too few channels',
      details: `Select at least ${beamformingTemplate.minWaveformsToBeam} compatible channels on: ${selectedChannels[0].station.name}`,
      intent: 'danger'
    };

  // This logic mirrors the calculation in beamforming-utils to prevent needing a full beamDefinition being generated

  const averageHz = mean(selectedChannels.map(c => c.nominalSampleRateHz));

  const channelsOutOfTolerance = selectedChannels.filter(
    channel =>
      channel.nominalSampleRateHz < averageHz - beamformingTemplate.sampleRateToleranceHz ||
      channel.nominalSampleRateHz > averageHz + beamformingTemplate.sampleRateToleranceHz
  );

  if (channelsOutOfTolerance.length > 0) {
    let channelString = '';
    channelsOutOfTolerance.forEach((channel, index) => {
      if (index > 0) {
        channelString = channelString.concat(', ');
      }
      channelString = channelString.concat(`${channel.name} (${channel.nominalSampleRateHz})`);
    });

    return {
      summary: 'Incompatible selected channels',
      details: `Sample rates outside of tolerance (${averageHz.toFixed(3)}+/-${
        beamformingTemplate.sampleRateToleranceHz
      } hz): ${channelString}. Select channels with compatible sample rates`,
      intent: 'danger'
    };
  }

  const orientationAngles: ChannelTypes.OrientationAngles[] = [];
  selectedChannels.forEach(channel => {
    if (channel.orientationAngles) orientationAngles.push(channel.orientationAngles);
  });

  // This logic mirrors the calculation in beamforming-utils to prevent needing a full beamDefinition being generated
  const horizontalAngleDeg = mean(
    orientationAngles.map(o => o.horizontalAngleDeg).filter(notEmpty)
  );
  const verticalAngleDeg = mean(orientationAngles.map(o => o.verticalAngleDeg).filter(notEmpty));

  return validateEventBeamGroundMotion(
    selectedChannels,
    beamformingTemplate.orientationAngleToleranceDeg,
    { horizontalAngleDeg, verticalAngleDeg }
  );
}

/**
 * validates that a array of channels fall within the parameters of a beam definition
 *
 * @param selectedChannels channel array
 * @param beamDefinition a beamDefinition to validate against
 * @returns message - error message if applicable or null if no errors are found
 */
export function validateSingleStationEventBeamParam(
  selectedChannels: ChannelTypes.Channel[],
  beamformingTemplate: BeamformingTemplate
): EventBeamValidationMessage {
  if (selectedChannels.length < beamformingTemplate.minWaveformsToBeam)
    return {
      summary: 'Too few channels',
      details: `Select at least ${beamformingTemplate.minWaveformsToBeam} compatible channels on: ${selectedChannels[0].station.name}`,
      intent: 'danger'
    };

  return validateEventBeamChannels(selectedChannels, beamformingTemplate);
}

/**
 * validates that the selected stations and channels are valid for beaming.  three valid scenarios
 * nothing selected
 * only stations selected
 * all channels are on a single station
 * returns an error message if an error occurs.  Null if it is valid
 *
 * @param selectedChannels station array
 * @param selectedStations channel array
 * @returns boolean
 */
export function validateEventBeamChannelSelection(
  selectedChannels: ChannelTypes.Channel[],
  selectedStations: StationTypes.Station[]
): EventBeamValidationMessage {
  // if only stations are selected then it is valid
  if (selectedChannels.length === 0) return null;

  // verify all channel stations match
  if (selectedChannels.length > 0) {
    if (selectedStations.length > 1) {
      return {
        summary: 'Invalid selection',
        details: `Multiple stations selected with channel selection. Valid selections include: no selection; only stations; a single station plus compatible raw channels.`,
        intent: 'danger'
      };
    }
    let channelString = '';
    let invalid = false;
    selectedChannels.forEach((channel, index) => {
      channelString = channelString.concat(`${index > 0 ? ',' : ''} ${channel.name}`);
      if (channel.station.name !== selectedChannels[0].station.name) invalid = true;
    });
    if (invalid) {
      return {
        summary: 'Invalid selection',
        details: `Selected channels are from multiple stations. Valid selections include: no selection; only stations; a single station plus compatible raw channels.`,
        intent: 'danger'
      };
    }
  }

  // Check that the station matches the channels
  if (
    selectedStations.length > 0 &&
    selectedStations[0].name !== selectedChannels[0].station.name
  ) {
    return {
      summary: 'Invalid selection',
      details: `Selected station does not match selected channels. Valid selections include: no selection; only stations; a single station plus compatible raw channels.`,
      intent: 'danger'
    };
  }

  return null;
}

/**
 * Validates that the feature predictions required for selected stations are fully loaded
 *
 * @param featurePredictions feature prediction query result
 * @param phase target beamforming phase
 * @param stations station array
 * @param channels channel array
 * @returns error message or null if no error occurred
 */
export function validateEventBeamFPLoad(
  featurePredictions: PredictFeaturesForEventLocationQueryResult,
  phase: string,
  stations: StationTypes.Station[],
  channels: ChannelTypes.Channel[]
): EventBeamValidationMessage {
  const unloadedFpStations: string[] = [];

  if (stations.length === 0 && channels.length > 0) {
    if (
      featurePredictions.data?.receiverLocationsByName === undefined ||
      featurePredictions.data?.receiverLocationsByName[channels[0].station.name] === undefined
    ) {
      unloadedFpStations.push(channels[0].station.name);
    }
  }

  stations.forEach(station => {
    if (
      featurePredictions.data?.receiverLocationsByName === undefined ||
      featurePredictions.data?.receiverLocationsByName[station.name] === undefined
    ) {
      unloadedFpStations.push(station.name);
    }
  });

  if (unloadedFpStations.length > 0) {
    if (featurePredictions.isLoading) {
      return {
        summary: 'Feature predictions loading',
        details: `The feature predictions necessary for event beamforming are still loading, please wait.`,
        intent: 'warning',
        isLoading: true
      };
    }

    let stationList = '';
    unloadedFpStations.forEach((stationName, index) => {
      if (index > 0) {
        stationList = stationList.concat(', ');
      }
      stationList = stationList.concat(stationName);
    });

    return {
      summary: 'Feature Predictions Error',
      details: `An error occurred loading feature predictions for ${stationList}.  Event beams will not be calculated for these stations.`,
      intent: 'warning'
    };
  }
  return null;
}

/**
 * Validates that the beamforming templates required for selected stations are fully loaded
 *
 * @param beamformingTemplates beamforming templates query result
 * @param phase target beamforming phase
 * @param stations station array
 * @param channels channel array
 * @returns error message or null if no error occurred
 */
export function validateEventBeamTemplateLoad(
  beamformingTemplates: BeamformingTemplateFetchResult,
  phase: string,
  stations: StationTypes.Station[],
  channels: ChannelTypes.Channel[]
): EventBeamValidationMessage {
  const unloadedTemplateStations: string[] = [];

  if (stations.length === 0 && channels.length > 0) {
    if (
      beamformingTemplates.data === undefined ||
      beamformingTemplates.data[channels[0].station.name] === undefined ||
      beamformingTemplates.data[channels[0].station.name][phase] === undefined
    ) {
      unloadedTemplateStations.push(channels[0].station.name);
    }
  }

  stations.forEach(station => {
    if (
      beamformingTemplates.data === undefined ||
      beamformingTemplates.data[station.name] === undefined ||
      beamformingTemplates.data[station.name][phase] === undefined
    ) {
      unloadedTemplateStations.push(station.name);
    }
  });

  if (unloadedTemplateStations.length > 0) {
    if (beamformingTemplates.isLoading) {
      return {
        summary: 'Beamforming Templates Loading',
        details: `The beamforming templates necessary for event beamforming are still loading, please wait.`,
        intent: 'warning',
        isLoading: true
      };
    }

    let stationList = '';
    unloadedTemplateStations.forEach((stationName, index) => {
      if (index > 0) {
        stationList = stationList.concat(', ');
      }
      stationList = stationList.concat(stationName);
    });

    return {
      summary: 'Beamforming Templates Error',
      details: `An error occurred loading beamforming templates for ${stationList}.  Event beams will not be calculated for these stations.`,
      intent: 'warning'
    };
  }

  return null;
}

/**
 * Validates the parameters needed for event beamforming.  Returns the error message if applicable, null if all validation passes
 *
 * @param stations
 * @param channels
 * @param phase
 * @param beamformingTemplates
 * @param featurePredictions
 * @returns
 */
export function eventBeamStationValidation(
  stations: StationTypes.Station[],
  channels: ChannelTypes.Channel[],
  phase: string,
  beamformingTemplates: BeamformingTemplateFetchResult
): EventBeamValidationMessage {
  // validate selected stations and channels
  const channelSelectionMessage = validateEventBeamChannelSelection(channels, stations);

  if (channelSelectionMessage) {
    return channelSelectionMessage;
  }
  if (channels.length > 0) {
    const beamformingTemplate = getBeamformingTemplateForStation(
      beamformingTemplates.data,
      channels[0].station,
      phase
    );

    if (beamformingTemplate) {
      const singleStationInvalid = validateSingleStationEventBeamParam(
        channels,
        beamformingTemplate
      );
      if (singleStationInvalid) return singleStationInvalid;
    }
  }

  return null;
}

/**
 * Validates the parameters needed for event beamforming.  Returns the error message if applicable, null if all validation passes
 *
 * @param stations
 * @param channels
 * @param phase
 * @param beamformingTemplates
 * @param featurePredictions
 * @returns
 */
export function eventBeamParamValidation(
  stations: StationTypes.Station[],
  channels: ChannelTypes.Channel[],
  phase: string,
  beamformingTemplates: BeamformingTemplateFetchResult,
  featurePredictions: PredictFeaturesForEventLocationQueryResult
): EventBeamValidationMessage {
  const validEventBeamTemplateMessage = validateEventBeamTemplateLoad(
    beamformingTemplates,
    phase,
    stations,
    channels
  );

  if (validEventBeamTemplateMessage) {
    return validEventBeamTemplateMessage;
  }

  const eventBeamStationMessage = eventBeamStationValidation(
    stations,
    channels,
    phase,
    beamformingTemplates
  );

  if (eventBeamStationMessage) {
    return eventBeamStationMessage;
  }

  const validEventBeamPredictionsMessage = validateEventBeamFPLoad(
    featurePredictions,
    phase,
    stations,
    channels
  );

  if (validEventBeamPredictionsMessage) {
    return validEventBeamPredictionsMessage;
  }
  return null;
}

export function nonArrayStationValidation(
  targetStations: StationTypes.Station[]
): [EventBeamValidationMessage, string[]] | undefined {
  const nonArrayStationNames = targetStations
    .filter(
      station =>
        station.type !== StationTypes.StationType.HYDROACOUSTIC_ARRAY &&
        station.type !== StationTypes.StationType.INFRASOUND_ARRAY &&
        station.type !== StationTypes.StationType.SEISMIC_ARRAY
    )
    .map(station => station.name);

  if (nonArrayStationNames.length > 0) {
    const stationString = stringArrayToFormattedString(nonArrayStationNames);

    const errorString =
      nonArrayStationNames.length === 1 ? 'is a non-array station' : 'are non-array stations';
    return [
      {
        summary: 'Unable to compute event beams',
        details: `${stationString} ${errorString}.`,
        intent: 'danger'
      },
      nonArrayStationNames
    ];
  }
  return undefined;
}
