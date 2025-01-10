#ifndef CHANNEL_SEGMENT_FACETED_H
#define CHANNEL_SEGMENT_FACETED_H

#include "ChannelSegmentDescriptor.hh"

class ChannelSegmentFaceted {
public:
    explicit ChannelSegmentFaceted(ChannelSegmentDescriptor id) : id(id) {};
    ChannelSegmentDescriptor id;
};

#endif // CHANNEL_SEGMENT_FACETED_H