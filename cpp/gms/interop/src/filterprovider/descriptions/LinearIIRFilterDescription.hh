#ifndef LINEAR_IIR_FILTER_DESCRIPTION_H
#define LINEAR_IIR_FILTER_DESCRIPTION_H
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"
#include "filterprovider/parameters/IIRFilterParameters.hh"
#include "filterprovider/enums.hh"

class LinearIIRFilterDescription : public BaseLinearFilterDescription
{
public:
  LinearIIRFilterDescription(IIRFilterParameters const& parameters,
    bool causal,
    std::string const& comments,
    double highFrequencyHz,
    double lowFrequencyHz,
    FilterBandType passBandType,
    FilterDesignModel filterDesignModel,
    int order,
    bool zeroPhase)noexcept;

  IIRFilterParameters parameters;

  FilterDescriptionType getFilterDescriptionType() const final
  {
    return FilterDescriptionType::IIR_FILTER_DESCRIPTION;
  };
};

#endif // LINEAR_IIR_FILTER_DESCRIPTION
