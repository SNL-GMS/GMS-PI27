#ifndef ENUMERATED_MEASUREMENT_VALUE_H
#define ENUMERATED_MEASUREMENT_VALUE_H

#include <chrono>
#include <optional>

class EnumeratedMeasurementValue {

public:
  EnumeratedMeasurementValue(
    std::string const& value,
    std::optional<double> confidence,
    std::optional<double> referenceTime
  ) :
    value(value),
    confidence(confidence),
    referenceTime(referenceTime) {};

  // FeaturePredictions will not populate referenceTime
  // FeatureMeasurements will generally populate referenceTime
  std::string value;
  std::optional<double> confidence;
  std::optional<double> referenceTime;
};

#endif // ENUMERATED_MEASUREMENT_VALUE_H