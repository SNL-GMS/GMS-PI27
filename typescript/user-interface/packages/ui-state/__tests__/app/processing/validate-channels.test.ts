/* eslint-disable jest/no-conditional-expect */
import { PD01Channel, PD02Channel, PD03Channel, pdar } from '@gms/common-model/__tests__/__data__';
import { Units } from '@gms/common-model/lib/common';
import {
  ChannelBandType,
  ChannelInstrumentType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';

import {
  areOrientationCodesCompatible,
  validateChannels
} from '../../../src/ts/app/processing/validate-channels';
import {} from '../../../src/ts/app/util/util';
import { defaultSpectraDefinition } from '../../__data__';

describe('validate channels', () => {
  it('areOrientationCodesCompatible returns true for compatible codes and false for everything else', () => {
    expect(areOrientationCodesCompatible('Z', '3')).toBeTruthy();
    expect(areOrientationCodesCompatible('N', '1')).toBeTruthy();
    expect(areOrientationCodesCompatible('E', '2')).toBeTruthy();
    expect(areOrientationCodesCompatible('Z', '1')).toBeFalsy();
  });

  describe('validateChannels', () => {
    it('input channels have invalid sample rate', () => {
      expect(() => {
        try {
          validateChannels(
            {
              sampleRateHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
              sampleRateToleranceHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate
                  .waveformSampleRateToleranceHz,
              orientationAngles: defaultSpectraDefinition.orientationAngles,
              orientationAngleToleranceDeg:
                defaultSpectraDefinition.fkParameters.orientationAngleToleranceDeg
            },
            [
              { ...PD01Channel, nominalSampleRateHz: undefined },
              { ...PD02Channel, nominalSampleRateHz: 15 },
              { ...PD03Channel, nominalSampleRateHz: 25 }
            ],
            pdar.name
          );
        } catch (error) {
          expect(error).toMatchInlineSnapshot(`[Error: Incompatible channels for PDAR]`);
          expect(error.details).toMatchInlineSnapshot(
            `"Sample rates outside of tolerance (20.000+/-1 hz): PDAR.PD01.SHZ (undefined), PDAR.PD02.SHZ (15), PDAR.PD03.SHZ (25)."`
          );
          throw error;
        }
      }).toThrow('Incompatible channels for PDAR');
    });

    it('input channels have mismatched units', () => {
      expect(() => {
        try {
          validateChannels(
            {
              sampleRateHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
              sampleRateToleranceHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate
                  .waveformSampleRateToleranceHz,
              orientationAngles: defaultSpectraDefinition.orientationAngles,
              orientationAngleToleranceDeg:
                defaultSpectraDefinition.fkParameters.orientationAngleToleranceDeg
            },
            [
              PD01Channel,
              { ...PD02Channel, units: Units.DEGREES },
              { ...PD03Channel, channelBandType: ChannelBandType.LONG_PERIOD },
              { ...PD03Channel, channelInstrumentType: ChannelInstrumentType.LOW_GAIN_SEISMOMETER },
              { ...PD03Channel, channelOrientationCode: 'J' }
            ],
            pdar.name
          );
        } catch (error) {
          expect(error).toMatchInlineSnapshot(`[Error: Incompatible channels for PDAR]`);
          expect(error.details).toMatchInlineSnapshot(
            `"Inconsistent types of ground motion: PDAR.PD01.SHZ (band type: SHORT_PERIOD instrument type: HIGH_GAIN_SEISMOMETER units: NANOMETERS_PER_COUNT orientation code: Z horizontal angle: -1 ), PDAR.PD02.SHZ (band type: SHORT_PERIOD instrument type: HIGH_GAIN_SEISMOMETER units: DEGREES orientation code: Z horizontal angle: -1 ), PDAR.PD03.SHZ (band type: LONG_PERIOD instrument type: HIGH_GAIN_SEISMOMETER units: NANOMETERS_PER_COUNT orientation code: Z horizontal angle: -1 ), PDAR.PD03.SHZ (band type: SHORT_PERIOD instrument type: LOW_GAIN_SEISMOMETER units: NANOMETERS_PER_COUNT orientation code: Z horizontal angle: -1 ), PDAR.PD03.SHZ (band type: SHORT_PERIOD instrument type: HIGH_GAIN_SEISMOMETER units: NANOMETERS_PER_COUNT orientation code: J horizontal angle: -1 )"`
          );
          throw error;
        }
      }).toThrow('Incompatible channels for PDAR');
    });

    it('fkDefinition horizontalAngle undefined', () => {
      expect(() => {
        try {
          validateChannels(
            {
              sampleRateHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
              sampleRateToleranceHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate
                  .waveformSampleRateToleranceHz,
              orientationAngles: {
                horizontalAngleDeg: undefined,
                verticalAngleDeg: 2
              },
              orientationAngleToleranceDeg:
                defaultSpectraDefinition.fkParameters.orientationAngleToleranceDeg
            },
            [PD01Channel, PD02Channel, PD03Channel],
            pdar.name
          );
        } catch (error) {
          expect(error).toMatchInlineSnapshot(`[Error: Incompatible channels for PDAR]`);
          expect(error.details).toMatchInlineSnapshot(
            `"Inconsistent types of ground motion: PDAR.PD01.SHZ (horizontal angle: -1 vertical angle: 0 ), PDAR.PD02.SHZ (horizontal angle: -1 vertical angle: 0 ), PDAR.PD03.SHZ (horizontal angle: -1 vertical angle: 0 )"`
          );
          throw error;
        }
      }).toThrow('Incompatible channels for PDAR');
    });

    it('fkDefinition verticalAngle undefined', () => {
      expect(() => {
        try {
          validateChannels(
            {
              sampleRateHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
              sampleRateToleranceHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate
                  .waveformSampleRateToleranceHz,
              orientationAngles: {
                horizontalAngleDeg: 2,
                verticalAngleDeg: undefined
              },
              orientationAngleToleranceDeg:
                defaultSpectraDefinition.fkParameters.orientationAngleToleranceDeg
            },
            [PD01Channel, PD02Channel, PD03Channel],
            pdar.name
          );
        } catch (error) {
          expect(error).toMatchInlineSnapshot(`[Error: Incompatible channels for PDAR]`);
          expect(error.details).toMatchInlineSnapshot(
            `"Inconsistent types of ground motion: PDAR.PD01.SHZ (horizontal angle: -1 vertical angle: 0 ), PDAR.PD02.SHZ (horizontal angle: -1 vertical angle: 0 ), PDAR.PD03.SHZ (horizontal angle: -1 vertical angle: 0 )"`
          );
          throw error;
        }
      }).toThrow('Incompatible channels for PDAR');
    });

    it('input channels have invalid orientationAngles', () => {
      expect(() => {
        try {
          validateChannels(
            {
              sampleRateHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate.waveformSampleRateHz,
              sampleRateToleranceHz:
                defaultSpectraDefinition.fkParameters.waveformSampleRate
                  .waveformSampleRateToleranceHz,
              orientationAngles: defaultSpectraDefinition.orientationAngles,
              orientationAngleToleranceDeg:
                defaultSpectraDefinition.fkParameters.orientationAngleToleranceDeg
            },
            [
              { ...PD01Channel, orientationAngles: undefined },
              {
                ...PD02Channel,
                orientationAngles: { horizontalAngleDeg: undefined, verticalAngleDeg: 2 }
              },
              {
                ...PD03Channel,
                orientationAngles: { horizontalAngleDeg: 2, verticalAngleDeg: undefined }
              },
              {
                ...PD03Channel,
                orientationAngles: { horizontalAngleDeg: 80, verticalAngleDeg: 0 }
              },
              {
                ...PD03Channel,
                orientationAngles: { horizontalAngleDeg: 100, verticalAngleDeg: 0 }
              },
              {
                ...PD03Channel,
                orientationAngles: { horizontalAngleDeg: 80, verticalAngleDeg: -10 }
              },
              {
                ...PD03Channel,
                orientationAngles: { horizontalAngleDeg: 100, verticalAngleDeg: 10 }
              }
            ],
            pdar.name
          );
        } catch (error) {
          expect(error).toMatchInlineSnapshot(`[Error: Incompatible channels for PDAR]`);
          expect(error.details).toMatchInlineSnapshot(
            `"Inconsistent types of ground motion: PDAR.PD01.SHZ (horizontal angle: undefined vertical angle: undefined ), PDAR.PD02.SHZ (horizontal angle: undefined vertical angle: 2 ), PDAR.PD03.SHZ (horizontal angle: 2 vertical angle: undefined ), PDAR.PD03.SHZ (horizontal angle: 80 vertical angle: 0 ), PDAR.PD03.SHZ (horizontal angle: 100 vertical angle: 0 ), PDAR.PD03.SHZ (horizontal angle: 80 vertical angle: -10 ), PDAR.PD03.SHZ (horizontal angle: 100 vertical angle: 10 )"`
          );
          throw error;
        }
      }).toThrow('Incompatible channels for PDAR');
    });
  });
});
