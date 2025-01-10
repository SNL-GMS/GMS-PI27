#ifndef LOCATION_SOLUTION_H
#define LOCATION_SOLUTION_H

#include <string>
#include <vector>
#include "EventLocation.hh"
#include "FeaturePrediction.hh"
#include "Location.hh"
#include "LocationBehavior.hh"
#include "LocationRestraint.hh"
#include "LocationUncertainty.hh"
#include "NetworkMagnitudeSolution.hh"


class LocationSolution {
public:

    explicit LocationSolution
    (
        std::string const& id,
        std::vector<NetworkMagnitudeSolution> const& networkMagnitudeSolutions,
        std::vector<FeaturePrediction> const& featurePredictions,
        std::optional<LocationUncertainty> const& locationUncertainty,
        std::vector<LocationBehavior> const& locationBehaviors,
        EventLocation const& location,
        LocationRestraint const& locationRestraint
    )
        : id(id),
        networkMagnitudeSolutions(networkMagnitudeSolutions),
        featurePredictions(featurePredictions),
        locationUncertainty(locationUncertainty),
        locationBehaviors(locationBehaviors),
        location(location),
        locationRestraint(locationRestraint) {};
    std::string id;
    std::vector<NetworkMagnitudeSolution> networkMagnitudeSolutions;
    std::vector<FeaturePrediction> featurePredictions;
    std::optional<LocationUncertainty> locationUncertainty;
    std::vector<LocationBehavior> locationBehaviors;
    EventLocation location;
    LocationRestraint locationRestraint;
};

#endif // LOCATION_SOLUTION_H