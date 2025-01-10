#ifndef NUMERIC_MEASUREMENT_VALUE_H
#define NUMERIC_MEASUREMENT_VALUE_H

#include <chrono>
#include <optional>

#include "DoubleValue.hh"

class NumericMeasurementValue {

public:
  NumericMeasurementValue(
    DoubleValue const& measuredValue,
    std::optional<double> const& referenceTime
  ) :
    measuredValue(measuredValue),
    referenceTime(referenceTime) {};

  // FeaturePredictions will not populate referenceTime
  // FeatureMeasurements will generally populate referenceTime
  DoubleValue measuredValue;
  std::optional<double> referenceTime;
};

#endif // NUMERIC_MEASUREMENT_VALUE_H