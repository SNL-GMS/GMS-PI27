#ifndef PROCESSING_MASK_UTILITY_TESTS_H
#define PROCESSING_MASK_UTILITY_TESTS_H

#include "gtest/gtest.h"
#include <json/json.h>

#include <optional>
#include <vector>

#include "common/ChannelSegment.hh"
#include "common/Location.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/TaperDefinition.hh"

#include "utils/ProcessingMaskUtility.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class ProcessingMaskUtilityTests : public ::testing::Test
{
public:
    void SetUp() override;
    ChannelSegment buildChannelSegment() const;
};

#endif // DATA_ALIGNMENT_UTILITY_TESTS_H