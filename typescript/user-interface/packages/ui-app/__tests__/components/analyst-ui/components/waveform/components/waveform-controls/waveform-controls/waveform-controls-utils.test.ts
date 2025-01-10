/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { ChannelTypes, CommonTypes } from '@gms/common-model';
import {
  areChannelLocationsWithinTolerance,
  areChannelOrientationCodesCompatible,
  areChannelsOrthogonal,
  areChannelsWithinSampleRateTolerance,
  isChannelWithinVerticalTolerance
} from '@gms/ui-state';

describe('Waveform controls utils', () => {
  describe('areChannelsOrthogonal', () => {
    const areChannelsWithinOneDegreeOfOrthogonal = areChannelsOrthogonal(1);
    it('returns true when channels are orthogonal with angles 0 and 90', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { horizontalAngleDeg: 0 } };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 90 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns true when channels are orthogonal with angles 0 and 270', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { horizontalAngleDeg: 0 } };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 270 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns true when channels are orthogonal with angles 1 and 270 with a tolerance of 1', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { horizontalAngleDeg: 1 } };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 270 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns false when channels are not orthogonal with angles 0 and 98 with a tolerance of 1', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { horizontalAngleDeg: 0 } };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 98 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
    });
    it('returns false when channels are not orthogonal with angles 359 and 98 with a tolerance of 1', () => {
      const chan1: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 359 }
      };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 98 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
    });
    it('returns false when channels are not orthogonal with angles 70 and 98 with a tolerance of 1', () => {
      const chan1: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 70 }
      };
      const chan2: Partial<ChannelTypes.Channel> = {
        orientationAngles: { horizontalAngleDeg: 98 }
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
    });
    it('returns null when a value is not defined', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { horizontalAngleDeg: 0 } };
      const chan2: Partial<ChannelTypes.Channel> = {
        name: 'foo'
      };
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
      expect(
        areChannelsWithinOneDegreeOfOrthogonal(chan2 as ChannelTypes.Channel)(
          chan1 as ChannelTypes.Channel
        )
      ).toBe(false);
    });
  });
  describe('areChannelsWithinSampleRateTolerance', () => {
    it('returns true with values are the same', () => {
      const chan1: Partial<ChannelTypes.Channel> = { nominalSampleRateHz: 40 };
      const chan2: Partial<ChannelTypes.Channel> = {
        nominalSampleRateHz: 40
      };
      expect(
        areChannelsWithinSampleRateTolerance(5)(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns true with values are within tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { nominalSampleRateHz: 41 };
      const chan2: Partial<ChannelTypes.Channel> = {
        nominalSampleRateHz: 44
      };
      expect(
        areChannelsWithinSampleRateTolerance(5)(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns true when the difference between the values is equal to the tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { nominalSampleRateHz: 45 };
      const chan2: Partial<ChannelTypes.Channel> = {
        nominalSampleRateHz: 40
      };
      expect(
        areChannelsWithinSampleRateTolerance(5)(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('returns false when the difference between the values is greater than the tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { nominalSampleRateHz: 46 };
      const chan2: Partial<ChannelTypes.Channel> = {
        nominalSampleRateHz: 40
      };
      expect(
        areChannelsWithinSampleRateTolerance(5)(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
    });
  });
  describe('isChannelWithinVerticalTolerance', () => {
    it('Correctly identifies when a channel has a vertical angle of 90', () => {
      const chan: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 90 } };

      expect(isChannelWithinVerticalTolerance(5)(chan as ChannelTypes.Channel)).toBe(true);
    });
    it('Correctly identifies when a channel has a vertical angle within tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 93 } };
      const chan2: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 87 } };

      expect(isChannelWithinVerticalTolerance(5)(chan1 as ChannelTypes.Channel)).toBe(true);
      expect(isChannelWithinVerticalTolerance(5)(chan2 as ChannelTypes.Channel)).toBe(true);
    });
    it('Correctly identifies when a channel has a vertical angle exactly at tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 96 } };
      const chan2: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 84 } };

      expect(isChannelWithinVerticalTolerance(5)(chan1 as ChannelTypes.Channel)).toBe(false);
      expect(isChannelWithinVerticalTolerance(5)(chan2 as ChannelTypes.Channel)).toBe(false);
    });
    it('Correctly identifies when a channel has a vertical angle out of tolerance', () => {
      const chan1: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 95 } };
      const chan2: Partial<ChannelTypes.Channel> = { orientationAngles: { verticalAngleDeg: 85 } };

      expect(isChannelWithinVerticalTolerance(5)(chan1 as ChannelTypes.Channel)).toBe(true);
      expect(isChannelWithinVerticalTolerance(5)(chan2 as ChannelTypes.Channel)).toBe(true);
    });
  });
  describe('areChannelLocationsWithinTolerance', () => {
    const checkToleranceWithin1Km = areChannelLocationsWithinTolerance(1);
    it('correctly identifies that channels are within tolerance if they have the same value', () => {
      const chan1: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 95.678, longitudeDegrees: 123.45 } as CommonTypes.Location
      };
      const chan2: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 95.678, longitudeDegrees: 123.45 } as CommonTypes.Location
      };
      expect(
        checkToleranceWithin1Km(chan1 as ChannelTypes.Channel)(chan2 as ChannelTypes.Channel)
      ).toBe(true);
    });
    it('identifies London (0° longitude) to Kisumu (0° latitude) as out of a 1km tolerance', () => {
      const london: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 51.5072, longitudeDegrees: 0 } as CommonTypes.Location
      };
      const kimsu: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 0, longitudeDegrees: 34.768 } as CommonTypes.Location
      };
      expect(
        checkToleranceWithin1Km(london as ChannelTypes.Channel)(kimsu as ChannelTypes.Channel)
      ).toBe(false);
    });
    it('identifies London (0° longitude) to Kisumu (0° latitude) as within a 6600 km tolerance', () => {
      const checkToleranceWithin6600Km = areChannelLocationsWithinTolerance(6600);

      const london: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 51.5072, longitudeDegrees: 0 } as CommonTypes.Location
      };
      const kimsu: Partial<ChannelTypes.Channel> = {
        location: { latitudeDegrees: 0, longitudeDegrees: 34.768 } as CommonTypes.Location
      };

      expect(
        checkToleranceWithin6600Km(london as ChannelTypes.Channel)(kimsu as ChannelTypes.Channel)
      ).toBe(true);
    });
    it('works in the southern hemisphere', () => {
      const checkToleranceWithin65Km = areChannelLocationsWithinTolerance(65);

      const melbourne: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: -37.81625,
          longitudeDegrees: 144.964029
        } as CommonTypes.Location
      };
      const geelong: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: -38.149331,
          longitudeDegrees: 144.359815
        } as CommonTypes.Location
      };
      expect(
        checkToleranceWithin1Km(melbourne as ChannelTypes.Channel)(geelong as ChannelTypes.Channel)
      ).toBe(false);
      expect(
        checkToleranceWithin65Km(melbourne as ChannelTypes.Channel)(geelong as ChannelTypes.Channel)
      ).toBe(true);
    });
    it('works crossing hemispheres', () => {
      const checkToleranceExactDistance = areChannelLocationsWithinTolerance(16049.7833);
      const checkTolerance16050km = areChannelLocationsWithinTolerance(16050);

      const melbourne: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: -37.81625,
          longitudeDegrees: 144.964029
        } as CommonTypes.Location
      };
      const greenland: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: 73.45,
          longitudeDegrees: -42.53
        } as CommonTypes.Location
      };
      expect(
        checkToleranceWithin1Km(melbourne as ChannelTypes.Channel)(
          greenland as ChannelTypes.Channel
        )
      ).toBe(false);
      expect(
        checkToleranceExactDistance(melbourne as ChannelTypes.Channel)(
          greenland as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        checkTolerance16050km(melbourne as ChannelTypes.Channel)(greenland as ChannelTypes.Channel)
      ).toBe(true);
    });
    it('works for very short distances', () => {
      const checkToleranceOneHundredthOfAkm = areChannelLocationsWithinTolerance(0.01);
      const checkToleranceOneTwentiethOfAkm = areChannelLocationsWithinTolerance(0.05);

      const hungaTogaBaySide: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: -20.5357,
          longitudeDegrees: -175.380236
        } as CommonTypes.Location
      };
      const hungaTogaBayOtherSide: Partial<ChannelTypes.Channel> = {
        location: {
          latitudeDegrees: -20.535826,
          longitudeDegrees: -175.380418
        } as CommonTypes.Location
      };
      expect(
        checkToleranceWithin1Km(hungaTogaBaySide as ChannelTypes.Channel)(
          hungaTogaBayOtherSide as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        checkToleranceOneTwentiethOfAkm(hungaTogaBaySide as ChannelTypes.Channel)(
          hungaTogaBayOtherSide as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        checkToleranceOneHundredthOfAkm(hungaTogaBaySide as ChannelTypes.Channel)(
          hungaTogaBayOtherSide as ChannelTypes.Channel
        )
      ).toBe(false);
    });
  });
  describe('areChannelOrientationCodesCompatible', () => {
    const chanN: Partial<ChannelTypes.Channel> = {
      channelOrientationCode: 'N'
    };
    const chanE: Partial<ChannelTypes.Channel> = {
      channelOrientationCode: 'E'
    };
    const chan1: Partial<ChannelTypes.Channel> = {
      channelOrientationCode: '1'
    };
    const chan2: Partial<ChannelTypes.Channel> = {
      channelOrientationCode: '2'
    };
    it('accepts N and E', () => {
      expect(
        areChannelOrientationCodesCompatible(chanN as ChannelTypes.Channel)(
          chanE as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        areChannelOrientationCodesCompatible(chanE as ChannelTypes.Channel)(
          chanN as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('accepts 1 and 2', () => {
      expect(
        areChannelOrientationCodesCompatible(chan1 as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        areChannelOrientationCodesCompatible(chan2 as ChannelTypes.Channel)(
          chan1 as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('accepts N and 2', () => {
      expect(
        areChannelOrientationCodesCompatible(chanN as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        areChannelOrientationCodesCompatible(chan2 as ChannelTypes.Channel)(
          chanN as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('accepts E and 1', () => {
      expect(
        areChannelOrientationCodesCompatible(chanE as ChannelTypes.Channel)(
          chan1 as ChannelTypes.Channel
        )
      ).toBe(true);
      expect(
        areChannelOrientationCodesCompatible(chan1 as ChannelTypes.Channel)(
          chanE as ChannelTypes.Channel
        )
      ).toBe(true);
    });
    it('rejects N and 1', () => {
      expect(
        areChannelOrientationCodesCompatible(chanN as ChannelTypes.Channel)(
          chan1 as ChannelTypes.Channel
        )
      ).toBe(false);
      expect(
        areChannelOrientationCodesCompatible(chan1 as ChannelTypes.Channel)(
          chanN as ChannelTypes.Channel
        )
      ).toBe(false);
    });
    it('rejects E and 2', () => {
      expect(
        areChannelOrientationCodesCompatible(chanE as ChannelTypes.Channel)(
          chan2 as ChannelTypes.Channel
        )
      ).toBe(false);
      expect(
        areChannelOrientationCodesCompatible(chan2 as ChannelTypes.Channel)(
          chanE as ChannelTypes.Channel
        )
      ).toBe(false);
    });
  });
});
