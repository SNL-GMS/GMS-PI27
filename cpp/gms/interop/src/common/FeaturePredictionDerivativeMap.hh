#ifndef FEATURE_PREDICTION_DERIVATIVE_MAP_H
#define FEATURE_PREDICTION_DERIVATIVE_MAP_H

#include <map>
#include <variant>
#include "DoubleValue.hh"
#include "DurationValue.hh"
#include "FeaturePredictionDerivativeType.hh"
#include "InstantValue.hh"
#include "ValueTypeWrapper.hh"

class FeaturePredictionDerivativeMap {
public:
    std::map<FeaturePredictionDerivativeType, std::optional<ValueTypeWrapper>> derivativeMap;
};

#endif // FEATURE_PREDICTION_DERIVATIVE_MAP