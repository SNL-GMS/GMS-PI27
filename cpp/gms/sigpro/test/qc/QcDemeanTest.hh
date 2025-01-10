#ifndef QC_DEMEAN_TEST_H
#define QC_DEMEAN_TEST_H

#include "gtest/gtest.h"

extern "C"
{
    #include <stdio.h>
    #include "common/structs.h"
    #include "qc/qc.h"
}

class QcDemeanTest : public ::testing::Test
{
    public:
        void SetUp() override;
        void TearDown() override;
        ProcessingChannelSegment channelSegment;  
};

#endif // QC_DEMEAN_TEST_H