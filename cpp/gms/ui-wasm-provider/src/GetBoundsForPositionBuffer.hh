#ifndef GET_BOUNDS_FOR_POSITION_BUFFER
#define UI_WASM_PROVIDER_H

#if (__EMSCRIPTEN__)
#include <emscripten/emscripten.h>
#endif

#include <iostream>
#include <stdexcept>


class GetBoundsForPositionBuffer
{
public:
    GetBoundsForPositionBuffer() = default;
};

extern "C"
{
    /**
     * Calculate the min, max y values for the provided position buffer.
     *
     * @param data formatted buffer of the format x y x y x y x y...
     * @param startIndex inclusive
     * @param endIndex inclusive     
     * @param min the min value (returned)
     * @param minSecs the min seconds value (returned)
     * @param max the max value (returned)
     * @param maxSecs the max seconds value (returned)
     */
    void cGetBoundsForPositionBuffer(const double *const data,
                                     const int sizeOfData,
                                     const int startIndex,
                                     const int endIndex,
                                     double *min,
                                     double *minSecs,
                                     double *max,
                                     double *maxSecs);

}

#endif // #define GET_BOUNDS_FOR_POSITION_BUFFER
