#include "OrientationAngles.hh"

bool OrientationAngles::operator==(OrientationAngles const& compared) const
{
    return this->horizontalAngleDeg == compared.horizontalAngleDeg &&
        this->verticalAngleDeg == compared.verticalAngleDeg;
};