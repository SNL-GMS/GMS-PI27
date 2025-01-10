#include "CascadeFilterParameters.hh"

CascadeFilterParameters::CascadeFilterParameters(int groupDelaySec,
    bool isDesigned,
    double sampleRateHz,
    double sampleRateToleranceHz) : BaseFilterParameters(groupDelaySec,
        isDesigned,
        sampleRateHz,
        sampleRateToleranceHz) {};