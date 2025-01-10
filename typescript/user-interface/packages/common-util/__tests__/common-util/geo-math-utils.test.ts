/* eslint-disable @typescript-eslint/no-magic-numbers */
import { degToKm, greatCircleAngularSeparation } from '../../src/ts/common-util/geo-math-util';
import { toRadians } from '../../src/ts/common-util/unit-util';

const AVERAGE_EARTH_RADIUS_KM = 6378.14;
const MAX_FRACTION_DIFF = 1.0e-7;

const HONOLULU_LATITUDE = 21.3280193;
const HONOLULU_LONGITUDE = -157.869113;
const WAKE_ISLAND_LATITUDE = 19.2898828;
const WAKE_ISLAND_LONGITUDE = 166.6138514;
const BRISBANE_LATITUDE = -27.3818631;
const BRISBANE_LONGITUDE = 152.7130133;
const ADAMSTOWN_LATITUDE = -25.0670382;
const ADAMSTOWN_LONGITUDE = -130.1103974;
const EQALUIT_LATITUDE = 60.7582255;
const EQALUIT_LONGITUDE = -45.5523593;
const ISTANBUL_LATITUDE = 41.1922912;
const ISTANBUL_LONGITUDE = 28.3831326;
const RIO_DE_JANEIRO_LATITUDE = -22.0622495;
const RIO_DE_JANEIRO_LONGITUDE = -44.0442418;
const PORT_LOUIS_LATITUDE = -20.4690177;
const PORT_LOUIS_LONGITUDE = 39.4958906;
const EQUATOR_INDONESIA_LATITUDE = 0.0;
const EQUATOR_INDONESIA_LONGITUDE = 121.5654189;
const EQUATOR_ECUADOR_LATITUDE = 0.0;
const EQUATOR_ECUADOR_LONGITUDE = -78.6566382;
const HALDEN_LATITUDE = 59.1264576;
const HALDEN_LONGITUDE = 11.3689017;
const FREDRIKSTAD_LATITUDE = 59.2263353;
const FREDRIKSTAD_LONGITUDE = 10.8800745;
const HALDEN_ANTIPODES_LATITUDE = -59.1264576;
const HALDEN_ANTIPODES_LONGITUDE = -168.631098;

/*
 * Truth distances found at: https://geographiclib.sourceforge.io/cgi-bin/GeodSolve
 * Output precision: 1mm 0.0001"
 * Equatorial radius: 6378140 meters
 * Flattening: 0
 */
const HONOLULU_WAKE_ISLAND_DISTANCE = 3_707.228_184;
const HONOLULU_WAKE_ISLAND_DISTANCE_PROJECT_EARTH_RADIUS = 3_703.078_133;
const HONOLULU_BRISBANE_DISTANCE = 7_595.791_067;
const HONOLULU_ADAMSTOWN_DISTANCE = 5_973.392_385;
const HONOLULU_EQALUIT_DISTANCE = 9_093.446_640;
const HONOLULU_ISTANBUL_DISTANCE = 13_047.847_537;
const HONOLULU_RIO_DE_JANEIRO_DISTANCE = 13_250.884_101;
const HONOLULU_PORT_LOUIS_DISTANCE = 18_230.002_295;
const WAKE_ISLAND_BRISBANE_DISTANCE = 5_407.412_379;
const WAKE_ISLAND_ADAMSTOWN_DISTANCE = 8_443.255_939;
const WAKE_ISLAND_EQALUIT_DISTANCE = 10_670.783_836;
const WAKE_ISLAND_ISTANBUL_DISTANCE = 12_043.670_663;
const WAKE_ISLAND_RIO_DE_JANEIRO_DISTANCE = 16_834.900_800;
const WAKE_ISLAND_PORT_LOUIS_DISTANCE = 14_524.615_884;
const BRISBANE_ADAMSTOWN_DISTANCE = 7_578.196_243;
const BRISBANE_EQALUIT_DISTANCE = 16_075.844_916;
const BRISBANE_ISTANBUL_DISTANCE = 14_785.740_888;
const BRISBANE_RIO_DE_JANEIRO_DISTANCE = 14_245.516_222;
const BRISBANE_PORT_LOUIS_DISTANCE = 11_089.656_017;
const ADAMSTOWN_EQALUIT_DISTANCE = 12_148.373_137;
const ADAMSTOWN_ISTANBUL_DISTANCE = 17_360.426_330;
const ADAMSTOWN_RIO_DE_JANEIRO_DISTANCE = 8_625.354_348;
const ADAMSTOWN_PORT_LOUIS_DISTANCE = 14_845.183_012;
const EQALUIT_ISTANBUL_DISTANCE = 5_280.821_236;
const EQALUIT_RIO_DE_JANEIRO_DISTANCE = 9_220.545_565;
const EQALUIT_PORT_LOUIS_DISTANCE = 11_733.594_847;
const ISTANBUL_RIO_DE_JANEIRO_DISTANCE = 10_253.648_064;
const ISTANBUL_PORT_LOUIS_DISTANCE = 6_959.518_367;
const RIO_DE_JANEIRO_PORT_LOUIS_DISTANCE = 8_544.838_480;
const HALDEN_FREDRIKSTAD_DISTANCE = 30.017_509;
const INDONESIA_ECUADOR_DISTANCE = 17_786.407_610;
const HALDEN_ANTIPODES_DISTANCE = 20_037.517_750;
const HONOLULU_WAKE_ISLAND_ANGULAR_DIFF_DEGREES = 33.302_581_73;
const HONOLULU_WAKE_ISLAND_ANGULAR_DIFF_RADIANS = 0.581_239_701;

describe('GeoMath', () => {
  describe('greatCircleAngularSeparation', () => {
    describe('Honolulu to Wake Island', () => {
      it('correctly measures the distance in km', () => {
        const answer = degToKm(
          greatCircleAngularSeparation(
            HONOLULU_LATITUDE,
            HONOLULU_LONGITUDE,
            WAKE_ISLAND_LATITUDE,
            WAKE_ISLAND_LONGITUDE
          )
        );
        expect(
          Math.abs(answer - HONOLULU_WAKE_ISLAND_DISTANCE_PROJECT_EARTH_RADIUS) / answer
        ).toBeLessThan(MAX_FRACTION_DIFF);
      });
      it('correctly measures the distance in deg', () => {
        const answer = greatCircleAngularSeparation(
          HONOLULU_LATITUDE,
          HONOLULU_LONGITUDE,
          WAKE_ISLAND_LATITUDE,
          WAKE_ISLAND_LONGITUDE
        );
        expect(Math.abs(answer - HONOLULU_WAKE_ISLAND_ANGULAR_DIFF_DEGREES) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
      it('correctly measures the distance in radians', () => {
        const answer = toRadians(
          greatCircleAngularSeparation(
            HONOLULU_LATITUDE,
            HONOLULU_LONGITUDE,
            WAKE_ISLAND_LATITUDE,
            WAKE_ISLAND_LONGITUDE
          )
        );
        expect(Math.abs(answer - HONOLULU_WAKE_ISLAND_ANGULAR_DIFF_RADIANS) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
      it('correctly measures the distance in km converting from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_WAKE_ISLAND_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Brisbane', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_BRISBANE_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Adamstown', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_ADAMSTOWN_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Eqaluit', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_EQALUIT_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Istanbul', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_ISTANBUL_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Rio de Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Honolulu to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HONOLULU_LATITUDE,
              HONOLULU_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - HONOLULU_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Brisbane', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_BRISBANE_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Adamstown', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_ADAMSTOWN_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Eqaluit', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_EQALUIT_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Istanbul', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_ISTANBUL_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Rio De Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Wake Island to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              WAKE_ISLAND_LATITUDE,
              WAKE_ISLAND_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - WAKE_ISLAND_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Brisbane to Adamstown', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE,
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE
            )
          );
        expect(Math.abs(answer - BRISBANE_ADAMSTOWN_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Brisbane to Eqaluit', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE,
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE
            )
          );
        expect(Math.abs(answer - BRISBANE_EQALUIT_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Brisbane to Istanbul', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE,
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE
            )
          );
        expect(Math.abs(answer - BRISBANE_ISTANBUL_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Brisbane to Rio de Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - BRISBANE_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Brisbane to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              BRISBANE_LATITUDE,
              BRISBANE_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - BRISBANE_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Adamstown to Eqaluit', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE,
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE
            )
          );
        expect(Math.abs(answer - ADAMSTOWN_EQALUIT_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Adamstown to Istanbul', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE,
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE
            )
          );
        expect(Math.abs(answer - ADAMSTOWN_ISTANBUL_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Adamstown to Rio de Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - ADAMSTOWN_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Adamstown to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ADAMSTOWN_LATITUDE,
              ADAMSTOWN_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - ADAMSTOWN_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Eqaluit to Istanbul', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE,
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE
            )
          );
        expect(Math.abs(answer - EQALUIT_ISTANBUL_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Eqaluit to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - EQALUIT_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Eqaluit to Rio de Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              EQALUIT_LATITUDE,
              EQALUIT_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - EQALUIT_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });

    describe('Istanbul to Rio de Janeiro', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE,
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE
            )
          );
        expect(Math.abs(answer - ISTANBUL_RIO_DE_JANEIRO_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Istanbul to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              ISTANBUL_LATITUDE,
              ISTANBUL_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - ISTANBUL_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Rio de Janeiro to Port Louis', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              RIO_DE_JANEIRO_LATITUDE,
              RIO_DE_JANEIRO_LONGITUDE,
              PORT_LOUIS_LATITUDE,
              PORT_LOUIS_LONGITUDE
            )
          );
        expect(Math.abs(answer - RIO_DE_JANEIRO_PORT_LOUIS_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Halden to Fredrikstad', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HALDEN_LATITUDE,
              HALDEN_LONGITUDE,
              FREDRIKSTAD_LATITUDE,
              FREDRIKSTAD_LONGITUDE
            )
          );
        expect(Math.abs(answer - HALDEN_FREDRIKSTAD_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Equatorial Indonesia to equatorial Ecuador', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              EQUATOR_INDONESIA_LATITUDE,
              EQUATOR_INDONESIA_LONGITUDE,
              EQUATOR_ECUADOR_LATITUDE,
              EQUATOR_ECUADOR_LONGITUDE
            )
          );
        expect(Math.abs(answer - INDONESIA_ECUADOR_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('Halden to its antipode', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer =
          AVERAGE_EARTH_RADIUS_KM *
          toRadians(
            greatCircleAngularSeparation(
              HALDEN_LATITUDE,
              HALDEN_LONGITUDE,
              HALDEN_ANTIPODES_LATITUDE,
              HALDEN_ANTIPODES_LONGITUDE
            )
          );
        expect(Math.abs(answer - HALDEN_ANTIPODES_DISTANCE) / answer).toBeLessThan(
          MAX_FRACTION_DIFF
        );
      });
    });
    describe('North Pole to South Pole', () => {
      it('correctly measures the distance in km from radians', () => {
        const answer = toRadians(greatCircleAngularSeparation(90, 1.0, -90, 1.0));
        expect(Math.abs(answer - Math.PI) / answer).toBeLessThan(MAX_FRACTION_DIFF);
      });
    });

    describe('Assorted angular separation values', () => {
      it('calculates separation to 6 decimal places', () => {
        expect(greatCircleAngularSeparation(-23.663224, 133.951993, 10.0, 110.0)).toBeCloseTo(
          41.006537,
          6
        );
        expect(greatCircleAngularSeparation(-23.677631, 133.938215, 10.0, 110.0)).toBeCloseTo(
          41.010276,
          6
        );
        expect(greatCircleAngularSeparation(-23.672871, 133.921262, 10.0, 110.0)).toBeCloseTo(
          40.997048,
          6
        );
        expect(greatCircleAngularSeparation(-23.658175, 133.930481, 10.0, 110.0)).toBeCloseTo(
          40.99053,
          6
        );
        expect(greatCircleAngularSeparation(-23.647756, 133.948928, 10.0, 110.0)).toBeCloseTo(
          40.992562,
          6
        );
        expect(greatCircleAngularSeparation(-23.646206, 133.972511, 10.0, 110.0)).toBeCloseTo(
          41.004503,
          6
        );
        expect(greatCircleAngularSeparation(-23.664037, 133.971143, 10.0, 110.0)).toBeCloseTo(
          41.017872,
          6
        );
        expect(greatCircleAngularSeparation(-23.679935, 133.961149, 10.0, 110.0)).toBeCloseTo(
          41.024897,
          6
        );
        expect(greatCircleAngularSeparation(-23.698005, 133.942556, 10.0, 110.0)).toBeCloseTo(
          41.028859,
          6
        );
        expect(greatCircleAngularSeparation(-23.695526, 133.915193, 10.0, 110.0)).toBeCloseTo(
          41.011643,
          6
        );
        expect(greatCircleAngularSeparation(-23.676861, 133.898972, 10.0, 110.0)).toBeCloseTo(
          40.987792,
          6
        );
        expect(greatCircleAngularSeparation(-23.664895, 133.90573, 10.0, 110.0)).toBeCloseTo(
          40.982061,
          6
        );
        expect(greatCircleAngularSeparation(-23.650528, 133.895694, 10.0, 110.0)).toBeCloseTo(
          40.965066,
          6
        );
        expect(greatCircleAngularSeparation(-23.650325, 133.911635, 10.0, 110.0)).toBeCloseTo(
          40.973792,
          6
        );
        expect(greatCircleAngularSeparation(-23.634046, 133.913411, 10.0, 110.0)).toBeCloseTo(
          40.961869,
          6
        );
        expect(greatCircleAngularSeparation(-23.635466, 133.931283, 10.0, 110.0)).toBeCloseTo(
          40.972968,
          6
        );
        expect(greatCircleAngularSeparation(-23.663127, 133.992827, 10.0, 110.0)).toBeCloseTo(
          41.029262,
          6
        );
        expect(greatCircleAngularSeparation(-23.68858, 133.982023, 10.0, 110.0)).toBeCloseTo(
          41.043401,
          6
        );
        expect(greatCircleAngularSeparation(-23.702838, 133.96378, 10.0, 110.0)).toBeCloseTo(
          41.044527,
          6
        );
        expect(greatCircleAngularSeparation(-23.665134, 133.905261, 10.0, 110.0)).toBeCloseTo(
          40.981989,
          6
        );
        expect(greatCircleAngularSeparation(-28.614066, 25.255484, 10.0, 110.0)).toBeCloseTo(
          90.227649,
          6
        );
        expect(greatCircleAngularSeparation(-28.614064, 25.255422, 10.0, 110.0)).toBeCloseTo(
          90.227702,
          6
        );
        expect(greatCircleAngularSeparation(-28.614066, 25.255484, 10.0, 110.0)).toBeCloseTo(
          90.227649,
          6
        );
        expect(greatCircleAngularSeparation(50.72161, 78.56336, 10.0, 110.0)).toBeCloseTo(
          48.212203,
          6
        );
        expect(greatCircleAngularSeparation(50.70172, 78.55661, 10.0, 110.0)).toBeCloseTo(
          48.200733,
          6
        );
        expect(greatCircleAngularSeparation(50.68197, 78.55, 10.0, 110.0)).toBeCloseTo(
          48.189309,
          6
        );
        expect(greatCircleAngularSeparation(50.66219, 78.54339, 10.0, 110.0)).toBeCloseTo(
          48.177872,
          6
        );
        expect(greatCircleAngularSeparation(50.64236, 78.53664, 10.0, 110.0)).toBeCloseTo(
          48.166466,
          6
        );
        expect(greatCircleAngularSeparation(50.60283, 78.52394, 10.0, 110.0)).toBeCloseTo(
          48.143419,
          6
        );
        expect(greatCircleAngularSeparation(50.58306, 78.51722, 10.0, 110.0)).toBeCloseTo(
          48.132065,
          6
        );
        expect(greatCircleAngularSeparation(50.56317, 78.5108, 10.0, 110.0)).toBeCloseTo(
          48.120499,
          6
        );
        expect(greatCircleAngularSeparation(50.54333, 78.50433, 10.0, 110.0)).toBeCloseTo(
          48.108999,
          6
        );
        expect(greatCircleAngularSeparation(50.52362, 78.49773, 10.0, 110.0)).toBeCloseTo(
          48.097656,
          6
        );
        expect(greatCircleAngularSeparation(50.60189, 78.68625, 10.0, 110.0)).toBeCloseTo(
          48.071741,
          6
        );
        expect(greatCircleAngularSeparation(50.60611, 78.65514, 10.0, 110.0)).toBeCloseTo(
          48.088391,
          6
        );
        expect(greatCircleAngularSeparation(50.61022, 78.62417, 10.0, 110.0)).toBeCloseTo(
          48.104905,
          6
        );
        expect(greatCircleAngularSeparation(50.61436, 78.59272, 10.0, 110.0)).toBeCloseTo(
          48.121657,
          6
        );
        expect(greatCircleAngularSeparation(50.6185, 78.56147, 10.0, 110.0)).toBeCloseTo(
          48.138327,
          6
        );
        expect(greatCircleAngularSeparation(50.62686, 78.49933, 10.0, 110.0)).toBeCloseTo(
          48.171584,
          6
        );
        expect(greatCircleAngularSeparation(50.63175, 78.469, 10.0, 110.0)).toBeCloseTo(
          48.18841,
          6
        );
        expect(greatCircleAngularSeparation(50.63531, 78.43683, 10.0, 110.0)).toBeCloseTo(
          48.205086,
          6
        );
        expect(greatCircleAngularSeparation(50.63944, 78.40569, 10.0, 110.0)).toBeCloseTo(
          48.221729,
          6
        );
        expect(greatCircleAngularSeparation(50.64364, 78.37456, 10.0, 110.0)).toBeCloseTo(
          48.238423,
          6
        );
        expect(greatCircleAngularSeparation(50.62264, 78.53039, 10.0, 110.0)).toBeCloseTo(
          48.154928,
          6
        );
        expect(greatCircleAngularSeparation(-25.015124, 25.596598, 10.0, 110.0)).toBeCloseTo(
          89.220487,
          6
        );
        expect(greatCircleAngularSeparation(-25.015159, 25.596713, 10.0, 110.0)).toBeCloseTo(
          89.220392,
          6
        );
        expect(greatCircleAngularSeparation(-16.287923, -68.130714, 10.0, 110.0)).toBeCloseTo(
          173.45419,
          6
        );
        expect(greatCircleAngularSeparation(-16.287983, -68.130752, 10.0, 110.0)).toBeCloseTo(
          173.454142,
          6
        );
        expect(greatCircleAngularSeparation(46.768972, 82.300655, 10.0, 110.0)).toBeCloseTo(
          43.63478,
          6
        );
        expect(greatCircleAngularSeparation(46.770074, 82.308571, 10.0, 110.0)).toBeCloseTo(
          43.632008,
          6
        );
        expect(greatCircleAngularSeparation(46.765803, 82.301273, 10.0, 110.0)).toBeCloseTo(
          43.632128,
          6
        );
        expect(greatCircleAngularSeparation(46.771357, 82.295182, 10.0, 110.0)).toBeCloseTo(
          43.639051,
          6
        );
        expect(greatCircleAngularSeparation(46.79395, 82.291099, 10.0, 110.0)).toBeCloseTo(
          43.657812,
          6
        );
        expect(greatCircleAngularSeparation(46.77497, 82.313172, 10.0, 110.0)).toBeCloseTo(
          43.633583,
          6
        );
        expect(greatCircleAngularSeparation(46.753431, 82.315664, 10.0, 110.0)).toBeCloseTo(
          43.61633,
          6
        );
        expect(greatCircleAngularSeparation(46.755313, 82.282854, 10.0, 110.0)).toBeCloseTo(
          43.632654,
          6
        );
        expect(greatCircleAngularSeparation(46.774525, 82.276498, 10.0, 110.0)).toBeCloseTo(
          43.649913,
          6
        );
        expect(greatCircleAngularSeparation(46.793683, 82.290569, 10.0, 110.0)).toBeCloseTo(
          43.657853,
          6
        );
        expect(greatCircleAngularSeparation(46.793686, 82.2906, 10.0, 110.0)).toBeCloseTo(
          43.657841,
          6
        );
        expect(greatCircleAngularSeparation(46.793683, 82.290569, 10.0, 110.0)).toBeCloseTo(
          43.657853,
          6
        );
        expect(greatCircleAngularSeparation(-19.9594, 134.3464, 10.0, 110.0)).toBeCloseTo(
          38.36611,
          6
        );
        expect(greatCircleAngularSeparation(-19.7671, 134.3928, 10.0, 110.0)).toBeCloseTo(
          38.249498,
          6
        );
        expect(greatCircleAngularSeparation(-19.9428, 134.3511, 10.0, 110.0)).toBeCloseTo(
          38.356445,
          6
        );
        expect(greatCircleAngularSeparation(-19.923, 134.3555, 10.0, 110.0)).toBeCloseTo(
          38.344183,
          6
        );
        expect(greatCircleAngularSeparation(-19.9036, 134.3589, 10.0, 110.0)).toBeCloseTo(
          38.331613,
          6
        );
        expect(greatCircleAngularSeparation(-19.8782, 134.3662, 10.0, 110.0)).toBeCloseTo(
          38.316919,
          6
        );
        expect(greatCircleAngularSeparation(-19.855, 134.3672, 10.0, 110.0)).toBeCloseTo(
          38.300014,
          6
        );
        expect(greatCircleAngularSeparation(-19.8408, 134.3795, 10.0, 110.0)).toBeCloseTo(
          38.29688,
          6
        );
        expect(greatCircleAngularSeparation(-19.8139, 134.3808, 10.0, 110.0)).toBeCloseTo(
          38.277382,
          6
        );
        expect(greatCircleAngularSeparation(-19.7914, 134.384, 10.0, 110.0)).toBeCloseTo(
          38.262384,
          6
        );
        expect(greatCircleAngularSeparation(-19.9243, 134.339, 10.0, 110.0)).toBeCloseTo(
          38.335013,
          6
        );
        expect(greatCircleAngularSeparation(-19.9254, 134.3655, 10.0, 110.0)).toBeCloseTo(
          38.352152,
          6
        );
        expect(greatCircleAngularSeparation(-19.9587, 134.3719, 10.0, 110.0)).toBeCloseTo(
          38.381263,
          6
        );
        expect(greatCircleAngularSeparation(-19.9619, 134.3397, 10.0, 110.0)).toBeCloseTo(
          38.363882,
          6
        );
        expect(greatCircleAngularSeparation(-19.9426, 134.3395, 10.0, 110.0)).toBeCloseTo(
          38.34916,
          6
        );
        expect(greatCircleAngularSeparation(-19.9597, 134.5405, 10.0, 110.0)).toBeCloseTo(
          38.485959,
          6
        );
        expect(greatCircleAngularSeparation(-19.9469, 134.3624, 10.0, 110.0)).toBeCloseTo(
          38.366497,
          6
        );
        expect(greatCircleAngularSeparation(-19.9485, 134.3869, 10.0, 110.0)).toBeCloseTo(
          38.382784,
          6
        );
        expect(greatCircleAngularSeparation(-19.9503, 134.4066, 10.0, 110.0)).toBeCloseTo(
          38.396274,
          6
        );
        expect(greatCircleAngularSeparation(-19.9522, 134.4304, 10.0, 110.0)).toBeCloseTo(
          38.412371,
          6
        );
        expect(greatCircleAngularSeparation(-19.9542, 134.453, 10.0, 110.0)).toBeCloseTo(
          38.42781,
          6
        );
        expect(greatCircleAngularSeparation(-19.9552, 134.476, 10.0, 110.0)).toBeCloseTo(
          38.442749,
          6
        );
        expect(greatCircleAngularSeparation(-19.9558, 134.5005, 10.0, 110.0)).toBeCloseTo(
          38.458319,
          6
        );
        expect(greatCircleAngularSeparation(-19.9577, 134.5149, 10.0, 110.0)).toBeCloseTo(
          38.468641,
          6
        );
        expect(greatCircleAngularSeparation(-19.9426, 134.3395, 10.0, 110.0)).toBeCloseTo(
          38.34916,
          6
        );
      });
      it('correctly calculates independent angular separation values', () => {
        expect(greatCircleAngularSeparation(-23.665134, 133.905261, 10.0, 110.0)).toBeCloseTo(
          40.981989,
          6
        );
        expect(greatCircleAngularSeparation(46.793683, 82.290569, 10.0, 110.0)).toBeCloseTo(
          43.657853,
          6
        );
      });
    });
  });
});
