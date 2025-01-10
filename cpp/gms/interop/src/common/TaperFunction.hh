#ifndef TAPER_FUNCTIONS_H
#define TAPER_FUNCTIONS_H

enum class TaperFunction
{
    BLACKMAN = 0,
    COSINE = 1,
    HAMMING = 2,
    HANNING = 3,
    PARZEN = 4,
    WELCH = 5
};

#endif // TAPER_FUNCTIONS_H