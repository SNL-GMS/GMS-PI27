import { ChannelTypes } from '@gms/common-model';
import {
  akasg,
  akasgBHZChannel,
  asar,
  eventData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { RotationConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { testChannel } from '@gms/ui-state/__tests__/__data__/channel-data';

import {
  canChannelBeRotated,
  doesStationHaveRotatableChannels,
  getDefaultInputMode,
  getDefaultInterpolation,
  getDefaultLeadDurationMode,
  getDefaultRotationPhase,
  getDefaultSteeringMode,
  getShouldStationBeShownInSelector,
  getStationFromSD,
  getStationsFromSignalDetections
} from '~analyst-ui/components/waveform/components/waveform-controls/rotation-dialog/rotation-dialog-util';

const testRotationConfig: RotationConfiguration = {
  rotationReplacementAzimuthToleranceDeg: 0,
  /** Default lead time in seconds used if none found per station/phase */
  defaultRotationLeadTime: 0,

  /** Default duration in seconds used if none found per station/phase */
  defaultRotationDuration: 0,

  /** Default interpolation method if none found per station/phase */
  defaultRotationInterpolation: 'INTERPOLATED',

  /** Default phase to use per activity */
  defaultRotationPhaseByActivity: [],

  /** Friendly names of interpolation methods */
  interpolationMethods: {
    NEAREST_SAMPLE: '',
    INTERPOLATED: ''
  },

  /** Detailed help text describing how rotation works for the dialog tooltip */
  rotationDescription: 'test'
};

describe('rotation dialog utils', () => {
  describe('canChannelBeRotated', () => {
    it('is defined', () => {
      expect(canChannelBeRotated).toBeDefined();
    });

    it('should return true if the channel can be rotated', () => {
      const channel = { ...testChannel };

      channel.name = 'ARCES.ARA0.BHN';
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.name = 'ARCES.ARA0.BHE';
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.name = 'ARCES.ARA0.BH1';
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.name = 'ARCES.ARA0.BH2';
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.name = 'ARCES.ARA0.TEST';
      channel.channelOrientationType = ChannelTypes.ChannelOrientationType.NORTH_SOUTH;
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.channelOrientationType = ChannelTypes.ChannelOrientationType.EAST_WEST;
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.channelOrientationType = ChannelTypes.ChannelOrientationType.ORTHOGONAL_1;
      expect(canChannelBeRotated(channel)).toBe(true);

      channel.channelOrientationType = ChannelTypes.ChannelOrientationType.ORTHOGONAL_2;
      expect(canChannelBeRotated(channel)).toBe(true);
    });

    it('should return false if the channel can not be rotated', () => {
      const channel = { ...testChannel };

      channel.name = 'ARCES.ARA0.TEST';
      channel.channelOrientationType = ChannelTypes.ChannelOrientationType.RADIAL;
      expect(canChannelBeRotated(channel)).toBe(false);
    });
  });

  describe('doesStationHaveRotatableChannels', () => {
    it('is defined', () => {
      expect(doesStationHaveRotatableChannels).toBeDefined();
    });

    it('should return true if the station does have rotatable channels', () => {
      expect(doesStationHaveRotatableChannels(akasg)).toBe(true);
    });

    it('should return false if the station does not have rotatable channels', () => {
      const badStation = { ...akasg };

      badStation.allRawChannels = [];
      expect(doesStationHaveRotatableChannels(badStation)).toBe(false);

      badStation.allRawChannels = [akasgBHZChannel];
      expect(doesStationHaveRotatableChannels(badStation)).toBe(false);
    });
  });

  describe('getStationsFromSignalDetections', () => {
    it('should be defined', () => {
      expect(getStationsFromSignalDetections).toBeDefined();
    });

    it('should get an array of station names from an array of signal detections', () => {
      const getter1 = getStationsFromSignalDetections([]);
      expect(getter1(asar)).toEqual([]);

      const getter2 = getStationsFromSignalDetections(signalDetectionsData);
      expect(getter2(asar)).toHaveLength(3);
    });
  });

  describe('getShouldStationBeShownInSelector', () => {
    it('should be defined', () => {
      expect(getShouldStationBeShownInSelector).toBeDefined();
    });

    it('should return true if the station should be shown', () => {
      const shouldStationBeShown = getShouldStationBeShownInSelector(signalDetectionsData);
      expect(shouldStationBeShown(asar)).toBe(true);
    });

    it('should return false if the station should not be shown', () => {
      const testStation = { ...akasg };
      testStation.name = 'TEST';
      testStation.allRawChannels = [];

      const shouldStationBeShown = getShouldStationBeShownInSelector(signalDetectionsData);
      expect(shouldStationBeShown(testStation)).toBe(false);
    });
  });

  describe('getDefaultInterpolation', () => {
    it('should be defined', () => {
      expect(getDefaultInterpolation).toBeDefined();
    });

    it('should return the correct default interpolation value', () => {
      expect(getDefaultInterpolation(null, testRotationConfig)).toBe('INTERPOLATED');

      expect(getDefaultInterpolation(eventData, testRotationConfig)).toBe('default-station-phase');
    });
  });

  describe('getDefaultSteeringMode', () => {
    it('should be defined', () => {
      expect(getDefaultSteeringMode).toBeDefined();
    });

    it('should get the default steering mode', () => {
      expect(getDefaultSteeringMode(undefined)).toBe('reference-location');
      expect(getDefaultSteeringMode([])).toBe('reference-location');
      expect(getDefaultSteeringMode(signalDetectionsData)).toBe('measured-azimuth');
    });
  });

  describe('getDefaultLeadDurationMode', () => {
    it('should be defined', () => {
      expect(getDefaultLeadDurationMode).toBeDefined();
    });

    it('should get the default lead duration mode', () => {
      expect(getDefaultLeadDurationMode(null, 'signal-detection-mode')).toBe(
        'default-station-phase'
      );
      expect(getDefaultLeadDurationMode(eventData, 'station-phase-mode')).toBe(
        'default-station-phase'
      );
      expect(getDefaultLeadDurationMode(null, 'station-phase-mode')).toBe('custom-lead-duration');
    });
  });

  describe('getDefaultInputMode', () => {
    it('should be defined', () => {
      expect(getDefaultInputMode).toBeDefined();
    });

    it('should get the default input mode', () => {
      expect(getDefaultInputMode(undefined)).toBe('station-phase-mode');
      expect(getDefaultInputMode([])).toBe('station-phase-mode');
      expect(getDefaultInputMode(signalDetectionsData)).toBe('signal-detection-mode');
    });
  });

  describe('getDefaultRotationPhase', () => {
    it('should be defined', () => {
      expect(getDefaultRotationPhase).toBeDefined();
    });

    it('should get the default rotation phase', () => {
      expect(getDefaultRotationPhase([], testRotationConfig)).toBe('S');

      const customConfig = { ...testRotationConfig };
      customConfig.defaultRotationPhaseByActivity = [
        {
          workflowDefinitionId: 'A',
          defaultRotationPhase: 'P'
        },
        {
          workflowDefinitionId: 'B',
          defaultRotationPhase: 'T'
        }
      ];

      expect(getDefaultRotationPhase(['A', 'B'], customConfig)).toBe('P');
      expect(getDefaultRotationPhase(['B'], customConfig)).toBe('T');
    });
  });

  describe('getStationFromSD', () => {
    it('finds station given an SD', () => {
      const signalDetection = signalDetectionsData[0];
      const visibleStations = [asar];
      const result = getStationFromSD(signalDetection, visibleStations);
      expect(result).toBe(asar);
    });

    it('returns undefined if station not found', () => {
      const signalDetection = signalDetectionsData[0];
      const visibleStations = [];
      const result = getStationFromSD(signalDetection, visibleStations);
      expect(result).toBeUndefined();
    });
  });
});
