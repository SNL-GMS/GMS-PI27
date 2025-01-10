#ifndef FK_FREQUENCY_RANGE_H
#define FK_FREQUENCY_RANGE_H

class FkFrequencyRange{
    public:
        FkFrequencyRange(double lowFrequencyHz, double highFrequencyHz) 
            : lowFrequencyHz(lowFrequencyHz), highFrequencyHz(highFrequencyHz){};

        double lowFrequencyHz;
        double highFrequencyHz;
};

#endif //FK_FREQUENCY_RANGE_H