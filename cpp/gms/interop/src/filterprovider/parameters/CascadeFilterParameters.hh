#ifndef CASCADED_FILTERS_PARAMETERS_H
#define CASCADED_FILTERS_PARAMETERS_H

#include <stdexcept>
#include <vector>
#include "BaseFilterParameters.hh"
#include "filterprovider/constants.hh"
#include "filterprovider/descriptions/BaseLinearFilterDescription.hh"
#include "filterprovider/wrappers/FilterDescriptionWrapper.hh"

class CascadeFilterParameters : public BaseFilterParameters
{
public:
  CascadeFilterParameters(int groupDelaySec,
    bool isDesigned,
    double sampleRateHz,
    double sampleRateToleranceHz);
};

#endif // CASCADED_FILTERS_PARAMETERS_H
