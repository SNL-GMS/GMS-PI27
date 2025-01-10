#ifndef CHANNEL_SEGMENT_DESCRIPTOR_H
#define CHANNEL_SEGMENT_DESCRIPTOR_H

#include "ChannelVersionReference.hh"

class ChannelSegmentDescriptor
{

public:
    ChannelSegmentDescriptor(ChannelVersionReference const &channel,
                             double const &startTime,
                             double const &endTime,
                             double const &creationTime)
        : channel(channel), startTime(startTime), endTime(endTime), creationTime(creationTime){};

    ChannelVersionReference channel;
    double startTime;
    double endTime;
    double creationTime;
};

#endif // CHANNEL_SEGMENT_DESCRIPTOR_H