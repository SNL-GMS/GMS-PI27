#ifndef BASE_FILTER_PARAMETERS_H
#define BASE_FILTER_PARAMETERS_H

#include "filterprovider/enums.hh"

class BaseFilterParameters
{
public:
    BaseFilterParameters(int groupDelaySec,
        bool isDesigned,
        double sampleRateHz,
        double sampleRateToleranceHz);
    int groupDelaySec;
    bool isDesigned;
    double sampleRateHz;
    double sampleRateToleranceHz;
};

#endif // BASE_FILTER_PARAMETERS_H