#ifndef NETWORK_MAGNITUDE_BEHAVIOR_H
#define NETWORK_MAGNITUDE_BEHAVIOR_H

#include <vector>
#include "StationMagnitudeSolution.hh"

class NetworkMagnitudeBehavior {
public:
    NetworkMagnitudeBehavior(bool isDefining, StationMagnitudeSolution const& stationMagnitudeSolution, double residual, double weight) :
        isDefining(isDefining), stationMagnitudeSolution(stationMagnitudeSolution), residual(residual), weight(weight) {};
    bool isDefining;
    StationMagnitudeSolution stationMagnitudeSolution;
    double residual;
    double weight;
};

#endif // NETWORK_MAGNITUDE_BEHAVIOR