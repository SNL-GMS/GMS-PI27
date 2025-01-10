#ifndef LOCATION_H
#define LOCATION_H

#include <optional>

class Location {
public:
    explicit Location(double latitudeDegrees, double longitudeDegrees, double elevationKm, double depthKm) :
        latitudeDegrees(latitudeDegrees), longitudeDegrees(longitudeDegrees), elevationKm(elevationKm), depthKm(depthKm) {};
    double latitudeDegrees;
    double longitudeDegrees;
    double elevationKm;
    double depthKm;

    bool operator==(Location const& compared) const;

};

#endif // LOCATION_H