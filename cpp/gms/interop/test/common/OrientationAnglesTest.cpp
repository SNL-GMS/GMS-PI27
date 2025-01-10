#include "OrientationAnglesTests.hh"

void OrientationAnglesTests::SetUp(){};

TEST_F(OrientationAnglesTests, OPERATOR_OVERLOAD_HORIZONTAL_NOT_EQUAL){
    double ex_horizontalAngleDeg = 33.3;
    double ex_verticalAngleDeg = 44.4;
    auto expected = OrientationAngles(ex_horizontalAngleDeg, ex_verticalAngleDeg);

    double ac_horizontalAngleDeg = 44.4;
    double ac_verticalAngleDeg = 44.4;
    auto actual = OrientationAngles(ac_horizontalAngleDeg, ac_verticalAngleDeg);

    EXPECT_FALSE(actual == expected);
}

TEST_F(OrientationAnglesTests, OPERATOR_OVERLOAD_VERTICAL_NOT_EQUAL){
    double ex_horizontalAngleDeg = 33.3;
    double ex_verticalAngleDeg = 44.4;
    auto expected = OrientationAngles(ex_horizontalAngleDeg, ex_verticalAngleDeg);

    double ac_horizontalAngleDeg = 33.3;
    double ac_verticalAngleDeg = 33.3;
    auto actual = OrientationAngles(ac_horizontalAngleDeg, ac_verticalAngleDeg);

    EXPECT_FALSE(actual == expected);
}