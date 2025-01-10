#include "FilterProviderTests.hh"
void FilterProviderTests::SetUp()
{
    TEST_DATA = FilterTestUtils::getTwoHourDataCopy();
};

TEST_F(FilterProviderTests, BW_LP_CAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    double *testData = TEST_DATA.data();
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    try
    {
        FilterProvider::filterApply(
            &designedFilter,
            testData,
            FilterProviderTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(testData, expected.data(), FilterProviderTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(FilterProviderTests, BW_BP_CAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    double *testData = TEST_DATA.data();
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    try
    {
        FilterProvider::filterApply(
            &designedFilter,
            testData,
            FilterProviderTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
        GmsTestUtils::Comparisons::precisionCompare(testData, expected.data(), FilterProviderTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(FilterProviderTests, BW_HP_NONCAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    double *testData = TEST_DATA.data();
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    try
    {
        FilterProvider::filterApply(
            &designedFilter,
            testData,
            FilterProviderTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(testData, expected.data(), FilterProviderTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(FilterProviderTests, BW_BR_NONCAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    double *testData = TEST_DATA.data();
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    try
    {
        FilterProvider::filterApply(
            &designedFilter,
            testData,
            FilterProviderTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(testData, expected.data(), FilterProviderTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(FilterProviderTests, CASCADED_FILTER_LPHP_FILTER)
{
    FilterTestUtils testUtils;
    double *testData = TEST_DATA.data();
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    auto designedFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    try
    {
        FilterProvider::filterApply(
            &designedFilter,
            testData,
            FilterProviderTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(testData, expected.data(), FilterProviderTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};