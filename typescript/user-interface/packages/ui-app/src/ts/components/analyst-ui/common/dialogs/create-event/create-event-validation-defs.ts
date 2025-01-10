import { MILLISECONDS_IN_SECOND } from '@gms/common-util';
import type { ValidationDefinition } from '@gms/ui-core-components';
import { useViewableInterval } from '@gms/ui-state';

/** Lat/Lon allow decimal precision up to 12 decimal places, at which point we are seeing floating point arithmetic comparison errors */
const latLonDangerDecimalRegex = /^-?((\d+(\.\d{0,12})?)|(\.\d+))$/;

/** Depth allow decimal precision up to 12 decimal places, at which point we are seeing floating point arithmetic comparison errors */
const depthDecimalRegex = /^-?((\d+(\.\d{0,12})?)|(\.\d+))$/;

const latitudeRange = 90;
const longitudeRange = 180;
const depthMin = -100;
const depthMax = 1000;

/** {@link ValidationDefinition}s pertaining to latitude */
export const latitudeValidationDefs: ValidationDefinition<string>[] = [
  {
    valueIsInvalid: lat => {
      return !latLonDangerDecimalRegex.test(lat);
    },
    invalidMessage: {
      summary: 'Invalid latitude',
      details: `Latitude must be a number between -${latitudeRange}° and ${latitudeRange}°`,
      intent: 'danger'
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
      intent: 'danger'
    }
  }
];

/** {@link ValidationDefinition}s pertaining to longitude */
export const longitudeValidationDefs: ValidationDefinition<string>[] = [
  {
    valueIsInvalid: lon => {
      return !latLonDangerDecimalRegex.test(lon);
    },
    invalidMessage: {
      summary: 'Invalid longitude',
      details: `Longitude must be a number between -${longitudeRange}° and ${longitudeRange}°`,
      intent: 'danger'
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
      intent: 'danger'
    }
  }
];

/** {@link ValidationDefinition}s pertaining to depth */
export const depthValidationDefs: ValidationDefinition<string>[] = [
  {
    valueIsInvalid: depth => {
      return !depthDecimalRegex.test(depth);
    },
    invalidMessage: { summary: 'Invalid depth', intent: 'danger' }
  },
  {
    valueIsInvalid: depth => {
      const depthFloat = parseFloat(depth);
      return depthFloat >= depthMax || depthFloat < depthMin;
    },
    invalidMessage: {
      summary: `Depth must be between ${depthMin} (inclusive) and ${depthMax} (exclusive)`,
      intent: 'danger'
    }
  }
];

/**
 * @returns a {@link ValidationDefinition} that ensures the selected date
 * is within the viewable interval.
 */
export const useDateRangeValidationDefs = (): ValidationDefinition<Date>[] => {
  const [viewableInterval] = useViewableInterval();

  return [
    {
      valueIsInvalid: input => {
        return (
          input.getTime() < viewableInterval.startTimeSecs * MILLISECONDS_IN_SECOND ||
          input.getTime() > viewableInterval.endTimeSecs * MILLISECONDS_IN_SECOND
        );
      },
      invalidMessage: { summary: 'Event time outside of viewable interval', intent: 'danger' }
    }
  ];
};
