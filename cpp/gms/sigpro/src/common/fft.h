#ifndef GMS_FFT_H
#define GMS_FFT_H

#include <complex.h>
#include <fftw3.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include "enums.h"

int forwardFft(double data[], int sampleCount, int* fftSize, fftw_complex** fftResult);

#endif // GMS_FFT_H