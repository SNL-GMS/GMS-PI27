#ifndef WAVEFORM_H
#define WAVEFORM_H

#include <vector>

#include "Timeseries.hh"

class Waveform : public Timeseries{

    public:
        Waveform(std::vector<double> const& samples,
                 double const& startTime, 
                 double const& endTime, 
                 double sampleRateHz) : Timeseries(startTime, endTime, sampleRateHz, (int)samples.size()), samples(samples){};
        std::vector<double> samples;

};

#endif //WAVEFORM_H