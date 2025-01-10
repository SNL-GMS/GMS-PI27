#ifndef FILTER_PROVIDER_H
#define FILTER_PROVIDER_H

#include <ccomplex>
#include <cmath>
#include <iostream> // std::cout
#include <sstream>  // std::stringstream
#include <string>   // std::string

#include "descriptions/CascadeFilterDescription.hh"
#include "descriptions/LinearFIRFilterDescription.hh"
#include "descriptions/LinearIIRFilterDescription.hh"
namespace GmsSigpro{
extern "C"{
    #include <filter/filter_iir.h>
}
}
namespace FilterProvider
{
     void filterApply(CascadeFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
     void filterApply(LinearIIRFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
     void filterApply(LinearFIRFilterDescription *filterDescription, double *data, int numberOfData, int taper, bool removeGroupDelay, int indexOffset, int indexInclude);
};

void _filterApply(double * data, int num_data, int index_offset, int index_inc, int taper, int zero_phase, std::vector<double> sos_numerator, std::vector<double> sos_denominator, int num_sos);
void _filterTaper(double * data, int num_data, int index_offset, int index_inc, int taper_samples, int direction);

#endif // FILTER_PROVIDER_H
