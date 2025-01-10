#include "FilterApplyTest.hh"

void FilterApplyTest::SetUp()
{
    waveform.sampleCount = TestData::TWO_HOUR_DATA_SIZE;
    waveform.data = (double*) malloc(TestData::TWO_HOUR_DATA_SIZE * sizeof(double));
    memcpy(waveform.data, TestData::TWO_HOUR_DATA.data(), TestData::TWO_HOUR_DATA_SIZE * sizeof(double));
}

void FilterApplyTest::TearDown()
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

TEST_F(FilterApplyTest, FILTER_APPLY_UNDESIGNED_TEST)
{
    filterDefinition = testFilters.buildLowPassFilterDefinition();
    RETURN_CODE status = filterApply(&filterDefinition, &waveform, (TaperDefinition*) NULL);
    ASSERT_EQ(status, INVALID_CONFIGURATION);
    filterTestUtils.coefficientsAreEquivalent(waveform.data, TestData::TWO_HOUR_DATA.data(), TestData::TWO_HOUR_DATA_SIZE);
}   

TEST_F(FilterApplyTest, FILTER_APPLY_CASCADE_TEST)
{
    filterDefinition = testFilters.buildDesignedCascadeFilterDefinition();
    RETURN_CODE status = filterApply(&filterDefinition, &waveform, (TaperDefinition*) NULL);
    ASSERT_EQ(status, SUCCESS);
    filterTestUtils.coefficientsAreEquivalent(waveform.data, TestData::CASCADED_FILTER_LPHP_RESULTS.data(), TestData::TWO_HOUR_DATA_SIZE);
}

TEST_F(FilterApplyTest, FILTER_APPLY_LINEAR_TEST)
{
    filterDefinition = testFilters.buildDesignedLowPassFilterDefinition();
    RETURN_CODE status = filterApply(&filterDefinition, &waveform, (TaperDefinition*) NULL);
    ASSERT_EQ(status, SUCCESS);
    filterTestUtils.coefficientsAreEquivalent(waveform.data, TestData::BW_LP_CAUSAL_RESULTS.data(), TestData::TWO_HOUR_DATA_SIZE);
}