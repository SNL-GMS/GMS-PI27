#ifndef TAPER_DEFINITION_H
#define TAPER_DEFINITION_H

#include "TaperFunction.hh"
#include "Units.hh"

class TaperDefinition
{
public:
    TaperDefinition(TaperFunction taperFunction, double taperLengthSamples)
        : taperFunction(taperFunction), taperLengthSamples(taperLengthSamples) {};
    TaperFunction taperFunction;
    double taperLengthSamples;
};

#endif // TAPER_DEFINITION_H