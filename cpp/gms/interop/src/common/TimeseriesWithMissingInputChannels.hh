#ifndef TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H
#define TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H

#include <vector>

#include "common/Waveform.hh"
#include "common/TimeRangesByChannel.hh"

class TimeseriesWithMissingInputChannels {
public:
  explicit TimeseriesWithMissingInputChannels() = default;
  TimeseriesWithMissingInputChannels(
    std::vector<Waveform> const& timeseries,
    std::vector<TimeRangesByChannel> const& missingInputChannels)
    : timeseries(timeseries),
    missingInputChannels(missingInputChannels) {};

  std::vector<Waveform> timeseries;
  std::vector<TimeRangesByChannel> missingInputChannels;
};

#endif // TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H