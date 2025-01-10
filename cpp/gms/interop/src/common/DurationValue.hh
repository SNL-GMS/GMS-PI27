#ifndef DURATION_VALUE_H
#define DURATION_VALUE_H

#include <optional>

class DurationValue {
public:
    DurationValue(
        double value,
        std::optional<double> standardDeviation)
        : value(value),
        standardDeviation(standardDeviation) {};

    double value;
    std::optional<double> standardDeviation;
};

#endif // DURATION_VALUE_H