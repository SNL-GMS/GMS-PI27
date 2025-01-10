#ifndef MISSING_INPUT_CHANNELS_TEST_H
#define MISSING_INPUT_CHANNELS_TEST_H

#include "gtest/gtest.h"
#include <cstring>

extern "C"
{
#include "common/structs.h"
#include "common/missingInputChannels.h"
}

class MissingInputChannelsTest : public ::testing::Test
{
    public:
        double sampleRateHz = 40.0;
};

#endif // MISSING_INPUT_CHANNELS_TEST_H