#ifndef ROTATION_PROVIDER_TEST_H
#define ROTATION_PROVIDER_TEST_H
#include "gtest/gtest.h"
#include <json/json.h>

#include <optional>
#include <string>
#include <vector>

#include "FileLoader.hh"
#include "Comparisons.hh"

#include "common/ChannelSegment.hh"
#include "common/Location.hh"
#include "common/Map.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/TaperDefinition.hh"
#include "common/TimeseriesWithMissingInputChannels.hh"


#include "rotationprovider/RotationDefinition.hh"
#include "rotationprovider/RotationDescription.hh"
#include "rotationprovider/RotationParameters.hh"
#include "rotationprovider/RotationProvider.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class RotationProviderTests : public ::testing::Test
{
public:
    void SetUp() override;
    const double SAMPLE_RATE = 40.0;
    std::optional<Location> LOCATION;
    std::optional<RotationDescription> ROTATION_DESCRIPTION;
    std::optional<RotationParameters> ROTATION_PARAMETERS;
    std::optional<RotationDefinition> ROTATION_DEFINITION;
    std::optional<OrientationAngles> ORIENTATION_ANGLES;
    Json::Value TEST_DATA;
    Json::Value TEST_RESULTS;

    double RECEIVER_TO_SOURCE_AZIMUTH_DEG = 30;
    double SAMPLE_RATE_TOLERANCE_HZ = .00001;
    double LATITUDE_DEGREES = 45.5;
    double LONGITUDE_DEGREES = 54.4;
    double ELEVATION_KM = 666.66;
    double DEPTH_KM = 20000;
    bool TWO_DIMENSIONAL = true;
    double LOCATION_TOLERANCE_KM = 12.5;
    double HORIZONTAL_ANGLE_DEG = 33.3;
    double VERTICAL_ANGLE_DEG = 44.4;
    double ORIENTATION_ANGLE_TOLERANCE_DEG = .0251;
    SamplingType SAMPLING_TYPE = SamplingType::INTERPOLATED;
    std::string PHASE = "S";

    std::optional<Waveform> EXPECTED_EAST;
    std::optional<Waveform> EXPECTED_NORTH;

};

#endif // ROTATION_PROVIDER_TEST_H