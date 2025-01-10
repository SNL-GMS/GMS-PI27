#ifndef LOCATION_BEHAVIOR_H
#define LOCATION_BEHAVIOR_H

#include <optional>
#include "FeatureMeasurementWrapper.hh"
#include "FeaturePrediction.hh"

class LocationBehavior {
public:
    explicit LocationBehavior(
        bool defining,
        FeatureMeasurementWrapper const& measurement,
        std::optional<FeaturePrediction> const& prediction,
        std::optional<double> residual,
        std::optional<double> weight
    )
        : defining(defining),
        measurement(measurement),
        prediction(prediction),
        residual(residual),
        weight(weight) {};
    bool defining;
    FeatureMeasurementWrapper measurement;
    std::optional<FeaturePrediction> prediction;
    std::optional<double> residual;
    std::optional<double> weight;
};

#endif // LOCATION_BEHAVIOR_H