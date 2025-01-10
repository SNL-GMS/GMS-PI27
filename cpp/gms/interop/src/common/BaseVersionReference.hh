#ifndef BASE_VERSION_REFERENCE_H
#define BASE_VERSION_REFERENCE_H

#include <string>

class BaseVersionReference{

    public:
    explicit BaseVersionReference(double const& effectiveAt)
        : effectiveAt(effectiveAt){};

    double effectiveAt;
};

#endif //BASE_VERSION_REFERENCE_H