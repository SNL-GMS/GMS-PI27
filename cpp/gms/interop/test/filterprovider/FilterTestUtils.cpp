#include "FilterTestUtils.hh"

void FilterTestUtils::filtersAreEquivalent(CascadeFilterDescription* actual, CascadeFilterDescription* expected) const
{
    FilterTestUtils::parametersAreEquivalent(&actual->parameters, &expected->parameters);

    // ENSURE ORDER AND TYPE HAVE NOT CHANGED
    for (int filterIdx = 0; filterIdx < actual->filterDescriptions.size(); filterIdx++)
    {
        FilterDescriptionWrapper actualWrapper = actual->filterDescriptions.at(filterIdx);
        FilterDescriptionWrapper expectedWrapper = expected->filterDescriptions.at(filterIdx);
        switch (actualWrapper.filterType)
        {
            case FilterDescriptionType::IIR_FILTER_DESCRIPTION:
            {
                FilterTestUtils::filtersAreEquivalent(&actualWrapper.iirDescription.value(), &expectedWrapper.iirDescription.value());
                break;
            }
            case FilterDescriptionType::FIR_FILTER_DESCRIPTION:
            {
                FilterTestUtils::filtersAreEquivalent(&actualWrapper.firDescription.value(), &expectedWrapper.firDescription.value());
                break;
            }
            default:
            {
                throw std::invalid_argument("Invalid index specified");
            }
        }
    }
};

void FilterTestUtils::filtersAreEquivalent(const BaseLinearFilterDescription* actual, const BaseLinearFilterDescription* expected) const
{
    ASSERT_EQ(actual->highFrequencyHz, expected->highFrequencyHz);
    ASSERT_EQ(actual->lowFrequencyHz, expected->lowFrequencyHz);
    ASSERT_EQ(actual->passBandType, expected->passBandType);
    ASSERT_EQ(actual->filterDesignModel, expected->filterDesignModel);
    ASSERT_EQ(actual->order, expected->order);
    ASSERT_EQ(actual->zeroPhase, expected->zeroPhase);
};

void FilterTestUtils::filtersAreEquivalent(LinearFIRFilterDescription* actual, LinearFIRFilterDescription* expected) const
{
    auto actualBase = static_cast<BaseLinearFilterDescription*>(actual);
    FilterTestUtils::filtersAreEquivalent(actualBase, expected);
    FilterTestUtils::parametersAreEquivalent(&actual->parameters, &expected->parameters);
};

void FilterTestUtils::filtersAreEquivalent(LinearIIRFilterDescription* actual, LinearIIRFilterDescription* expected) const
{
    auto actualBase = static_cast<BaseLinearFilterDescription*>(actual);
    auto expectedBase = static_cast<BaseLinearFilterDescription*>(expected);
    FilterTestUtils::filtersAreEquivalent(actualBase, expectedBase);
    FilterTestUtils::parametersAreEquivalent(&actual->parameters, &expected->parameters);
};

void FilterTestUtils::parametersAreEquivalent(const BaseFilterParameters* actual, const BaseFilterParameters* expected) const
{
    ASSERT_EQ(actual->groupDelaySec, expected->groupDelaySec);
    ASSERT_EQ(actual->isDesigned, expected->isDesigned);
    ASSERT_EQ(actual->sampleRateHz, expected->sampleRateHz);
    ASSERT_EQ(actual->sampleRateToleranceHz, expected->sampleRateToleranceHz);
};

void FilterTestUtils::parametersAreEquivalent(CascadeFilterParameters* actual, CascadeFilterParameters* expected) const
{
    ASSERT_EQ(actual->sampleRateHz, expected->sampleRateHz);
    ASSERT_EQ(actual->sampleRateToleranceHz, expected->sampleRateToleranceHz);
    auto actualBase = static_cast<BaseFilterParameters*>(actual);
    auto expectedBase = static_cast<BaseFilterParameters*>(expected);
    FilterTestUtils::parametersAreEquivalent(actualBase, expectedBase);
};

void FilterTestUtils::parametersAreEquivalent(FIRFilterParameters* actual, FIRFilterParameters* expected) const
{
    ASSERT_EQ(actual->numTransferFunction, expected->numTransferFunction);
    GmsTestUtils::Comparisons::precisionCompare(&actual->transferFunctionB, &expected->transferFunctionB);
    auto actualBase = static_cast<BaseFilterParameters*>(actual);
    auto expectedBase = static_cast<BaseFilterParameters*>(expected);
    FilterTestUtils::parametersAreEquivalent(actualBase, expectedBase);
};

void FilterTestUtils::parametersAreEquivalent(IIRFilterParameters* actual, IIRFilterParameters* expected) const
{
    ASSERT_EQ(actual->numberOfSos, expected->numberOfSos);
    GmsTestUtils::Comparisons::precisionCompare(&actual->sosDenominator, &expected->sosDenominator);
    GmsTestUtils::Comparisons::precisionCompare(&actual->sosNumerator, &expected->sosNumerator);

    auto actualBase = static_cast<BaseFilterParameters*>(actual);
    auto expectedBase = static_cast<BaseFilterParameters*>(expected);
    FilterTestUtils::parametersAreEquivalent(actualBase, expectedBase);
};

LinearIIRFilterDescription FilterTestUtils::getLinearFilter(TEST_FILTER_TYPE type) const
{
    switch (type)
    {
        case TEST_FILTER_TYPE::BW_LP_CAUSAL_FILTER:
            return testFilters.buildLowPassFilter();
        case TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER:
            return testFilters.buildLowPassDesignedFilter();
        case TEST_FILTER_TYPE::BW_HP_NONCAUSAL_FILTER:
            return testFilters.buildHighPassFilter();
        case TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER:
            return testFilters.buildHighPassDesignedFilter();
        case TEST_FILTER_TYPE::BW_BP_CAUSAL_FILTER:
            return testFilters.buildBandPassFilter();
        case TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER:
            return testFilters.buildBandPassDesignedFilter();
        case TEST_FILTER_TYPE::BW_BR_NONCAUSAL_FILTER:
            return testFilters.buildBandRejectFilter();
        case TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER:
            return testFilters.buildBandRejectDesignedFilter();
        default:
            throw std::invalid_argument("Invalid index specified");
    }
};

CascadeFilterDescription FilterTestUtils::getCascadedFilter(TEST_FILTER_TYPE type) const
{
    switch (type)
    {
        case TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_FILTER:
            return testFilters.buildCascade();
        case TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER:
            return testFilters.buildDesignedCascade();
        default:
            throw std::invalid_argument("Invalid index specified");
    }
};

std::array<double, TestData::TWO_HOUR_DATA_SIZE> FilterTestUtils::getTwoHourDataCopy()
{
    std::array<double, TestData::TWO_HOUR_DATA_SIZE> clone;
    std::copy(std::begin(TestData::TWO_HOUR_DATA), std::end(TestData::TWO_HOUR_DATA), std::begin(clone));
    return clone;
};

std::array<double, TestData::THREE_SECOND_DATA_SIZE> FilterTestUtils::getThreeSecondDataCopy()
{
    std::array<double, TestData::THREE_SECOND_DATA_SIZE> clone;
    std::copy(std::begin(TestData::THREE_SECOND_DATA), std::end(TestData::THREE_SECOND_DATA), std::begin(clone));
    return clone;
};

std::vector<double> FilterTestUtils::getResultByIndex(TEST_FILTER_TYPE index) const
{
    switch (index)
    {
        case TEST_FILTER_TYPE::BW_LP_CAUSAL_DESIGNED_FILTER:
            return std::vector<double>(TestData::BW_LP_CAUSAL_RESULTS);
        case TEST_FILTER_TYPE::BW_HP_NONCAUSAL_DESIGNED_FILTER:
            return std::vector<double>(TestData::BW_HP_NONCAUSAL_RESULTS);
        case TEST_FILTER_TYPE::BW_BP_CAUSAL_DESIGNED_FILTER:
            return std::vector<double>(TestData::BW_BP_CAUSAL_RESULTS);
        case TEST_FILTER_TYPE::BW_BR_NONCAUSAL_DESIGNED_FILTER:
            return std::vector<double>(TestData::BW_BR_NONCAUSAL_RESULTS);
        case TEST_FILTER_TYPE::CASCADED_FILTER_LPHP_DESIGNED_FILTER:
            return std::vector<double>(TestData::CASCADED_FILTER_LPHP_RESULTS);
        case TEST_FILTER_TYPE::TAPER_FWD:
            return std::vector<double>(TestData::TAPER_FWD_RESULTS);
        case TEST_FILTER_TYPE::TAPER_REV:
            return std::vector<double>(TestData::TAPER_REV_RESULTS);
        case TEST_FILTER_TYPE::TAPER_BOTH:
            return std::vector<double>(TestData::TAPER_BOTH_RESULTS);
        default:
            throw std::invalid_argument("Invalid index specified");
    }
};


