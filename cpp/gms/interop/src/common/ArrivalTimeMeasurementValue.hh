#ifndef ARRIVAL_TIME_MEASUREMENT_VALUE_H
#define ARRIVAL_TIME_MEASUREMENT_VALUE_H

#include <chrono>
#include <optional>

#include "DurationValue.hh"
#include "InstantValue.hh"

class ArrivalTimeMeasurementValue {

public:
  ArrivalTimeMeasurementValue(
    InstantValue const& arrivalTime,
    std::optional<DurationValue> const& travelTime
  ) :
    arrivalTime(arrivalTime),
    travelTime(travelTime) {};

  // FeaturePredictions include all parameters
  // FeatureMeasurements generally only include arrivalTime
  InstantValue arrivalTime;
  std::optional<DurationValue> travelTime;
};

#endif // ARRIVAL_TIME_MEASUREMENT_VALUE_H