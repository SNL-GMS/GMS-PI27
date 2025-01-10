import type { Intent } from '@blueprintjs/core';
import { Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { FormGroup, NumericInput, onNumericInputChange } from '@gms/ui-core-components';
import type { Message } from '@gms/ui-core-components/lib/components/ui-widgets/form/types';
import { selectCoordinates, useAppSelector } from '@gms/ui-state';
import React from 'react';

import {
  azimuthValidationDefs,
  latitudeValidationDefs,
  longitudeValidationDefs
} from './rotation-error-handling';
import type { SteeringMode } from './types';

const latLonMinorStepSize = 0.000001;

const coordinatePasteButtonTooltip = 'Paste latitude & longitude from copied Map coordinates';
const coordinatePasteButtonDisabledTooltip =
  'Copy a latitude & longitude value from the Map Display to enable';

function getAzimuthPlaceholder(steeringMode: string): string {
  if (steeringMode === 'azimuth') {
    return 'Enter an azimuth for all rotated waveforms';
  }
  if (steeringMode === 'reference-location') {
    return 'Station to reference location azimuth';
  }
  if (steeringMode === 'measured-azimuth') {
    return 'Signal detection measured azimuth';
  }
  throw new Error(`Invalid steeringMode: ${steeringMode}`);
}

/**
 * The type of the props for the {@link RotationSteeringSelector} component
 */
export interface RotationSteeringSelectorProps {
  azimuth: string;
  azimuthSelectorIntent: Intent;
  latitude: string;
  longitude: string;
  steeringMode: SteeringMode;
  setLatInvalidMessage: (message: Message) => void;
  setLonInvalidMessage: (message: Message) => void;
  setAzimuthInvalidMessage: (message: Message) => void;
  setAzimuth: React.Dispatch<React.SetStateAction<string>>;
  setLatitude: React.Dispatch<React.SetStateAction<string>>;
  setLongitude: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Creates a form group and radio selector that controls which azimuth steering controls are displayed
 */
export function RotationSteeringSelector({
  azimuth,
  azimuthSelectorIntent,
  latitude,
  longitude,
  steeringMode,
  setAzimuth,
  setAzimuthInvalidMessage,
  setLatInvalidMessage,
  setLatitude,
  setLongitude,
  setLonInvalidMessage
}: RotationSteeringSelectorProps) {
  const coordinates = useAppSelector(selectCoordinates);

  return (
    <>
      <FormGroup
        key="latitude-selector"
        label="Latitude"
        labelInfo="(°)"
        helperText="The latitude of the reference location in degrees. Default to the open event's location, if any."
      >
        <NumericInput
          disabled={steeringMode !== 'reference-location'}
          decimalPrecision={6} // max supported in db
          key="latitude-input"
          className="monospace"
          value={latitude}
          minorStepSize={latLonMinorStepSize}
          validationDefinitions={latitudeValidationDefs(true)}
          onChange={onNumericInputChange(setLatitude)}
          placeholder={
            steeringMode !== 'reference-location' ? 'N/A' : 'Enter a latitude in degrees'
          }
          onError={setLatInvalidMessage}
          tooltip={
            steeringMode !== 'reference-location'
              ? 'Select the steering mode "towards reference location" to enable'
              : ''
          }
        />
        <Button
          disabled={coordinates == null || steeringMode !== 'reference-location'}
          id="rotation-paste-button"
          icon={IconNames.Clipboard}
          title={
            coordinates != null
              ? coordinatePasteButtonTooltip
              : coordinatePasteButtonDisabledTooltip
          }
          onClick={() => {
            setLatitude(coordinates.latitudeDegrees.toString());
            setLongitude(coordinates.longitudeDegrees.toString());
          }}
        />
      </FormGroup>
      <FormGroup
        key="longitude-selector"
        label="Longitude"
        labelInfo="(°)"
        helperText="The longitude of the reference location in degrees. Default to the open event's location, if any."
      >
        <NumericInput
          disabled={steeringMode !== 'reference-location'}
          decimalPrecision={6} // max supported in db
          key="longitude-input"
          className="monospace"
          value={longitude}
          minorStepSize={latLonMinorStepSize}
          validationDefinitions={longitudeValidationDefs(true)}
          onChange={onNumericInputChange(setLongitude)}
          onError={setLonInvalidMessage}
          placeholder={
            steeringMode !== 'reference-location' ? 'N/A' : 'Enter a longitude in degrees'
          }
          tooltip={
            steeringMode !== 'reference-location'
              ? 'Select the steering mode "towards reference location" to enable'
              : ''
          }
        />
        <Button
          disabled={coordinates == null || steeringMode !== 'reference-location'}
          id="rotation-paste-button"
          icon={IconNames.Clipboard}
          title={
            coordinates != null
              ? coordinatePasteButtonTooltip
              : coordinatePasteButtonDisabledTooltip
          }
          onClick={() => {
            setLatitude(coordinates.latitudeDegrees.toString());
            setLongitude(coordinates.longitudeDegrees.toString());
          }}
        />
      </FormGroup>
      <FormGroup
        key="azimuth-selector"
        label="Azimuth"
        labelInfo="(°)"
        helperText="Set the same azimuth for all rotated waveforms. Orientation is in degrees from North."
      >
        <NumericInput
          disabled={steeringMode !== 'azimuth'}
          decimalPrecision={12} // more than this and we see floating point issues
          key="azimuth-input"
          className="monospace"
          intentOverride={azimuthSelectorIntent}
          value={azimuth}
          minorStepSize={1}
          placeholder={getAzimuthPlaceholder(steeringMode)}
          onChange={onNumericInputChange(setAzimuth)}
          onError={setAzimuthInvalidMessage}
          validationDefinitions={azimuthValidationDefs(true)}
          tooltip={steeringMode !== 'azimuth' ? 'Select the steering mode "azimuth" to enable' : ''}
        />
      </FormGroup>
    </>
  );
}
