#ifndef CHANNEL_H
#define CHANNEL_H

#include <string>

class Channel {

public:
    explicit Channel(std::string const& channelName) : channelName(channelName) {};
    std::string channelName;
};

#endif //CHANNEL_H