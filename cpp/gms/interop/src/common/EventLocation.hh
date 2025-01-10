#ifndef EVENT_LOCATION_H
#define EVENT_LOCATION_H

#include <optional>

class EventLocation {
public:
    explicit EventLocation(
        double latitudeDegrees,
        double longitudeDegrees,
        double depthKm,
        double time
    )
        : latitudeDegrees(latitudeDegrees),
        longitudeDegrees(longitudeDegrees),
        depthKm(depthKm),
        time(time) {};
    double latitudeDegrees;
    double longitudeDegrees;
    double depthKm;
    double time;
};

#endif // EVENT_LOCATION_H