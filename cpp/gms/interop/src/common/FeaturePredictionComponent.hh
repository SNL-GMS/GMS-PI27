#ifndef FEATURE_PREDICTION_COMPONENT_H
#define FEATURE_PREDICTION_COMPONENT_H

#include <variant>
#include "ValueTypeOrT.hh"
#include "FeaturePredictionComponentType.hh"

template <class T>
class FeaturePredictionComponent {
public:
    explicit FeaturePredictionComponent(
        ValueTypeOrT<T> value,
        bool extrapolated,
        FeaturePredictionComponentType predictionComponentType
    )
        : value(value),
        extrapolated(extrapolated),
        predictionComponentType(predictionComponentType) {};

    ValueTypeOrT<T> value;
    bool extrapolated;
    FeaturePredictionComponentType predictionComponentType;
};

#endif // FEATURE_PREDICTION_COMPONENT_H