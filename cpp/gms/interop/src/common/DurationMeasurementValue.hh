#ifndef DURATION_MEASUREMENT_VALUE_H
#define DURATION_MEASUREMENT_VALUE_H

#include <chrono>
#include <optional>

#include "DurationValue.hh"
#include "InstantValue.hh"

class DurationMeasurementValue {

public:
  DurationMeasurementValue(
    InstantValue const& startTime,
    DurationValue const& duration
  ) :
    startTime(startTime),
    duration(duration) {};

  // FeatureMeasurements and FeaturePredictions each populate both values
  InstantValue startTime;
  DurationValue duration;
};

#endif // DURATION_MEASUREMENT_VALUE_H