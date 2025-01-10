#ifndef QC_MEAN_TEST_H
#define QC_MEAN_TEST_H

#include "gtest/gtest.h"
#include <cmath>
extern "C"
{
    #include "common/structs.h"
    #include "qc/qc.h"
}

class QcMeanTest : public ::testing::Test
{

    public:
        double error = 0.0000001;
        int waveformSampleCount = 10 * 40;
        
        void SetUp() override;

        ProcessingChannelSegment buildChannelSegment(std::vector<ProcessingWaveform>& waveforms);
        std::vector<ProcessingMask> buildMasksToApply();
        ProcessingWaveform buildWaveform(std::vector<double>& waveformData, std::vector<ProcessingMask>& maskedBy);
        std::vector<double> buildWaveformData();
        std::vector<ProcessingWaveform> buildWaveforms(std::vector<double>& waveformData, std::vector<ProcessingMask>& maskedBy, int waveformCount);
};

#endif // QC_MEAN_TEST_H