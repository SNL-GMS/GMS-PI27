#ifndef BASE_LINEAR_FILTER_DESCRIPTION_H
#define BASE_LINEAR_FILTER_DESCRIPTION_H

#include "filterprovider/enums.hh"
#include "BaseFilterDescription.hh"
class BaseLinearFilterDescription : public BaseFilterDescription
{
public:
    BaseLinearFilterDescription(double lowFrequencyHz,
        double highFrequencyHz,
        FilterBandType passBandType,
        FilterDesignModel filterDesignModel,
        int order,
        bool zeroPhase,
        bool causal,
        std::string const& comments)noexcept;

    ~BaseLinearFilterDescription() override = default;

    double lowFrequencyHz;
    double highFrequencyHz;
    FilterBandType passBandType;
    FilterDesignModel filterDesignModel;
    int order;
    bool zeroPhase;

    FilterDescriptionType getFilterDescriptionType() const override
    {
        return FilterDescriptionType::BASE_LINEAR_FILTER_DESCRIPTION;
    };
};

#endif // BASE_LINEAR_FILTER_DESCRIPTION_H