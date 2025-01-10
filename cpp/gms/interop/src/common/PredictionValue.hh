#ifndef PREDICTION_VALUE_H
#define PREDICTION_VALUE_H

#include <vector>
#include "FeatureMeasurementType.hh"
#include "FeaturePredictionComponent.hh"
#include "FeaturePredictionDerivativeMap.hh"

template <class T>
class PredictionValue {
public:
    explicit PredictionValue(
        FeatureMeasurementType featureMeasurementType,
        T measurementValue,
        FeaturePredictionDerivativeMap const& derivativeMap,
        std::vector<FeaturePredictionComponent<T>> featurePredictionComponentSet
    )
        : featureMeasurementType(featureMeasurementType),
        measurementValue(measurementValue),
        derivativeMap(derivativeMap),
        featurePredictionComponentSet(featurePredictionComponentSet) {};

    FeatureMeasurementType featureMeasurementType;
    T measurementValue;
    FeaturePredictionDerivativeMap derivativeMap;
    std::vector<FeaturePredictionComponent<T>> featurePredictionComponentSet;
};

#endif // PREDICTION_VALUE_H