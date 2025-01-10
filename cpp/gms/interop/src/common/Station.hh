#ifndef STATION_H
#define STATION_H

#include <map>
#include <optional>
#include <string>
#include <vector>

#include "common/RequiredPropertyException.hh"

#include "Map.hh"
#include "RelativePosition.hh"
#include "StationVersionReference.hh"

class Station {
public:
    Station(
        StationVersionReference const& stationVersionReference,
        Map<std::string, RelativePosition> const& relativePositionsByChannel)
        : stationVersionReference(stationVersionReference),
        relativePositionsByChannel(relativePositionsByChannel) {};

    StationVersionReference stationVersionReference;
    Map<std::string, RelativePosition> relativePositionsByChannel;

};

#endif //STATION_H
