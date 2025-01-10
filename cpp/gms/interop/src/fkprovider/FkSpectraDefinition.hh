#ifndef FK_SPECTRA_DEFINITION_H
#define FK_SPECTRA_DEFINITION_H

#include "common/OrientationAngles.hh"
#include "FkSpectraParameters.hh"

class FkSpectraDefinition {
public:
    FkSpectraDefinition(
        FkSpectraParameters const& fkParameters,
        OrientationAngles const& orientationAngles)
        : fkParameters(fkParameters),
        orientationAngles(orientationAngles) {};

    FkSpectraParameters fkParameters;
    OrientationAngles orientationAngles;

};

#endif //FK_SPECTRA_DEFINITION_H