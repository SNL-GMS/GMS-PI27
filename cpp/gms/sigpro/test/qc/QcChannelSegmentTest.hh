#ifndef QC_CHANNEL_SEGMENT_TEST_H
#define QC_CHANNEL_SEGMENT_TEST_H

#include "gtest/gtest.h"

extern "C"
{
    #include "common/enums.h"
    #include "common/structs.h"
    #include "qc/qc.h"
}

class QcChannelSegmentTest : public ::testing::Test
{
    public:
        ProcessingChannelSegment buildSingleWaveformChannelSegment();
        ProcessingMaskDefinition buildZeroDefinition();
        ProcessingMaskDefinition buildInterpolateDefinition();
};

#endif // QC_CHANNEL_SEGMENT_TEST_H