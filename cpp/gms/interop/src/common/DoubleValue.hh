#ifndef DOUBLE_VALUE_H
#define DOUBLE_VALUE_H
#include "Units.hh"

#include <optional>
class DoubleValue
{
public:
    DoubleValue(std::optional<double> standardDeviation, Units units, double value)
        : standardDeviation(standardDeviation), units(units), value(value) {};

    std::optional<double> standardDeviation;
    Units units;
    double value;
};

#endif // DOUBLE_VALUE_H