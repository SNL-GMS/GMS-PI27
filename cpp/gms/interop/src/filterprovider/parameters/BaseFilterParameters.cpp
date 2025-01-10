#include "BaseFilterParameters.hh"

BaseFilterParameters::BaseFilterParameters(int groupDelaySec,
    bool isDesigned,
    double sampleRateHz,
    double sampleRateToleranceHz) : groupDelaySec(groupDelaySec),
    isDesigned(isDesigned),
    sampleRateHz(sampleRateHz),
    sampleRateToleranceHz(sampleRateToleranceHz) {};
