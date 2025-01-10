/**
 * This is the Typescript implementation of shared geophysics math algorithms.
 *
 * @see GeoMath.java in /gms-common/java/gms/shared/feature-prediction/feature-prediction-utilities/src/main/java/gms/shared/featureprediction/utilities/math/GeoMath.java
 */

import { EarthShapes } from './earth-shape';
import { angleDegrees, FULL_CIRCLE_DEGREES, toDegrees, toRadians } from './unit-util';

// ! NOTE: Eventually the project-wide earth radius will be exposed in some common location.  When
// ! that happens, use that value here instead of the current value, which is from the wiki at
// ! /pages/viewpage.action?pageId=337859272
export const RADIUS_KM = 6371.0;
export const DEGREES_PER_KM = FULL_CIRCLE_DEGREES / (2.0 * Math.PI * RADIUS_KM);

/**
 * Uses PCALC implementation of angular separation between two lat/lons in degrees, assuming a
 * spherical earth model. Minimizes calls to trig functions for efficiency.
 *
 * @param lat1 latitude of 1st point in degrees [-90, 90]
 * @param lon1 longitude of 1st point in degrees [-180, 180]
 * @param lat2 latitude of 2nd point in degrees [-90, 90]
 * @param lon2 longitude of 2nd point in degrees [-180, 180]
 * @return great circle distance in degrees
 */
export function greatCircleAngularSeparation(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const vec1: number[] = EarthShapes.SPHERE.getVectorDegrees(lat1, lon1);
  const vec2: number[] = EarthShapes.SPHERE.getVectorDegrees(lat2, lon2);
  return angleDegrees(vec1, vec2);
}

/**
 * Convert degrees to kilometers
 *
 * @param degrees degree value to convert
 * @return distance in kilometers
 */
export function degToKm(degrees: number) {
  return degrees / DEGREES_PER_KM;
}

/**
 * Compute the azimuth from one point to another on the Earth.
 * This code is adapted for Typescript from the GeoMath.java file
 *
 * @see gms-common/java/gms/shared/feature-prediction/feature-prediction-utilities/src/main/java/gms/shared/featureprediction/utilities/math/GeoMath.java
 *
 * @param latitude1 - latitude of first point
 * @param longitude1 - longitude of first point
 * @param latitude2 - latitude of second point
 * @param longitude2 - longitude of second point
 *
 * @returns the azimuth in degrees
 */
export function greatCircleAzimuth(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const delta = toRadians(longitude2 - longitude1);
  const latitudeRadians1 = toRadians(latitude1);
  const latitudeRadians2 = toRadians(latitude2);
  const azimuth = toDegrees(
    Math.atan2(
      Math.sin(delta) * Math.cos(latitudeRadians2),
      Math.cos(latitudeRadians1) * Math.sin(latitudeRadians2) -
        Math.sin(latitudeRadians1) * Math.cos(latitudeRadians2) * Math.cos(delta)
    )
  );

  return azimuth < 0 ? azimuth + FULL_CIRCLE_DEGREES : azimuth;
}
