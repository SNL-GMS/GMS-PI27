import type { RotationDefinition } from '../../../src/ts/rotation/types';

export const sampleRotationDefinition: RotationDefinition = {
  rotationDescription: {
    phaseType: 'P',
    samplingType: 'INTERPOLATED',
    twoDimensional: true
  },
  rotationParameters: {
    location: {
      latitudeDegrees: 37.563936,
      longitudeDegrees: -116.85123,
      elevationKm: 2,
      depthKm: 2
    },
    locationToleranceKm: 1,
    orientationAngles: {
      horizontalAngleDeg: 5,
      verticalAngleDeg: 0
    },
    orientationAngleToleranceDeg: 0,
    receiverToSourceAzimuthDeg: 15,
    sampleRateHz: 40,
    sampleRateToleranceHz: 1
  }
};
