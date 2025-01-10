#include "Location.hh"

bool Location::operator==(Location const& compared) const
{
    return this->elevationKm == compared.elevationKm &&
        this->latitudeDegrees == compared.latitudeDegrees &&
        this->longitudeDegrees == compared.longitudeDegrees &&
        this->depthKm == compared.depthKm;

};