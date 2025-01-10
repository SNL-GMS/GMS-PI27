#ifndef DATA_ALIGNMENT_UTILITY_TESTS_H
#define DATA_ALIGNMENT_UTILITY_TESTS_H
#include "gtest/gtest.h"
#include <json/json.h>

#include <optional>
#include <vector>

#include "FileLoader.hh"

#include "common/ChannelSegment.hh"
#include "common/Location.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/TaperDefinition.hh"
#include "utils/DataAlignmentUtility.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class DataAlignmentUtilityTests : public ::testing::Test
{
public:
    void SetUp() override;
    const double SAMPLE_RATE = 40.0;
    Json::Value TEST_DATA;
  
    std::vector<Waveform> expectedEast;
    std::vector<Waveform> expectedNorth;
};

#endif // DATA_ALIGNMENT_UTILITY_TESTS_H