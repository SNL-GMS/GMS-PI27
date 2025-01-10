#ifndef FK_TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H
#define FK_TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H

#include <vector>

#include "FkSpectra.hh"
#include "../common/TimeRangesByChannel.hh"

class FkTimeseriesWithMissingInputChannels {
public:
  FkTimeseriesWithMissingInputChannels(
    std::vector<FkSpectra> const& timeseries,
    std::vector<TimeRangesByChannel> const& missingInputChannels)
    : timeseries(timeseries),
    missingInputChannels(missingInputChannels) {};

  std::vector<FkSpectra> timeseries;
  std::vector<TimeRangesByChannel> missingInputChannels;
};

#endif // FK_TIMESERIES_WITH_MISSING_INPUT_CHANNELS_H