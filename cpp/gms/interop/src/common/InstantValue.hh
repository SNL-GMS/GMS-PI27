#ifndef INSTANT_VALUE_H
#define INSTANT_VALUE_H

#include <optional>

class InstantValue {
public:
    InstantValue(
        double const& value,
        std::optional<double> const& standardDeviation)
        : value(value),
        standardDeviation(standardDeviation) {};

    double value;
    std::optional<double> standardDeviation;
};

#endif // INSTANT_VALUE_H