#include "FilterDesignerTests.hh"

TEST_F(FilterDesignerTests, BW_LP_CAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER);
    FilterDesigner::filterDesign(&testFilter);
    testUtils.filtersAreEquivalent(&testFilter, &expectedFilter);
}

TEST_F(FilterDesignerTests, BW_HP_NONCAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER);
    FilterDesigner::filterDesign(&testFilter);
    testUtils.filtersAreEquivalent(&testFilter, &expectedFilter);
}

TEST_F(FilterDesignerTests, BW_BP_CAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER);
    FilterDesigner::filterDesign(&testFilter);
    testUtils.filtersAreEquivalent(&testFilter, &expectedFilter);
}

TEST_F(FilterDesignerTests, BW_BR_NONCAUSAL_FILTER)
{
    LinearIIRFilterDescription testFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_FILTER);
    LinearIIRFilterDescription expectedFilter = testUtils.getLinearFilter(TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER);
    FilterDesigner::filterDesign(&testFilter);
    testUtils.filtersAreEquivalent(&testFilter, &expectedFilter);
}

TEST_F(FilterDesignerTests, CASCADED_FILTER_LPHP_FILTER)
{
    auto testFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_FILTER);
    auto expectedFilter = testUtils.getCascadedFilter(TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER);
    auto ptrTestFilter = &testFilter;
    FilterDesigner::filterDesign(ptrTestFilter);
    testUtils.filtersAreEquivalent(&testFilter, &expectedFilter);
}