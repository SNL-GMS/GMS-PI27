#ifndef EVENT_HYPOTHESIS_ID_H
#define EVENT_HYPOTHESIS_ID_H

#include <string>

class EventHypothesisId {
public:
    EventHypothesisId(std::string const& eventId, std::string const& hypothesisId) : eventId(eventId), hypothesisId(hypothesisId) {};
    std::string eventId;
    std::string hypothesisId;
};

#endif // EVENT_HYPOTHESIS_ID_H