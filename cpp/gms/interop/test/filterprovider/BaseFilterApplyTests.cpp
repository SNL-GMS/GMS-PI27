#include "BaseFilterApplyTests.hh"

void BaseFilterApplyTests::SetUp()
{
    TEST_DATA = FilterTestUtils::getTwoHourDataCopy();
};


TEST_F(BaseFilterApplyTests, BW_LP_CAUSAL_BASE_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    try
    {
        _filterApply(
             TEST_DATA.data(),
            BaseFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.zeroPhase,
            designedFilter.parameters.sosNumerator,
            designedFilter.parameters.sosDenominator,
            designedFilter.parameters.numberOfSos);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), BaseFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};