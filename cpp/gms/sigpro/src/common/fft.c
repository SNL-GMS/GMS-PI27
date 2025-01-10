#include "fft.h"

int forwardFft(double data[], int sampleCount, int* fftSize, fftw_complex** fftResult)
{
    int i;
    fftw_plan fftPlan;

    *fftSize = 0;

    i = 0;
    while (*fftSize < sampleCount)
    {
      *fftSize = (int) pow(2.0, (double) i);
      i++;
    }

    if (*fftSize == 0)
    {
        return INSUFFICIENT_DATA;
    }

    *fftResult = (fftw_complex*) fftw_malloc(*fftSize * sizeof(fftw_complex));
    if (*fftSize == sampleCount)
    {
        fftPlan = fftw_plan_dft_r2c_1d(*fftSize, data, *fftResult, FFTW_ESTIMATE);
        fftw_execute(fftPlan);
    }
    else
    {
        double* paddedData = (double*) calloc(*fftSize, sizeof(double));
        memcpy(paddedData, data, sampleCount * sizeof(double));
        fftPlan = fftw_plan_dft_r2c_1d(*fftSize, paddedData, *fftResult, FFTW_ESTIMATE);
        fftw_execute(fftPlan);
        free(paddedData);
    } 

    fftw_destroy_plan(fftPlan);

    return SUCCESS;
}
