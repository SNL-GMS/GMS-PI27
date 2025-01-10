#ifndef FILTER_DESIGNER_H
#define FILTER_DESIGNER_H

#include <cmath>
#include <complex>
#include <string>

#include "filterprovider/enums.hh"
#include "filterprovider/descriptions/CascadeFilterDescription.hh"
#include "filterprovider/descriptions/LinearFIRFilterDescription.hh"
#include "filterprovider/descriptions/LinearIIRFilterDescription.hh"
#include "filterprovider/wrappers/FilterDescriptionWrapper.hh"

namespace GmsSigpro{
extern "C" {
#include <filter/enums.h>
#include <filter/filter_iir.h>  
}
}

namespace FilterDesigner
{
    void filterDesign(CascadeFilterDescription* filterDescription);
    void filterDesign(LinearIIRFilterDescription* filterDescription);
    void filterDesign(LinearFIRFilterDescription* filterDescription);
};
#endif // FILTER_DESIGNER_H