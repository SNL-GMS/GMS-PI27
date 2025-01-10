#include "IirButterworthFilterApplyTest.hh"

TEST_F(IirButterworthFilterApplyTest, FILTER_APPLY_SUCCESS)
{
    IirFilterDescription filterDescription = IirButterworthFilterApplyTest::testFilters.buildLowPassDesignedFilter();

    ProcessingWaveform waveform;
    waveform.sampleCount = TestData::TWO_HOUR_DATA_SIZE;
    waveform.data = (double*) malloc(TestData::TWO_HOUR_DATA_SIZE * sizeof(double));
    memcpy(waveform.data, TestData::TWO_HOUR_DATA.data(), TestData::TWO_HOUR_DATA_SIZE * sizeof(double));

    RETURN_CODE status = iirButterworthFilterApply(&filterDescription, &waveform, (TaperDefinition*) NULL);
    ASSERT_EQ(status, SUCCESS);
    IirButterworthFilterApplyTest::filterTestUtils.coefficientsAreEquivalent(waveform.data, TestData::BW_LP_CAUSAL_RESULTS.data(), TestData::TWO_HOUR_DATA_SIZE);

    free(waveform.data);
    free(filterDescription.parameters.sosNumeratorCoefficients);
    free(filterDescription.parameters.sosDenominatorCoefficients);
}   