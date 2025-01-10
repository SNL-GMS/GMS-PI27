#ifndef TestFilters_H
#define TestFilters_H
#include <vector>
#include "filterprovider/descriptions/CascadeFilterDescription.hh"
#include "filterprovider/parameters/CascadeFilterParameters.hh"
#include "filterprovider/wrappers/FilterDescriptionWrapper.hh"
#include "filterprovider/descriptions/LinearIIRFilterDescription.hh"
#include "filterprovider/parameters/IIRFilterParameters.hh"
#include "filterprovider/enums.hh"
#include "TestEnums.hh"

class TestFilters
{
public:
    LinearIIRFilterDescription buildLowPassDesignedFilter() const;    // 0
    LinearIIRFilterDescription buildHighPassDesignedFilter() const;   // 1
    LinearIIRFilterDescription buildBandPassDesignedFilter() const;   // 2
    LinearIIRFilterDescription buildBandRejectDesignedFilter() const; // 3
    LinearIIRFilterDescription buildLowPassFilter() const;            // 0
    LinearIIRFilterDescription buildHighPassFilter() const;           // 1
    LinearIIRFilterDescription buildBandPassFilter() const;           // 2
    LinearIIRFilterDescription buildBandRejectFilter() const;         // 3
    CascadeFilterDescription buildCascade() const;
    CascadeFilterDescription buildDesignedCascade() const;
    LinearIIRFilterDescription buildHighPassCausalFilter() const;
    LinearIIRFilterDescription buildHighPassCausalDesignedFilter() const;
};

#endif // TestFilters_H