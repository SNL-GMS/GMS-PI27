#include "FilterDesignTest.hh"

TEST_F(FilterDesignTest, DESIGNED_FILTER_DESCRIPTION_TEST)
{
    FilterDefinition actual = FilterDesignTest::testFilters.buildDesignedLowPassFilterDefinition();
    
    RETURN_CODE status = filterDesign(&actual);
    ASSERT_EQ(status, SUCCESS);

    FilterDefinition expected = FilterDesignTest::testFilters.buildDesignedLowPassFilterDefinition();
    FilterDesignTest::filterTestUtils.filterDefinitionsAreEquivalent(&actual, &expected);

    free(actual.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosNumeratorCoefficients);
    free(actual.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosDenominatorCoefficients);
    free(expected.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosNumeratorCoefficients);
    free(expected.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosDenominatorCoefficients);
}

TEST_F(FilterDesignTest, LINEAR_FILTER_DEFINITION_DESIGN_TEST)
{
    FilterDefinition actual = FilterDesignTest::testFilters.buildLowPassFilterDefinition();

    RETURN_CODE status = filterDesign(&actual);
    ASSERT_EQ(status, SUCCESS);

    FilterDefinition expected = FilterDesignTest::testFilters.buildDesignedLowPassFilterDefinition();
    FilterDesignTest::filterTestUtils.filterDefinitionsAreEquivalent(&actual, &expected);

    free(actual.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosNumeratorCoefficients);
    free(actual.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosDenominatorCoefficients);
    free(expected.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosNumeratorCoefficients);
    free(expected.filterDescription.nonCascadeFilterDescription.iirFilterDescription.parameters.sosDenominatorCoefficients);
}

TEST_F(FilterDesignTest, CASCADE_FILTER_DEFINITION_DESIGN_TEST)
{
    FilterDefinition actual = FilterDesignTest::testFilters.buildCascadeFilterDefinition();
    FilterDefinition expected = FilterDesignTest::testFilters.buildDesignedCascadeFilterDefinition();

    RETURN_CODE status = filterDesign(&actual);
    ASSERT_EQ(status, SUCCESS);

    FilterDesignTest::filterTestUtils.filterDefinitionsAreEquivalent(&actual, &expected);

    for (int i = 0; i < actual.filterDescription.cascadeFilterDescription.filterDescriptionCount; i++)
    {
        free(actual.filterDescription.cascadeFilterDescription.filterDescriptions[i].iirFilterDescription.parameters.sosNumeratorCoefficients);
        free(actual.filterDescription.cascadeFilterDescription.filterDescriptions[i].iirFilterDescription.parameters.sosDenominatorCoefficients);
    }

    free(actual.filterDescription.cascadeFilterDescription.filterDescriptions);

    for (int i = 0; i < expected.filterDescription.cascadeFilterDescription.filterDescriptionCount; i++)
    {
        free(expected.filterDescription.cascadeFilterDescription.filterDescriptions[i].iirFilterDescription.parameters.sosNumeratorCoefficients);
        free(expected.filterDescription.cascadeFilterDescription.filterDescriptions[i].iirFilterDescription.parameters.sosDenominatorCoefficients);
    }

    free(expected.filterDescription.cascadeFilterDescription.filterDescriptions);
}