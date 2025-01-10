#include "WasmFilterApplyTests.hh"

void WasmFilterApplyTests::SetUp()
{
    TEST_DATA = FilterTestUtils::getTwoHourDataCopy();
};

TEST_F(WasmFilterApplyTests, BW_LP_CAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    try
    {
        iirFilterApply(
            &designedFilter,
            TEST_DATA.data(),
            WasmFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), WasmFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
    
};

TEST_F(WasmFilterApplyTests, BW_BP_CAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    try
    {
        iirFilterApply(
            &designedFilter,
            TEST_DATA.data(),
            WasmFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), WasmFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(WasmFilterApplyTests, BW_HP_NONCAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    try
    {
        iirFilterApply(
            &designedFilter,
            TEST_DATA.data(),
            WasmFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
        GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), WasmFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(WasmFilterApplyTests, BW_BR_NONCAUSAL_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    auto designedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    try
    {
        iirFilterApply(
            &designedFilter,
            TEST_DATA.data(),
            WasmFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), WasmFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};

TEST_F(WasmFilterApplyTests, CASCADED_FILTER_LPHP_FILTER)
{
    FilterTestUtils testUtils;
    std::vector<double> expected = testUtils.getResultByIndex(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    auto designedFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    try
    {
        cascadeFilterApply(
            &designedFilter,
            TEST_DATA.data(),
            WasmFilterApplyTests::TEST_DATA_SIZE,
            FilterTestUtils::DEFAULT_TAPER,
            designedFilter.parameters.groupDelaySec,
            FilterTestUtils::DEFAULT_INDEX_OFFSET,
            FilterTestUtils::DEFAULT_INDEX_INCLUDE);
         GmsTestUtils::Comparisons::precisionCompare(TEST_DATA.data(), expected.data(), WasmFilterApplyTests::TEST_DATA_SIZE);
    }
    catch (std::exception &e)
    {
        std::cerr << e.what() << std::endl;
        FAIL();
    }
};