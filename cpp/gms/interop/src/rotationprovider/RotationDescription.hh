#ifndef ROTATION_DESCRIPTION_H
#define ROTATION_DESCRIPTION_H

#include "common/SamplingType.hh"

class RotationDescription {
public:

    RotationDescription(bool twoDimensional, std::string const& phase, SamplingType samplingType)
        : twoDimensional(twoDimensional), phase(phase), samplingType(samplingType) {};

    bool twoDimensional;
    std::string phase;
    SamplingType samplingType;
};

#endif //ROTATION_DESCRIPTION_H