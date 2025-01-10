import type { ChannelTypes } from '@gms/common-model';
import {
  asar,
  asarAS01Channel,
  asarAS02Channel,
  eventBeamDefinition,
  eventBeamformingTemplate,
  PD01Channel,
  PD02Channel,
  pdar
} from '@gms/common-model/__tests__/__data__';
import { Units } from '@gms/common-model/lib/common/types';
import {
  ChannelBandType,
  ChannelInstrumentType
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import { predictFeaturesForEventLocationResponseData } from '@gms/ui-state/__tests__/__data__';
import cloneDeep from 'lodash/cloneDeep';

import {
  eventBeamParamValidation,
  validateEventBeamChannelSelection,
  validateEventBeamGroundMotion,
  validateSingleStationEventBeamParam
} from '~analyst-ui/components/waveform/components/waveform-controls/event-beam-dialog/event-beam-utils';

const mockChannels = [cloneDeep(PD01Channel), cloneDeep(PD01Channel)];

const mockEmptyResponse = {
  data: undefined,
  isError: false,
  isLoading: false,
  pending: 0,
  fulfilled: 0,
  rejected: 0
};

const mockLoadingResponse = {
  data: undefined,
  isError: false,
  isLoading: true,
  pending: 1,
  fulfilled: 0,
  rejected: 0
};

const mockBeamformingTemplateResponse = {
  data: { PDAR: { P: eventBeamformingTemplate } },
  isError: false,
  isLoading: false,
  pending: 0,
  fulfilled: 1,
  rejected: 0
};

const mockFeaturePredictionResponse = {
  data: predictFeaturesForEventLocationResponseData,
  isError: false,
  isLoading: false,
  pending: 0,
  fulfilled: 1,
  rejected: 0
};

describe('Event beam utils', () => {
  describe('validateEventBeamGroundMotion', () => {
    it('returns an error if band type is different', () => {
      const badChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        channelBandType: ChannelBandType.HIGH_BROADBAND
      };
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns an error if instrument type is different', () => {
      const badChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        channelInstrumentType: ChannelInstrumentType.BOLOMETER
      };

      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns an error if units is different', () => {
      const badChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        units: Units.COUNTS_PER_PASCAL
      };
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns an error if orientation code is different', () => {
      const badChannel: ChannelTypes.Channel = { ...PD01Channel, channelOrientationCode: '1' };
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns an error if horizontal angle is out of tolerance', () => {
      const badChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        orientationAngles: { horizontalAngleDeg: 90, verticalAngleDeg: 0 }
      };
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns an error if vertical angle is out of tolerance', () => {
      const badChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        orientationAngles: { horizontalAngleDeg: -1, verticalAngleDeg: 90 }
      };
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, badChannel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toMatchSnapshot();
    });

    it('returns null if everything is valid', () => {
      expect(
        validateEventBeamGroundMotion(
          [...mockChannels, PD01Channel],
          eventBeamDefinition.beamParameters.orientationAngleToleranceDeg,
          PD01Channel.orientationAngles
        )
      ).toBeNull();
    });
  });
  describe('validateSingleStationEventBeamParam', () => {
    it('returns an error if too few channels are given', () => {
      expect(
        validateSingleStationEventBeamParam([mockChannels[0]], eventBeamformingTemplate)
      ).toMatchSnapshot();
    });
    it('returns an error if sample rates are out of tolerance', () => {
      const badSampleRateChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        nominalSampleRateHz: 40
      };
      expect(
        validateSingleStationEventBeamParam(
          [...mockChannels, badSampleRateChannel],
          eventBeamformingTemplate
        )
      ).toMatchSnapshot();
    });

    it('returns null if everything is valid', () => {
      expect(
        validateSingleStationEventBeamParam(
          [...mockChannels, PD01Channel],
          eventBeamformingTemplate
        )
      ).toBeNull();
    });
  });

  describe('validateEventBeamChannelSelection', () => {
    it('returns null if nothing is selected', () => {
      expect(validateEventBeamChannelSelection([], [])).toBeNull();
    });
    it('returns null if only stations are selected', () => {
      expect(validateEventBeamChannelSelection([], [pdar, asar])).toBeNull();
    });

    it('returns null if only channels are selected that all share a station', () => {
      expect(validateEventBeamChannelSelection([PD01Channel, PD02Channel], [pdar])).toBeNull();
      expect(validateEventBeamChannelSelection([PD01Channel, PD02Channel], [])).toBeNull();
    });

    it('returns an error if channel are selected when multiple stations are selected', () => {
      expect(
        validateEventBeamChannelSelection([PD01Channel, PD02Channel], [pdar, asar])
      ).toMatchSnapshot();
    });

    it('returns an error if channels that do not share a station are selected', () => {
      expect(
        validateEventBeamChannelSelection([PD01Channel, asarAS01Channel], [])
      ).toMatchSnapshot();
    });

    it('returns an error if channels and a station are selected that do not match', () => {
      expect(
        validateEventBeamChannelSelection([asarAS01Channel, asarAS02Channel], [pdar])
      ).toMatchSnapshot();
    });
  });

  describe('eventBeamParamValidation', () => {
    it('returns null if nothing is selected', () => {
      expect(
        eventBeamParamValidation(
          [],
          [],
          'P',
          mockBeamformingTemplateResponse,
          mockFeaturePredictionResponse
        )
      ).toBeNull();
    });

    describe('station checks', () => {
      it('returns a loading warning if beam template loading flag is true and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [pdar],
            [],
            'P',
            mockLoadingResponse,
            mockFeaturePredictionResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a loading warning if feature prediction loading flag is true and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [pdar],
            [],
            'P',
            mockBeamformingTemplateResponse,
            mockLoadingResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a data error warning if beam template loading flag is false and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [pdar],
            [],
            'P',
            mockEmptyResponse,
            mockFeaturePredictionResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a data error warning if feature prediction loading flag is false and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [pdar],
            [],
            'P',
            mockBeamformingTemplateResponse,
            mockEmptyResponse
          )
        ).toMatchSnapshot();
      });
    });

    describe('channel checks', () => {
      it('returns a loading warning if beam template loading flag is true and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [],
            pdar.allRawChannels,
            'P',
            mockLoadingResponse,
            mockFeaturePredictionResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a loading warning if feature prediction loading flag is true and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [],
            pdar.allRawChannels,
            'P',
            mockBeamformingTemplateResponse,
            mockLoadingResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a data error warning if beam template loading flag is false and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [],
            pdar.allRawChannels,
            'P',
            mockEmptyResponse,
            mockFeaturePredictionResponse
          )
        ).toMatchSnapshot();
      });

      it('returns a data error warning if feature prediction loading flag is false and data is missing', () => {
        expect(
          eventBeamParamValidation(
            [],
            pdar.allRawChannels,
            'P',
            mockBeamformingTemplateResponse,
            mockEmptyResponse
          )
        ).toMatchSnapshot();
      });
    });
  });
});
