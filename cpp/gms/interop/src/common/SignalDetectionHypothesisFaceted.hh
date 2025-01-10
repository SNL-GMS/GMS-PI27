#ifndef SIGNAL_DETECTION_HYPOTHESIS_FACETED_H
#define SIGNAL_DETECTION_HYPOTHESIS_FACETED_H

#include "./SignalDetectionHypothesisId.hh"

class SignalDetectionHypothesisFaceted {
public:
    explicit SignalDetectionHypothesisFaceted(SignalDetectionHypothesisId const& id) : id(id) {};
    SignalDetectionHypothesisId id;
};

#endif // SIGNAL_DETECTION_HYPOTHESIS_FACETED_H