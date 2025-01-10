#ifndef FEATURE_PREDICTION_DERIVATIVE_TYPE_H
#define FEATURE_PREDICTION_DERIVATIVE_TYPE_H

enum class FeaturePredictionDerivativeType {
    DERIVATIVE_WRT_DEPTH = 0,
    DERIVATIVE_WRT_LATITUDE = 1,
    DERIVATIVE_WRT_LONGITUDE = 2,
    DERIVATIVE_WRT_TIME = 3,
    // TODO: Not in guidance; delete when ApacheBicubicSplineInterpolator goes away (keep in line with Java)
    DERIVATIVE_WRT_DISTANCE = 4,
};

#endif // FEATURE_PREDICTION_DERIVATIVE_TYPE_H