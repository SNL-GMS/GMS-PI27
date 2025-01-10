#ifndef NETWORK_MAGNITUDE_SOLUTION_H
#define NETWORK_MAGNITUDE_SOLUTION_H

#include <vector>
#include "DoubleValue.hh"
#include "NetworkMagnitudeBehavior.hh"
#include "MagnitudeType.hh"

class NetworkMagnitudeSolution {
public:
    NetworkMagnitudeSolution(
        DoubleValue const& magnitude,
        std::vector<NetworkMagnitudeBehavior> const& magnitudeBehaviors,
        MagnitudeType const& type) :
        magnitude(magnitude),
        magnitudeBehaviors(magnitudeBehaviors),
        type(type) {};

    DoubleValue magnitude;
    std::vector<NetworkMagnitudeBehavior> magnitudeBehaviors;
    MagnitudeType type;
};

#endif // NETWORK_MAGNITUDE_SOLUTIONS_H