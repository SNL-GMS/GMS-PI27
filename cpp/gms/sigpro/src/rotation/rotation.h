#ifndef ROTATION_H
#define ROTATION_H

#include <stddef.h>
#include <math.h>

#include "common/enums.h"

/**
 * Orients to north based on horizontal angle, then rotates
 * 
 * RETURN CODES:
 * RETURN_CODE::INVALID_BOUNDS = Cannot rotate, array size mismatch
*/
enum RETURN_CODE orientAndRotate(double* north,
    double* east,
    unsigned long numberOfPoints,
    double horizontalAngle,
    double stationToEventAzimuth);

/**
 * Rotates radially and transversely
 * R(θ) =  _                 _
 *        |   sinθ   cosθ    |
 *        |_  cosθ  -sinθ  _|
 * RETURN CODES:
 * RETURN_CODE::INVALID_BOUNDS = Cannot rotate, array size mismatch
*/
enum RETURN_CODE rotateRadTrans(double* north,
    double* east,
    unsigned long numberOfPoints,
    double azimuth);

#endif //ROTATION_H