import { uniqSortStrings } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import includes from 'lodash/includes';
import { toast } from 'react-toastify';

import {
  beamformingConfigurationErrorCodes,
  BeamformingError,
  beamformingProcessingErrorCodes,
  BeamformingUnknownError
} from './errors';
import type { BeamformingWithStationError } from './errors/beamforming-with-station-error';

const logger = UILogger.create('GMS_LOG_BEAMFORMING', process.env.GMS_LOG_BEAMFORMING);

/**
 * Reports the collections of {@link BeamformingError}s.
 *
 * ?logs a detailed message to the console for each error
 * ?consolidates and categorizes the errors and toasts to the browser
 *
 * @param errors a collection of errors that occurred during beamforming processing
 */
export function reportBeamformingErrors(errors: (BeamformingError | Error)[]) {
  // group errors by unique id
  const configurationErrors: { errors: BeamformingError[]; stations: string[] } = {
    stations: [],
    errors: []
  };
  const processingErrors: { errors: BeamformingError[]; stations: string[] } = {
    stations: [],
    errors: []
  };
  const additionalErrors: Record<string, BeamformingError[]> = {};

  errors.forEach(actualError => {
    let error: BeamformingError;
    if (actualError instanceof BeamformingError) {
      error = actualError;
    } else {
      error = new BeamformingUnknownError(actualError);
    }

    const { id } = error;

    const station = (error as BeamformingWithStationError)?.station;
    if (includes(beamformingConfigurationErrorCodes, id) && station != null) {
      configurationErrors.errors.push(error);
      configurationErrors.stations.push(station.name);
    } else if (includes(beamformingProcessingErrorCodes, id) && station != null) {
      processingErrors.errors.push(error);
      processingErrors.stations.push(station.name);
    } else {
      if (additionalErrors[error.id] == null) {
        additionalErrors[error.id] = [];
      }
      additionalErrors[error.id].push(error);
    }
  });

  if (configurationErrors.errors.length > 0) {
    configurationErrors.errors.forEach(error => {
      logger.error(error.message, error);
    });

    toast.error(
      `There was a problem with configuration for stations: ${uniqSortStrings(
        configurationErrors.stations
      ).join(', ')}`,
      { toastId: 'beaming-configuration-error' }
    );
  }

  if (processingErrors.errors.length > 0) {
    processingErrors.errors.forEach(error => {
      logger.error(error.message, error);
    });

    toast.error(
      `There was an error creating event beams for stations: ${uniqSortStrings(
        processingErrors.stations
      ).join(', ')}`,
      { toastId: 'beaming-processing-error' }
    );
  }

  if (Object.keys(additionalErrors).length > 0) {
    Object.keys(additionalErrors).forEach(key => {
      if (additionalErrors[key].length > 0) {
        additionalErrors[key].forEach(error => {
          logger.error(error.message, error);
        });
        toast.error(
          `There was an error creating event beams: ${additionalErrors[key][0].message}`,
          { toastId: key }
        );
      }
    });
  }
}
