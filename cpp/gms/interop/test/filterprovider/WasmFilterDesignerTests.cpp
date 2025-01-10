#include "WasmFilterDesignerTests.hh"

TEST_F(WasmFilterDesignerTests, BW_LP_CAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription actual = iirFilterDesign(testFilter);
    testUtils.filtersAreEquivalent(&actual, &expectedFilter);
}

TEST_F(WasmFilterDesignerTests, BW_HP_NONCAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription actual = iirFilterDesign(testFilter);
    testUtils.filtersAreEquivalent(&actual, &expectedFilter);
}

TEST_F(WasmFilterDesignerTests, BW_BP_CAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription actual = iirFilterDesign(testFilter);
    testUtils.filtersAreEquivalent(&actual, &expectedFilter);
}

TEST_F(WasmFilterDesignerTests, BW_BR_NONCAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    LinearIIRFilterDescription actual = iirFilterDesign(testFilter);
    testUtils.filtersAreEquivalent(&actual, &expectedFilter);
}

TEST_F(WasmFilterDesignerTests, CASCADED_FILTER_LPHP_FILTER)
{
    auto testFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_FILTER);
    auto expectedFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    CascadeFilterDescription actual = cascadeFilterDesign(testFilter);
    testUtils.filtersAreEquivalent(&actual, &expectedFilter);
}