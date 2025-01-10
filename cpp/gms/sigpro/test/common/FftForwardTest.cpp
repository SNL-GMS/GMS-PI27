#include "FftForwardTest.hh"

void FftForwardTest::SetUp()
{
};

TEST_F(FftForwardTest, ZERO_SIGNAL)
{
    fftw_complex* fftResult;
    int fftSize;
    int status;

    double waveformData[64];
    for (int j = 0; j < 64; j++)
    {
        waveformData[j] = 0.0;
    }

    status = forwardFft(waveformData, 64, &fftSize, &fftResult);

    ASSERT_EQ(SUCCESS, status);
    ASSERT_EQ(64, fftSize);
    for (int j = 0; j < (fftSize / 2) + 1; j++)
    {
        ASSERT_EQ(0.0, fftResult[j][0]);
        ASSERT_EQ(0.0, fftResult[j][1]);
    }

    fftw_free(fftResult);
};


TEST_F(FftForwardTest, ONE_SIGNAL)
{
    fftw_complex* fftResult;
    int fftSize;
    int status;

    fftw_plan fftPlan;
    double inputData[64];
    fftw_complex expected[33];

    double waveformData[64];
    for (int j = 0; j < 64; j++)
    {
        waveformData[j] = 1.0;
    }
    
    for (int j = 0; j < 64; j++)
    {
        inputData[j] = 1.0;
    }

    fftPlan = fftw_plan_dft_r2c_1d(64, inputData, expected, FFTW_ESTIMATE);
    fftw_execute(fftPlan);

    fftw_destroy_plan(fftPlan);

    status = forwardFft(waveformData, 64, &fftSize, &fftResult);

    ASSERT_EQ(SUCCESS, status);
    ASSERT_EQ(64, fftSize);

    for (int j = 0; j < 33; j++)
    {
        EXPECT_EQ(expected[j][0], fftResult[j][0]);
        EXPECT_EQ(expected[j][1], fftResult[j][1]);
    }

    fftw_free(fftResult);
};

TEST_F(FftForwardTest, ZERO_SIGNAL_WITH_PADDING)
{
    fftw_complex* fftResult;
    int fftSize;
    int status;

    double waveformData[40];
    for (int j = 0; j < 40; j++)
    {
        waveformData[j] = 0.0;
    }

    status = forwardFft(waveformData, 40, &fftSize, &fftResult);

    ASSERT_EQ(SUCCESS, status);
    ASSERT_EQ(64, fftSize);
    for (int j = 0; j < (fftSize / 2) + 1; j++)
    {
        ASSERT_EQ(0.0, fftResult[j][0]);
        ASSERT_EQ(0.0, fftResult[j][1]);
    }

    fftw_free(fftResult);
};


TEST_F(FftForwardTest, ONE_SIGNAL_WITH_PADDING)
{
    fftw_complex* fftResult;
    int fftSize;
    int status;

    fftw_plan fftPlan;
    double inputData[64];
    fftw_complex expected[33];

    double waveformData[40];
    for (int j = 0; j < 40; j++)
    {
        waveformData[j] = 1.0;
    }
    
    for (int j = 0; j < 64; j++)
    {
        if (j < 40)
        {
            inputData[j] = 1.0;
        }
        else 
        {
            inputData[j] = 0.0;
        }
    }

    fftPlan = fftw_plan_dft_r2c_1d(64, inputData, expected, FFTW_ESTIMATE);
    fftw_execute(fftPlan);

    fftw_destroy_plan(fftPlan);

    status = forwardFft(waveformData, 40, &fftSize, &fftResult);

    ASSERT_EQ(SUCCESS, status);
    ASSERT_EQ(64, fftSize);

    for (int j = 0; j < 33; j++)
    {
        EXPECT_EQ(expected[j][0], fftResult[j][0]);
        EXPECT_EQ(expected[j][1], fftResult[j][1]);
    }

    fftw_free(fftResult);
};

TEST_F(FftForwardTest, INSUFFICIENT_DATA_TEST)
{
    fftw_complex* fftResult;
    int fftSize;
    int status;

    status = forwardFft({}, 0, &fftSize, &fftResult);

    ASSERT_EQ(INSUFFICIENT_DATA, status);
};
