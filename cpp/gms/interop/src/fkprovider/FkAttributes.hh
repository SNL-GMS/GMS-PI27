#ifndef FK_ATTRIBUTES_H
#define FK_ATTRIBUTES_H
#include "common/DoubleValue.hh"

class FkAttributes
{
public:
    FkAttributes(double peakFstat,
                 DoubleValue const& slowness,
                 DoubleValue const& receiverToSourceAzimuth)
        : peakFstat(peakFstat),
          slowness(slowness),
          receiverToSourceAzimuth(receiverToSourceAzimuth){};

    double peakFstat;
    DoubleValue slowness;
    DoubleValue receiverToSourceAzimuth;
};

#endif // FK_ATTRIBUTES_H