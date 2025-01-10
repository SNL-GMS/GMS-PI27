#include "GroupDelayTest.hh"

void GroupDelayTest::SetUp()
{
    waveform.sampleRateHz = 40.0;
    waveform.sampleCount = TestData::THREE_SECOND_DATA_SIZE;
    waveform.data = (double*) malloc(TestData::THREE_SECOND_DATA_SIZE * sizeof(double));
    memcpy(waveform.data, TestData::THREE_SECOND_DATA.data(), TestData::THREE_SECOND_DATA_SIZE  * sizeof(double));    
}

void GroupDelayTest::TearDown()
{
    free(waveform.data);

    if (filterDefinition.filterType == CASCADE)
    {
        CascadeFilterDescription description = filterDefinition.filterDescription.cascadeFilterDescription;
        for (int i = 0; i < description.filterDescriptionCount; i++)
        {
            free(description.filterDescriptions[i].iirFilterDescription.parameters.sosNumeratorCoefficients);
            free(description.filterDescriptions[i].iirFilterDescription.parameters.sosDenominatorCoefficients);
        }

        free(description.filterDescriptions);
    }
    else 
    {
        free(filterDefinition.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosNumeratorCoefficients);
        free(filterDefinition.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosDenominatorCoefficients);
    }
}

TEST_F(GroupDelayTest, UNDESIGNED_FILTER_GROUP_DELAY_TEST)
{
    filterDefinition = testFilters.buildLowPassFilterDefinition();
    RETURN_CODE status = applyGroupDelay(&filterDefinition, &waveform);
    ASSERT_EQ(status, INVALID_CONFIGURATION);
    filterTestUtils.coefficientsAreEquivalent(waveform.data, TestData::THREE_SECOND_DATA.data(), TestData::THREE_SECOND_DATA_SIZE);
}

TEST_F(GroupDelayTest, CASCADE_FILTER_GROUP_DELAY_TEST)
{
    GroupDelayTest::filterDefinition = testFilters.buildDesignedCascadeFilterDefinition();
    
    double groupDelay = 0;
    CascadeFilterDescription description = GroupDelayTest::filterDefinition.filterDescription.cascadeFilterDescription;
    for (int i = 0; i < description.filterDescriptionCount; i++)
    {
        description.filterDescriptions[i].iirFilterDescription.parameters.groupDelaySec = 0.5;
        groupDelay += 0.5;
    }

    GroupDelayTest::filterDefinition.filterDescription.cascadeFilterDescription.parameters.groupDelaySec = groupDelay;

    RETURN_CODE status = applyGroupDelay(&(GroupDelayTest::filterDefinition), &waveform);
    ASSERT_EQ(status, SUCCESS);
    filterTestUtils.coefficientsAreEquivalent(waveform.data, &(TestData::THREE_SECOND_DATA.data()[40]), TestData::THREE_SECOND_DATA_SIZE - 40);

    for (int i = waveform.sampleCount - 40; i < waveform.sampleCount; i++)
    {
        ASSERT_EQ(waveform.data[i], 0.0);
    }
}

TEST_F(GroupDelayTest, IIR_BUTTER_FILTER_GROUP_DELAY_TEST)
{
    filterDefinition = testFilters.buildDesignedLowPassFilterDefinition();
    filterDefinition.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.groupDelaySec = 1.0;
    RETURN_CODE status = applyGroupDelay(&filterDefinition, &waveform);
}