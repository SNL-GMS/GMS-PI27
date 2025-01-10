#ifndef CHANNEL_VERSION_REFERENCE_H
#define CHANNEL_VERSION_REFERENCE_H

#include <chrono>
#include <string>

#include "BaseVersionReference.hh"

class ChannelVersionReference : public BaseVersionReference
{

public:
    ChannelVersionReference(std::string const &name, double const &effectiveAt)
        : BaseVersionReference(effectiveAt), name(name){};
    std::string name;
};

#endif // CHANNEL_VERSION_REFERENCE_H