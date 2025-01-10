#include "RotationTests.hh"

void RotationTests::SetUp()
{
};

TEST_F(RotationTests, ROTATION_CORRECTNESS)
{
    double expectedX1 = -3.3;
    double expectedY1 = 1.1;
    double expectedX2 = -4.4;
    double expectedY2 = 2.2;
    double x[]{ 1.1, 2.2 };
    double y[]{ 3.3, 4.4 };
    double azimuth = 90;
    long numberOfPoints = 2;
    int resultCode = rotateRadTrans(x, y, numberOfPoints, azimuth);
    ASSERT_EQ(resultCode, 0);
    ASSERT_DOUBLE_EQ(expectedX1, x[0]);
    ASSERT_DOUBLE_EQ(expectedY1, y[0]);
    ASSERT_DOUBLE_EQ(expectedX2, x[1]);
    ASSERT_DOUBLE_EQ(expectedY2, y[1]);
}

TEST_F(RotationTests, ORIENT_AND_ROTATE)
{
    double expectedX1 = -3.3;
    double expectedY1 = 1.1;
    double expectedX2 = -4.4;
    double expectedY2 = 2.2;
    double x[]{ 1.1, 2.2 };
    double y[]{ 3.3, 4.4 };
    double azimuth = 100;
    double horizontalAngle = 10;
    long numberOfPoints = 2;
    int resultCode = orientAndRotate(x, y, numberOfPoints, horizontalAngle, azimuth);
    ASSERT_EQ(resultCode, 0);
    ASSERT_DOUBLE_EQ(expectedX1, x[0]);
    ASSERT_DOUBLE_EQ(expectedY1, y[0]);
    ASSERT_DOUBLE_EQ(expectedX2, x[1]);
    ASSERT_DOUBLE_EQ(expectedY2, y[1]);
}

/**
 * This test compares the resulting rotated sets individually to the expected SME results;
*/
TEST_F(RotationTests, WAVEFORM_ROTATION_SME_VALIDATION)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("rotation-test-waveform.json");
    Json::Value results =  GmsTestUtils::FileLoader::getJson("rotation-test-waveform-result.json");
    
    const int sampleCount = 121;
    double azimuth = 30;
    double NORTH[sampleCount];
    double EAST[sampleCount];
    double RADIAL[sampleCount];
    double TRANSVERSE[sampleCount];

    for (int smpcnt = 0; smpcnt < sampleCount; smpcnt++) {
        NORTH[smpcnt] = data["channelSegments"][1]["timeseries"][0]["samples"][smpcnt].asDouble();
        EAST[smpcnt] = data["channelSegments"][0]["timeseries"][0]["samples"][smpcnt].asDouble();
        RADIAL[smpcnt] = results["channelSegments"][1]["timeseries"][0]["samples"][smpcnt].asDouble();
        TRANSVERSE[smpcnt] = results["channelSegments"][0]["timeseries"][0]["samples"][smpcnt].asDouble();
    }

    for (int i = 0; i < sampleCount; i++) {
        double expectedX = RADIAL[i];
        double expectedY = TRANSVERSE[i];
        double actualX = NORTH[i];
        double actualY = EAST[i];

        // Testing each pair
        int resultCode = rotateRadTrans(&actualX, &actualY, 1, azimuth);
        ASSERT_EQ(resultCode, 0);
        ASSERT_FLOAT_EQ(expectedX, actualX);
        ASSERT_FLOAT_EQ(expectedY, actualY);
    }
}

TEST_F(RotationTests, MEMORY_ERROR_TEST_KNOWN_BAD)
{
    Json::Value data =  GmsTestUtils::FileLoader::getJson("CMAR-known-issue.json");
   
    const int sampleCount = 216000;
    double azimuth = 30;
    std::vector<double> NORTH;
    std::vector<double> EAST;
   
    for (int smpcnt = 0; smpcnt < sampleCount; smpcnt++) {
        NORTH.emplace_back(data["channelSegments"][1]["timeseries"][0]["samples"][smpcnt].asDouble());
        EAST.emplace_back(data["channelSegments"][0]["timeseries"][0]["samples"][smpcnt].asDouble());
    }

    int resultCode = rotateRadTrans(NORTH.data(), EAST.data(), sampleCount, azimuth);
    ASSERT_EQ(resultCode, 0);
}
