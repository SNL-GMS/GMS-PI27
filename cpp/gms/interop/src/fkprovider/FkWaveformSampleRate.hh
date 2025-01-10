#ifndef FK_WAVEFORM_SAMPLE_RATE_H
#define FK_WAVEFORM_SAMPLE_RATE_H

class FkWaveformSampleRate{
    public:
        FkWaveformSampleRate(double waveformSampleRateHz,
                            double waveformSampleRateToleranceHz) 
                                : waveformSampleRateHz(waveformSampleRateHz),
                                  waveformSampleRateToleranceHz(waveformSampleRateToleranceHz){};
        double waveformSampleRateHz;
        double waveformSampleRateToleranceHz;
};

#endif //FK_WAVEFORM_SAMPLE_RATE_H