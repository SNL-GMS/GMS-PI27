#ifndef FFT_FORWARD_TEST_H
#define FFT_FORWARD_TEST_H

#include "gtest/gtest.h"
#include <complex>
#include <fftw3.h>
#include <vector>

extern "C"
{
#include "common/enums.h"
#include "common/fft.h"
}

class FftForwardTest : public ::testing::Test
{
    public:
        void SetUp() override;
};

#endif // FFT_FORWARD_TEST_H
