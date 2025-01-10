#ifndef TAPER_TEST_H
#define TAPER_TEST_H

#include "gtest/gtest.h"
#include <math.h>
#include <json/json.h>
#include "FileLoader.hh"

extern "C"
{
#include "common/taper.c"
}

class TaperTest : public ::testing::Test
{
    public:
        void SetUp() override;
        double error = 0.000001;
};

#endif // TAPER_TEST_H