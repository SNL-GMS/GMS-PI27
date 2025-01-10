#include "IirButterworthFilterDesignTest.hh"

TEST_F(IirButterworthFilterDesignTest, DESIGN_FILTER_EXCEED_MAX_SOS)
{
    IirFilterDescription actual = IirButterworthFilterDesignTest::testFilters.buildLowPassFilter();
    actual.parameters.sosCoefficientsSize = MAX_SOS + 1;

    RETURN_CODE status = iirButterworthFilterDesign(&actual);

    ASSERT_EQ(status, INVALID_CONFIGURATION);

    IirFilterDescription expected = IirButterworthFilterDesignTest::testFilters.buildLowPassFilter();
    expected.parameters.sosCoefficientsSize = MAX_SOS + 1;

    IirButterworthFilterDesignTest::filterTestUtils.filterDescriptionsAreEquivalent(&actual, &expected);

    free(actual.parameters.sosNumeratorCoefficients);
    free(actual.parameters.sosDenominatorCoefficients);
    free(expected.parameters.sosNumeratorCoefficients);
    free(expected.parameters.sosDenominatorCoefficients);
}

TEST_F(IirButterworthFilterDesignTest, DESIGN_LOW_PASS_CAUSAL_FILTER)
{
    IirFilterDescription actual = IirButterworthFilterDesignTest::testFilters.buildLowPassFilter();
    IirFilterDescription expected = IirButterworthFilterDesignTest::testFilters.buildLowPassDesignedFilter();
    RETURN_CODE status = iirButterworthFilterDesign(&actual);

    ASSERT_EQ(status, SUCCESS);

    IirButterworthFilterDesignTest::filterTestUtils.filterDescriptionsAreEquivalent(&actual, &expected);

    free(actual.parameters.sosNumeratorCoefficients);
    free(actual.parameters.sosDenominatorCoefficients);
    free(expected.parameters.sosNumeratorCoefficients);
    free(expected.parameters.sosDenominatorCoefficients);
}