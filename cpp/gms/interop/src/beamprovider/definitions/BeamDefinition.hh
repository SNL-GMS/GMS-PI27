#ifndef BEAM_DEFINITION_H
#define BEAM_DEFINITION_H

#include "beamprovider/descriptions/BeamDescription.hh"
#include "beamprovider/parameters/BeamParameters.hh"


class BeamDefinition {
public:
    explicit BeamDefinition(
        BeamDescription const& beamDescription,
        BeamParameters const& beamParameters)
        : beamDescription(beamDescription),
        beamParameters(beamParameters) {};

    BeamDescription beamDescription;
    BeamParameters beamParameters;
};

#endif // BEAM_DEFINITION_H