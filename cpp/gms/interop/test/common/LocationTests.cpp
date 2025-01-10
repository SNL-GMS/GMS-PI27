#include "LocationTests.hh"

void LocationTests::SetUp(){};

TEST_F(LocationTests, OPERATOR_OVERLOAD_ELEVATION_NOT_EQUAL){
    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
    double depthKm = 20000;
    auto expected = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double act_latitudeDegrees = 45.5;
    double act_longitudeDegrees = 54.4;
    double act_elevationKm = 777.77;
    double act_depthKm = 20000;
    auto actual = Location(act_latitudeDegrees, act_longitudeDegrees, act_elevationKm, act_depthKm);

    EXPECT_FALSE(actual == expected);
}

TEST_F(LocationTests, OPERATOR_OVERLOAD_LATITUDE_NOT_EQUAL){
    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
    double depthKm = 20000;
    auto expected = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double act_latitudeDegrees = 55.5;
    double act_longitudeDegrees = 54.4;
    double act_elevationKm = 666.66;
    double act_depthKm = 20000;
    auto actual = Location(act_latitudeDegrees, act_longitudeDegrees, act_elevationKm, act_depthKm);

    EXPECT_FALSE(actual == expected);
}

TEST_F(LocationTests, OPERATOR_OVERLOAD_LONGITUDE_NOT_EQUAL){
    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
    double depthKm = 20000;
    auto expected = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double act_latitudeDegrees = 45.5;
    double act_longitudeDegrees = 66.6;
    double act_elevationKm = 666.66;
    double act_depthKm = 20000;
    auto actual = Location(act_latitudeDegrees, act_longitudeDegrees, act_elevationKm, act_depthKm);

    EXPECT_FALSE(actual == expected);
}

TEST_F(LocationTests, OPERATOR_OVERLOAD_OPTIONAL_EMPTY){
    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
    auto expected = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, 0);

    double act_latitudeDegrees = 45.5;
    double act_longitudeDegrees = 54.4;
    double act_elevationKm = 666.66;
    double act_depthKm = 20000;
    auto actual = Location(act_latitudeDegrees, act_longitudeDegrees, act_elevationKm, act_depthKm);

    EXPECT_FALSE(actual == expected);
}

TEST_F(LocationTests, OPERATOR_OVERLOAD_OPTIONAL_NOT_EQUAL){
    double loc_latitudeDegrees = 45.5;
    double loc_longitudeDegrees = 54.4;
    double loc_elevationKm = 666.66;
    double depthKm = 10000;
    auto expected = Location(loc_latitudeDegrees, loc_longitudeDegrees, loc_elevationKm, depthKm);

    double act_latitudeDegrees = 45.5;
    double act_longitudeDegrees = 54.4;
    double act_elevationKm = 666.66;
    double act_depthKm = 20000;
    auto actual = Location(act_latitudeDegrees, act_longitudeDegrees, act_elevationKm, act_depthKm);

    EXPECT_FALSE(actual == expected);
}