#ifndef ROTATION_DEFINITION_H
#define ROTATION_DEFINITION_H

#include "RotationDescription.hh"
#include "RotationParameters.hh"

class RotationDefinition {
public:
    explicit RotationDefinition(RotationDescription const& rotationDescription, RotationParameters const& rotationParameters)
     : rotationDescription(rotationDescription), rotationParameters(rotationParameters) {};

    RotationDescription rotationDescription;
    RotationParameters rotationParameters;
};

#endif //ROTATION_DEFINITION_H