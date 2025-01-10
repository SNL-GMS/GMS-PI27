#ifndef STATION_MAGNITUDE_SOLUTION_H
#define STATION_MAGNITUDE_SOLUTION_H

#include <string>
#include <optional>
#include "MagnitudeType.hh"
#include "MagnitudeModel.hh"
#include "StationVersionReference.hh"
#include "DoubleValue.hh"
#include "FeatureMeasurementWrapper.hh"

// TODO: station as version reference
class StationMagnitudeSolution {
public:
    StationMagnitudeSolution(
        MagnitudeType const& type,
        MagnitudeModel const& model,
        StationVersionReference const& station,
        std::string const& phase,
        DoubleValue const& magnitude,
        std::optional<FeatureMeasurementWrapper> const& measurement
    ) : type(type), model(model), station(station), phase(phase), magnitude(magnitude), measurement(measurement) {};
    MagnitudeType type;
    MagnitudeModel model;
    StationVersionReference station;
    std::string phase;
    DoubleValue magnitude;
    std::optional<FeatureMeasurementWrapper> measurement;
};

#endif // STATION_MAGNITUDE_SOLUTION_H