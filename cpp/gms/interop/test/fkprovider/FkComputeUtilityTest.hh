#ifndef DEFAULT_FK_COMPUTE_UTILITY_TEST_H
#define DEFAULT_FK_COMPUTE_UTILITY_TEST_H
#include <chrono>
#include <iostream>
#include <vector>

#include <json/json.h>
#include "gtest/gtest.h"

#include "FileLoader.hh"

#include "common/Channel.hh"
#include "common/ChannelSegment.hh"
#include "common/DoubleValue.hh"
#include "common/ProcessingMask.hh"
#include "common/Map.hh"
#include "common/ProcessingOperation.hh"
#include "common/Station.hh"
#include "common/TaperDefinition.hh"
#include "common/TaperFunction.hh"
#include "common/Units.hh"
#include "fkprovider/FkComputeUtility.hh"
#include "fkprovider/FkSpectra.hh"
#include "fkprovider/FkSpectraDefinition.hh"
#include "fkprovider/FkSpectrumWindow.hh"
#include "fkprovider/FkUncertaintyOption.hh"


/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class FkComputeUtilityTest : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // DEFAULT_FK_COMPUTE_UTILITY_TEST_H