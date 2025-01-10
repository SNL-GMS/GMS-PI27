#ifndef EVENT_HYPOTHESIS_H
#define EVENT_HYPOTHESIS_H

#include <optional>
#include <string>
#include <vector>

#include "EventHypothesisId.hh"
#include "SignalDetectionHypothesisFaceted.hh"
#include "LocationSolution.hh"

class EventHypothesis {
public:

    // TODO: entity references for parents?? no parents?? optional for now
    explicit EventHypothesis(
        EventHypothesisId const& id,
        bool rejected,
        bool deleted,
        std::optional<std::vector<EventHypothesis>> const& parentEventHypotheses,
        std::vector<SignalDetectionHypothesisFaceted> const& associatedSignalDetectionHypotheses,
        std::string const& preferredLocationSolution,
        std::vector<LocationSolution> const& locationSolutions)
        : id(id),
        rejected(rejected),
        deleted(deleted),
        parentEventHypotheses(parentEventHypotheses),
        associatedSignalDetectionHypotheses(associatedSignalDetectionHypotheses),
        preferredLocationSolution(preferredLocationSolution),
        locationSolutions(locationSolutions) {};

    EventHypothesisId id;
    bool rejected;
    bool deleted;
    std::optional<std::vector<EventHypothesis>> parentEventHypotheses;
    std::vector<SignalDetectionHypothesisFaceted> associatedSignalDetectionHypotheses;
    std::string preferredLocationSolution;
    std::vector<LocationSolution> locationSolutions;
};

#endif // EVENT_HYPOTHESIS_H