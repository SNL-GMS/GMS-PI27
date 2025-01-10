#ifndef SIGNAL_DETECTION_HYPOTHESIS_H
#define SIGNAL_DETECTION_HYPOTHESIS_H

#include <vector>
#include <optional>
#include "EventHypothesisId.hh"
#include "FeatureMeasurementWrapper.hh"
#include "StationVersionReference.hh"
#include "SignalDetectionHypothesisId.hh"
#include "SignalDetectionHypothesisFaceted.hh"

class SignalDetectionHypothesis {
public:
    explicit SignalDetectionHypothesis(
        SignalDetectionHypothesisId const& id,
        std::string const& monitoringOrganization,
        bool deleted,
        StationVersionReference const& station,
        std::vector<FeatureMeasurementWrapper> const& featureMeasurements,
        std::optional<SignalDetectionHypothesisFaceted> const& parentSignalDetectionHypothesis
    )
        : id(id),
        monitoringOrganization(monitoringOrganization),
        deleted(deleted),
        station(station),
        featureMeasurements(featureMeasurements),
        parentSignalDetectionHypothesis(parentSignalDetectionHypothesis) {};

    SignalDetectionHypothesisId id;
    std::string monitoringOrganization;
    bool deleted;
    StationVersionReference station;
    std::vector<FeatureMeasurementWrapper> featureMeasurements;
    std::optional<SignalDetectionHypothesisFaceted> parentSignalDetectionHypothesis;
};

#endif // SIGNAL_DETECTION_HYPOTHESIS_H