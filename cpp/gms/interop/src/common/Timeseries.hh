#ifndef TIME_SERIES_H
#define TIME_SERIES_H


class Timeseries
{
public:
    Timeseries(double const& startTime,
        double const& endTime,
        double sampleRateHz,
        int sampleCount) : startTime(startTime),
        endTime(endTime),
        sampleRateHz(sampleRateHz),
        sampleCount(sampleCount) {};

    double startTime;
    double endTime;
    double sampleRateHz;
    int sampleCount;

    Timeseries() = default;
};

#endif