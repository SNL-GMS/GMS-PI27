#include "RotationConstructorTests.hh"

void RotationConstructorTests::SetUp() {};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_NOMINAL) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
   double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    auto actual = RotationParameters::Builder()
        .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
        .sampleRateHz(sampleRateHz)
        .sampleRateToleranceHz(sampleRateToleranceHz)
        .location(location)
        .locationToleranceKm(locationToleranceKm)
        .orientationAngles(orientationAngles)
        .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
        .build();

    EXPECT_EQ(actual.receiverToSourceAzimuthDeg, receiverToSourceAzimuthDeg);
    EXPECT_EQ(actual.sampleRateHz, sampleRateHz);
    EXPECT_EQ(actual.sampleRateToleranceHz, sampleRateToleranceHz);
    EXPECT_TRUE(actual.location == location);
    EXPECT_EQ(actual.locationToleranceKm, locationToleranceKm);
    EXPECT_TRUE(actual.orientationAngles == orientationAngles);
    EXPECT_EQ(actual.orientationAngleToleranceDeg, orientationAngleToleranceDeg);
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_LOCATION_TOLERANCE) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateHz(sampleRateHz)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .location(location)
            .orientationAngles(orientationAngles)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [locationToleranceKm, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_RECEIVER) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .sampleRateHz(sampleRateHz)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .location(location)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngles(orientationAngles)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [receiverToSourceAzimuthDeg, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_SAMPRATE) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .location(location)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngles(orientationAngles)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [sampleRateHz, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_SAMPRATE_TOLERANCE) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
      double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateHz(sampleRateHz)
            .location(location)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngles(orientationAngles)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [sampleRateToleranceHz, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_LOCATION) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateHz(sampleRateHz)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngles(orientationAngles)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [location, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_ORIENTATIONANGLES) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateHz(sampleRateHz)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .location(location)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngleToleranceDeg(orientationAngleToleranceDeg)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [orientationAngles, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_PARAMETERS_BUILDER_MISSING_ORIENTATION_TOLERANCE) {

    double receiverToSourceAzimuthDeg = 1.1;
    double sampleRateHz = 40.0;
    double sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
      double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double orientationAngleToleranceDeg = .0251;

    try {
        auto actual = RotationParameters::Builder()
            .receiverToSourceAzimuthDeg(receiverToSourceAzimuthDeg)
            .sampleRateHz(sampleRateHz)
            .sampleRateToleranceHz(sampleRateToleranceHz)
            .location(location)
            .locationToleranceKm(locationToleranceKm)
            .orientationAngles(orientationAngles)
            .build();
    }
    catch (RequiredPropertyException ex) {
        EXPECT_EQ(ex.getMessage(), std::string("Required property is missing: [orientationAngleToleranceDeg, false]").c_str());
    }
};

TEST_F(RotationConstructorTests, ROTATION_DESCRIPTION_CTOR) {

    bool twoDimensional = true;
    auto phase = "S";
    auto samplingType = SamplingType::INTERPOLATED;
    auto actual = RotationDescription(twoDimensional, phase, samplingType);

    EXPECT_EQ(actual.twoDimensional, twoDimensional);
    EXPECT_EQ(actual.phase, phase);
    EXPECT_EQ(actual.samplingType, samplingType);
};

TEST_F(RotationConstructorTests, ROTATION_DEFINITION_CTOR) {

    bool rd_twoDimensional = true;
    auto rd_phase = "S";
    auto rd_samplingType = SamplingType::INTERPOLATED;
    auto rotDesc = RotationDescription(rd_twoDimensional, rd_phase, rd_samplingType);

    double rp_receiverToSourceAzimuthDeg = 1.1;
    double rp_sampleRateHz = 40.0;
    double rp_sampleRateToleranceHz = .00001;

    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
       double depthKm = 20000;
    auto location = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double rp_locationToleranceKm = 12.5;

    double oa_horizontalAngleDeg = 33.3;
    double oa_verticalAngleDeg = 44.4;
    auto orientationAngles = OrientationAngles(oa_horizontalAngleDeg, oa_verticalAngleDeg);

    double rp_orientationAngleToleranceDeg = .0251;

    auto rotParams = RotationParameters::Builder()
        .receiverToSourceAzimuthDeg(rp_receiverToSourceAzimuthDeg)
        .sampleRateHz(rp_sampleRateHz)
        .sampleRateToleranceHz(rp_sampleRateToleranceHz)
        .location(location)
        .locationToleranceKm(rp_locationToleranceKm)
        .orientationAngles(orientationAngles)
        .orientationAngleToleranceDeg(rp_orientationAngleToleranceDeg)
        .build();


    auto actual = RotationDefinition(rotDesc, rotParams);

    EXPECT_EQ(actual.rotationDescription.twoDimensional, rd_twoDimensional);
    EXPECT_EQ(actual.rotationDescription.phase, rd_phase);
    EXPECT_EQ(actual.rotationDescription.samplingType, rd_samplingType);
    EXPECT_EQ(actual.rotationParameters.receiverToSourceAzimuthDeg, rp_receiverToSourceAzimuthDeg);
    EXPECT_EQ(actual.rotationParameters.sampleRateHz, rp_sampleRateHz);
    EXPECT_EQ(actual.rotationParameters.sampleRateToleranceHz, rp_sampleRateToleranceHz);
    EXPECT_TRUE(actual.rotationParameters.location == location);
    EXPECT_EQ(actual.rotationParameters.locationToleranceKm, rp_locationToleranceKm);
    EXPECT_TRUE(actual.rotationParameters.orientationAngles == orientationAngles);
    EXPECT_EQ(actual.rotationParameters.orientationAngleToleranceDeg, rp_orientationAngleToleranceDeg);

};
