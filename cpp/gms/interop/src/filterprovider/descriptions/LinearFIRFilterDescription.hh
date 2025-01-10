#ifndef LINEAR_FIR_FILTER_DESCRIPTION_H
#define LINEAR_FIR_FILTER_DESCRIPTION_H
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"
#include "filterprovider/parameters/FIRFilterParameters.hh"
#include "filterprovider/enums.hh"

class LinearFIRFilterDescription : public BaseLinearFilterDescription
{
public:
  LinearFIRFilterDescription(FIRFilterParameters const& parameters,
    bool causal,
    std::string const& comments,
    double cutoffHigh,
    double cutoffLow,
    FilterBandType filterBandType,
    FilterDesignModel filterDesignModel,
    int filterOrder,
    bool zeroPhase)noexcept;

  FIRFilterParameters parameters;
  
  FilterDescriptionType getFilterDescriptionType() const final
  {
    return FilterDescriptionType::FIR_FILTER_DESCRIPTION;
  };
};

#endif // LINEAR_FIR_FILTER_DESCRIPTION
