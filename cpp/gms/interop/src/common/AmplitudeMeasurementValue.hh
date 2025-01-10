#ifndef AMPLITUDE_MEASUREMENT_VALUE_H
#define AMPLITUDE_MEASUREMENT_VALUE_H

#include <chrono>
#include <optional>

#include "Units.hh"

class AmplitudeMeasurementValue {

public:
  AmplitudeMeasurementValue(
    double amplitude,
    Units units,
    std::optional<double> period,
    std::optional<bool> clipped,
    std::optional<double> const& measurementTime,
    std::optional<double> const& measurementWindowStart,
    std::optional<double> const& measurementWindowDuration
  ) :
    amplitude(amplitude),
    units(units),
    period(period),
    clipped(clipped),
    measurementTime(measurementTime),
    measurementWindowStart(measurementWindowStart),
    measurementWindowDuration(measurementWindowDuration) {};

  // FeatureMeasurements generally include all parameters
  // FeaturePredictions only include amplitude and period
  double amplitude;
  Units units;
  std::optional<double> period;
  std::optional<bool> clipped;
  std::optional<double> measurementTime;
  std::optional<double> measurementWindowStart;
  std::optional<double> measurementWindowDuration;
};

#endif // AMPLITUDE_MEASUREMENT_VALUE_H