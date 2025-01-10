#ifndef TIME_RANGE_BY_CHANNEL_MAP_H
#define TIME_RANGE_BY_CHANNEL_MAP_H

#include <map>

#include "ChannelVersionReference.hh"
#include "TimeRange.hh"

class TimeRangesByChannel{
    
    public:
    TimeRangesByChannel(
        ChannelVersionReference const& channel, 
        std::vector<TimeRange> const& timeRanges) 
        : channelVersionReference(channel), 
          timeRanges(timeRanges) {};

    ChannelVersionReference channelVersionReference; 
    std::vector<TimeRange> timeRanges;
};

#endif //TIME_RANGE_BY_CHANNEL_MAP_H