#ifndef SIGNAL_DETECTION_HYPOTHESIS_ID_H
#define SIGNAL_DETECTION_HYPOTHESIS_ID_H

#include <string>

class SignalDetectionHypothesisId {
public:
    SignalDetectionHypothesisId(std::string const& id, std::string const& signalDetectionId) : id(id), signalDetectionId(signalDetectionId) {};
    std::string id;
    std::string signalDetectionId;
};

#endif // SIGNAL_DETECTION_HYPOTHESIS_ID_H