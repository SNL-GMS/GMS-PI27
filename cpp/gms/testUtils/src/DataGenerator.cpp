#include "DataGenerator.hh"

std::vector<double> GmsTestUtils::DataGenerator::generateSine(int duration, double sampleRateHz, double amplitude) {
    std::vector<double> waveformSamples;
    auto totalSamples = (int)(duration * sampleRateHz);
    auto frequency = sampleRateHz / duration;
    if(frequency <= 0) frequency = 1;
    for (int sampleCount = 0; sampleCount < totalSamples; sampleCount++)
    {
        double precision = 1.0 / 10000000.0;
        double sample = amplitude * sin(2 * M_PI * frequency * sampleCount + 0);
        if(fabs(sample) < precision) sample = 0;
        waveformSamples.push_back(sample);
    }
    return waveformSamples;
};