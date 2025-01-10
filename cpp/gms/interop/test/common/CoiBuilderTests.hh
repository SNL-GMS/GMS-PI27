#ifndef COI_BUILDER_TESTS_H
#define COI_BUILDER_TESTS_H
#include "gtest/gtest.h"
#include "common/Channel.hh"
#include "common/ChannelSegment.hh"
#include "common/DoubleValue.hh"
#include "common/OrientationAngles.hh"
#include "common/ProcessingMask.hh"
#include "common/ProcessingOperation.hh"
#include "common/QcSegment.hh"
#include "common/QcSegmentCategory.hh"
#include "common/QcSegmentCategoryAndType.hh"
#include "common/QcSegmentType.hh"
#include "common/QcSegmentVersion.hh"
#include "common/RequiredPropertyException.hh"
#include "common/TaperDefinition.hh"
#include "common/TaperFunction.hh"
#include "common/Timeseries.hh"
#include "common/Units.hh"

#include "fkprovider/FkAttributes.hh"
#include "fkprovider/FkComputeUtility.hh"
#include "fkprovider/FkFrequencyRange.hh"
#include "fkprovider/FkSpectra.hh"
#include "fkprovider/FkSpectraDefinition.hh"
#include "fkprovider/FkSpectraMetadata.hh"
#include "fkprovider/FkSpectraParameters.hh"
#include "fkprovider/FkSpectrum.hh"
#include "fkprovider/FkSpectrumWindow.hh"
#include "fkprovider/FkUncertaintyOption.hh"
#include "fkprovider/FkWaveformSampleRate.hh"
#include "fkprovider/SlownessGrid.hh"

/**
 * This test harness uses Google Test for all testing. You can find excellent tutorials and 
 * docs through your favorite search engine
 * https://github.com/google/googletest
*/
class CoiBuilderTest : public ::testing::Test
{
public:
    void SetUp() override;
};

#endif // COI_BUILDER_TESTS_H