#include "rotation.h"

enum RETURN_CODE orientAndRotate(double* north,
    double* east,
    unsigned long numberOfPoints,
    double horizontalAngle,
    double stationToEventAzimuth) {
    double correctedAzimuth = stationToEventAzimuth - horizontalAngle;
    return rotateRadTrans(north, east, numberOfPoints, correctedAzimuth);
}

enum RETURN_CODE rotateRadTrans(double* north,
    double* east,
    unsigned long numberOfPoints,
    double azimuth)
{
    if(numberOfPoints <= 0)
    {
        return INSUFFICIENT_DATA;
    }

    // Calculate azimuth radians
    double azimuthRadians = M_PI * azimuth / 180.0;

    // Calculate sine and cosine of radians 
    double sinAzRads = sin(azimuthRadians - M_PI);
    double cosAzRads = cos(azimuthRadians - M_PI);

    // rotate
    for (int pointCnt = 0; pointCnt < numberOfPoints; pointCnt++)
    {
        double e = east[pointCnt];
        double n = north[pointCnt];
        north[pointCnt] = (e * sinAzRads) + (n * cosAzRads);
        east[pointCnt] = (e * cosAzRads) - (n * sinAzRads);
    }
    return SUCCESS;
}

