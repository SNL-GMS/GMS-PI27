/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  akasg,
  akasgBHEChannel,
  akasgBHNChannel,
  asar,
  eventData,
  PD01Channel,
  PD02Channel,
  PD03Channel,
  pdar
} from '@gms/common-model/__tests__/__data__';
import { Units } from '@gms/common-model/lib/common/types';
import type { EntityReference } from '@gms/common-model/lib/faceted';
import {
  ChannelBandType,
  ChannelInstrumentType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';

import {
  azimuthValidationDefs,
  channelValidationDefs,
  isValid,
  rotationDurationValidationDefs,
  rotationLeadValidationDefs
} from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-error-handling';
import type { RotationDialogState } from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/types';

describe('Rotation dialog error handling', () => {
  describe('rotationLeadValidationDefs', () => {
    it('validates incoming value', () => {
      // eventData;
      const definitions = rotationLeadValidationDefs(true)(
        { startTimeSecs: 1, endTimeSecs: 2 },
        eventData
      );

      // expected true conditions
      expect(isValid(definitions, '0.5')).toBe(true);
      expect(isValid(definitions, '.9')).toBe(true);
      expect(isValid(definitions, '1')).toBe(true);
      expect(isValid(definitions, '-1')).toBe(true);

      // expected false conditions
      expect(isValid(definitions, '')).toBe(false);
      expect(isValid(definitions, 'anything')).toBe(false);
      expect(isValid(definitions, '2.1')).toBe(false);
      expect(isValid(definitions, '1.99')).toBe(false);
      expect(isValid(definitions, '1.01')).toBe(false);
    });
  });

  describe('rotationDurationValidationDefs', () => {
    it('validates incoming value', () => {
      // eventData;
      const definitions = rotationDurationValidationDefs(true)({
        startTimeSecs: 1,
        endTimeSecs: 2
      });

      // expected true conditions
      expect(isValid(definitions, '0.5')).toBe(true);
      expect(isValid(definitions, '.9')).toBe(true);
      expect(isValid(definitions, '1')).toBe(true);
      expect(isValid(definitions, '-1')).toBe(false);

      // expected false conditions
      expect(isValid(definitions, '')).toBe(false);
      expect(isValid(definitions, 'anything')).toBe(false);
      expect(isValid(definitions, '2.1')).toBe(false);
      expect(isValid(definitions, '1.99')).toBe(false);
      expect(isValid(definitions, '1.01')).toBe(false);
    });
  });

  describe('azimuthValidationDefs', () => {
    it('validates incoming value', () => {
      // eventData;
      const definitions = azimuthValidationDefs(true);

      // expected true conditions
      expect(isValid(definitions, '0.5')).toBe(true);
      expect(isValid(definitions, '1')).toBe(true);
      expect(isValid(definitions, '-1')).toBe(true);
      expect(isValid(definitions, '360')).toBe(true);
      expect(isValid(definitions, '-360')).toBe(true);

      // expected false conditions
      expect(isValid(definitions, '')).toBe(false);
      expect(isValid(definitions, 'anything')).toBe(false);
      expect(isValid(definitions, '361')).toBe(false);
      expect(isValid(definitions, '-361')).toBe(false);
    });
  });

  describe('channel validation definitions', () => {
    it('is defined', () => {
      expect(channelValidationDefs(true)).toBeDefined();
      expect(channelValidationDefs(false)).toBeDefined();
    });
    const mockStationPhaseConfig = {
      channelOrientationTolerance: 1,
      channelSampleRateTolerance: 1,
      locationToleranceKm: 0.5
    };
    const getMockStationPhaseConfig = jest.fn(() => mockStationPhaseConfig);
    const mockValidationDefinitions = [...channelValidationDefs(true)(getMockStationPhaseConfig)];
    it('does not return a message if no channels are selected', () => {
      expect(mockValidationDefinitions).toMatchSnapshot();
    });
    it('returns false(valid) for target channels that fail validation with target stations', () => {
      const mockState: RotationDialogState = {
        targetChannels: [],
        targetStations: [asar],
        validStations: [asar]
      } as any;
      expect(mockValidationDefinitions[1].valueIsInvalid(mockState)).toBe(false);
    });
    it('throws if not given fully populated channels', () => {
      const facetedChannel: EntityReference<'name'> = {
        name: 'ASAR.AS01.BHN'
      };
      const mockState: RotationDialogState = {
        targetChannels: [facetedChannel],
        targetStations: [asar],
        validStations: [asar]
      } as any;
      expect(() => mockValidationDefinitions[1].valueIsInvalid(mockState)).toThrow(
        'Cannot validate entity reference channels. Validation requires fully populated channels.'
      );
    });
    it('returns true(Invalid) if given two channels that are from different stations', () => {
      const mockState: RotationDialogState = {
        targetChannels: [PD01Channel, akasgBHEChannel],
        targetStations: [pdar]
      } as any;
      expect(mockValidationDefinitions[1].valueIsInvalid(mockState)).toBe(true);
    });
    it('returns an true(Invalid) if given a channel from a different station', () => {
      const mockState: RotationDialogState = {
        targetChannels: [PD01Channel],
        targetStations: [asar],
        validStations: [asar]
      } as any;
      expect(mockValidationDefinitions[2].valueIsInvalid(mockState)).toBe(true);
    });
    it('returns true(Invalid) if given too many channels', () => {
      const mockState: RotationDialogState = {
        targetChannels: [PD01Channel, PD02Channel, PD03Channel],
        targetStations: [pdar]
      } as any;
      expect(mockValidationDefinitions[3].valueIsInvalid(mockState)).toBe(true);
    });
    it('returns true(Invalid) if given 1 channel', () => {
      const mockState: RotationDialogState = {
        targetChannels: [PD01Channel],
        targetStations: [pdar]
      } as any;
      expect(
        mockValidationDefinitions
          .find(def => {
            if (typeof def.invalidMessage !== 'function') {
              return def.invalidMessage.summary === 'Not enough channels selected';
            }
            return false;
          })
          .valueIsInvalid(mockState)
      ).toBe(true);
    });
    it('returns true(Invalid) if given channels out of sample rate tolerance', () => {
      const mockState: RotationDialogState = {
        targetChannels: [{ ...akasgBHEChannel, nominalSampleRateHz: 80 }, { ...akasgBHEChannel }],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[4].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[4].invalidMessage === 'function'
          ? mockValidationDefinitions[4].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must have a sample rate within a tolerance of 1hz. AKASG.AKBB.BHE has a sample rate of 80hz, and AKASG.AKBB.BHE has a sample rate of 100hz"`
      );
    });
    it('returns true(Invalid) if given channels with exactly the same angle', () => {
      const mockState: RotationDialogState = {
        targetChannels: [{ ...akasgBHEChannel }, { ...akasgBHEChannel }],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[5].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[5].invalidMessage === 'function'
          ? mockValidationDefinitions[5].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must be orthogonal. AKASG.AKBB.BHE has a horizontal orientation angle of 90°, and AKASG.AKBB.BHE has a horizontal angle of 90°"`
      );
    });
    it('returns true(Invalid) if given channels that are not orthogonal within tolerance', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            nominalSampleRateHz: 40, // force these to align so we can test other issues
            orientationAngles: {
              horizontalAngleDeg: 92.1,
              verticalAngleDeg: 90
            }
          },
          {
            ...akasgBHNChannel,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[6].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[6].invalidMessage === 'function'
          ? mockValidationDefinitions[6].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must be orthogonal within a tolerance of 1°. AKASG.AKBB.BHE has a horizontal orientation angle of 92.1°, and AKASG.AKASG.BHN has a horizontal angle of 0°"`
      );
    });
    it('returns true(Invalid) if the first channel is not within vertical tolerance', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            nominalSampleRateHz: 40, // force these to align so we can test other issues
            orientationAngles: {
              horizontalAngleDeg: 90,
              verticalAngleDeg: 98.6
            }
          },
          { ...akasgBHNChannel, nominalSampleRateHz: 40 }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[7].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[7].invalidMessage === 'function'
          ? mockValidationDefinitions[7].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must have a vertical angle within a tolerance of 1°. AKASG.AKBB.BHE has a vertical orientation angle of of 98.6°"`
      );
    });
    it('returns true(Invalid) if the second channel is not within vertical tolerance', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            nominalSampleRateHz: 40, // force these to align so we can test other issues
            orientationAngles: {
              horizontalAngleDeg: 90,
              verticalAngleDeg: 90
            }
          },
          {
            ...akasgBHNChannel,
            nominalSampleRateHz: 40, // force these to align so we can test other issues
            orientationAngles: {
              horizontalAngleDeg: 0,
              verticalAngleDeg: 87.5
            }
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[8].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[8].invalidMessage === 'function'
          ? mockValidationDefinitions[8].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must have a vertical angle within a tolerance of 1°. AKASG.AKASG.BHN has a vertical orientation angle of of 90°"`
      );
    });
    it('returns true(Invalid) if the orientation codes are not compatible', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            channelOrientationCode: 'E',
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          },
          {
            ...akasgBHNChannel,
            channelOrientationCode: '2',
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[9].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[9].invalidMessage === 'function'
          ? mockValidationDefinitions[9].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels have different orientation codes. AKASG.AKBB.BHE has code E, and AKASG.AKASG.BHN has code 2."`
      );
    });
    it('returns true(Invalid) if the units are not compatible', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            units: Units.NANOMETERS_PER_COUNT,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          },
          {
            ...akasgBHNChannel,
            units: Units.NANOMETERS_PER_SECOND,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[10].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[10].invalidMessage === 'function'
          ? mockValidationDefinitions[10].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels have different units. AKASG.AKBB.BHE uses NANOMETERS_PER_COUNT, and AKASG.AKASG.BHN uses NANOMETERS_PER_SECOND."`
      );
    });
    it('returns true(Invalid) if the instrument codes are not compatible', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            channelInstrumentType: ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          },
          {
            ...akasgBHNChannel,
            channelInstrumentType: ChannelInstrumentType.LOW_GAIN_SEISMOMETER,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[11].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[11].invalidMessage === 'function'
          ? mockValidationDefinitions[11].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels have different instrument types. AKASG.AKBB.BHE has instrument type HIGH_GAIN_SEISMOMETER, and AKASG.AKASG.BHN has instrument type LOW_GAIN_SEISMOMETER."`
      );
    });
    it('returns true(Invalid) if the band codes are not compatible', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            channelBandType: ChannelBandType.HIGH_BROADBAND,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          },
          {
            ...akasgBHNChannel,
            channelBandType: ChannelBandType.BROADBAND,
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[12].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[12].invalidMessage === 'function'
          ? mockValidationDefinitions[12].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels have different band codes. AKASG.AKBB.BHE has band code HIGH_BROADBAND, and AKASG.AKASG.BHN has band code BROADBAND."`
      );
    });
    it('returns true(Invalid) if the locations are out of tolerance', () => {
      const mockState: RotationDialogState = {
        targetChannels: [
          {
            ...akasgBHEChannel,
            location: {
              latitudeDegrees: 53.7012,
              longitudeDegrees: 29.2242,
              depthKm: 0.035,
              elevationKm: 0.16
            },
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          },
          {
            ...akasgBHNChannel,
            location: {
              latitudeDegrees: 50.7012,
              longitudeDegrees: 29.2242,
              depthKm: 0.035,
              elevationKm: 0.16
            },
            nominalSampleRateHz: 40 // force these to align so we can test other issues
          }
        ],
        targetStations: [akasg],
        validStations: [akasg]
      } as any;
      expect(mockValidationDefinitions[13].valueIsInvalid(mockState)).toBe(true);
      expect(
        typeof mockValidationDefinitions[13].invalidMessage === 'function'
          ? mockValidationDefinitions[13].invalidMessage(mockState).details
          : {}
      ).toMatchInlineSnapshot(
        `"Channels must have locations within a tolerance of 0.5km. AKASG.AKBB.BHE and AKASG.AKASG.BHN longitudes differ by 333.5848"`
      );
    });
  });
});
