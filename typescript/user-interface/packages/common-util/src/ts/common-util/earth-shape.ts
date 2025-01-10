import { toRadians } from './unit-util';

/**
 * This is a TypeScript version of the EarthShape Java class
 *
 * @see gms-common/java/gms/shared/feature-prediction/feature-prediction-utilities/src/main/java/gms/shared/featureprediction/utilities/math/EarthShape.java
 */

const EARTH_SPHERE_RADIUS = 6371;
const EARTH_ELLIPSOID_RADIUS = 6378.137;
const EARTH_ELLIPSOID_IERS_RADIUS = 6378.1366;
const IERS_INVERSE_FLATTENING_FIVE = 298.25642;
const GRS80_INVERSE_FLATTENING = 298.257222101;
const WGS84_INVERSE_FLATTENING = 298.257223563;

class EarthShape {
  /**
   * True for EarthShapes that assume that the Earth has constant radius for purposes of converting
   * between radius and depth.
   */
  public constantRadius: boolean;

  /** The radius of the earth at the equator. */
  public equatorialRadius: number;

  /** flattening equals [ 1 - b/a ] where a is equatorial radius and b is the polar radius */
  public flattening: number;

  /** [ 1./flattening ] */
  public inverseFlattening: number;

  /**
   * Eccentricity squared.
   *
   * <p>Equals [ flattening * (2. - flattening) ]
   *
   * <p>Also equals [ 1 - sqr(b)/sqr(a) ] where a is the equatorial radius and b is the polar
   * radius.
   */
  public eccentricitySqr: number;

  /** Equals [ 1 - eccentricitySqr ] */
  public e1: number;

  /** Equals [ eccentricitySqr / (1 - eccentricitySqr) ] */
  public e2: number;

  /**
   * constructor
   *
   * @param inverseFlattening
   * @param equatorialRadius in km
   */
  public constructor(inverseFlattening: number, equatorialRadius: number) {
    const CONST_RADIUS = 6371.0;

    this.equatorialRadius = equatorialRadius;
    this.inverseFlattening = inverseFlattening;

    if (Math.abs(inverseFlattening) === Infinity && inverseFlattening > 0) {
      this.flattening = 0;
      this.eccentricitySqr = 0;
      this.e1 = 1;
      this.e2 = 0;
      this.constantRadius = true;
    } else {
      this.flattening = 1 / inverseFlattening;
      this.eccentricitySqr = this.flattening * (2 - this.flattening);
      this.e1 = 1 - this.eccentricitySqr;
      this.e2 = this.eccentricitySqr / (1 - this.eccentricitySqr);
      this.constantRadius = this.equatorialRadius < CONST_RADIUS + 1.0;
    }
  }

  /**
   * Convert geographicLat in radians to geocentricLat in radians.
   *
   * @param geographicLat
   * @return geocentricLat in radians.
   */
  public getGeocentricLat(geographicLat: number): number {
    if (Math.abs(this.inverseFlattening) === Infinity) {
      return geographicLat;
    }

    return Math.atan(Math.tan(geographicLat) * this.e1);
  }

  /**
   * Get a unit vector corresponding to a point on the Earth with the specified latitude and
   * longitude.
   *
   * @param lat the geographic latitude, in radians.
   * @param lon the geographic longitude, in radians.
   */
  public getVector(lat: number, lon: number): [number, number, number] {
    const geocentricLat = this.getGeocentricLat(lat);
    return [
      Math.cos(geocentricLat) * Math.cos(lon),
      Math.cos(geocentricLat) * Math.sin(lon),
      Math.sin(geocentricLat)
    ];
  }

  /**
   * Get a unit vector corresponding to a point on the Earth with the specified latitude and
   * longitude.
   *
   * @param lat the geographic latitude, in degrees.
   * @param lon the geographic longitude, in degrees.
   * @return The returned unit vector.
   */
  public getVectorDegrees(lat: number, lon: number): number[] {
    return this.getVector(toRadians(lat), toRadians(lon));
  }
} // end of definition of enum EarthShape

export const EarthShapes = {
  /** The Earth is assumed to be a sphere of radius 6371 km. */
  SPHERE: new EarthShape(Infinity, EARTH_SPHERE_RADIUS),

  /**
   * The Earth is assumed to be an ellipsoid whose shape is defined by the GRS80 ellipsoid
   * specification.
   */
  GRS80: new EarthShape(GRS80_INVERSE_FLATTENING, EARTH_ELLIPSOID_RADIUS),

  /**
   * A hybrid coordinate system where latitudes are converted between geodetic and geocentric values
   * using the GRS80 ellipsoid, but conversions between depth and radius assume that the Earth has
   * constant radius of 6371 km.
   */
  GRS80_RCONST: new EarthShape(GRS80_INVERSE_FLATTENING, EARTH_SPHERE_RADIUS),

  /**
   * The Earth is assumed to be an ellipsoid whose shape is defined by the WGS84 ellipsoid
   * specification.
   */
  WGS84: new EarthShape(WGS84_INVERSE_FLATTENING, EARTH_ELLIPSOID_RADIUS),

  /**
   * A hybrid coordinate system where latitudes are converted between geodetic and geocentric values
   * using the WGS84 ellipsoid, but conversions between depth and radius assume that the Earth has
   * constant radius of 6371 km.
   */
  WGS84_RCONST: new EarthShape(WGS84_INVERSE_FLATTENING, EARTH_SPHERE_RADIUS),

  /**
   * The Earth is assumed to be an ellipsoid whose shape is defined by the IERS ellipsoid
   * specification.
   */
  IERS2003: new EarthShape(IERS_INVERSE_FLATTENING_FIVE, EARTH_ELLIPSOID_IERS_RADIUS),

  /**
   * A hybrid coordinate system where latitudes are converted between geodetic and geocentric values
   * using the IERS ellipsoid, but conversions between depth and radius assume that the Earth has
   * constant radius of 6371 km.
   */
  IERS2003_RCONST: new EarthShape(IERS_INVERSE_FLATTENING_FIVE, EARTH_SPHERE_RADIUS)
};
