#include "UiWasmProvider.hh"

extern "C"
{
  void cGetBoundsForPositionBuffer(const double *const data,
                                   const int sizeOfData,
                                   const int startIndex,
                                   const int endIndex,
                                   double *min,
                                   double *minSecs,
                                   double *max,
                                   double *maxSecs)
  {
    if (sizeOfData % 2 != 0)
    {
      const auto errMsg{"Cannot calculate position buffer: must have an even number of elements."};
      throw std::invalid_argument(errMsg);
    }

    if (startIndex < 0 || startIndex > endIndex)
    {
      const auto errMsg{"Cannot calculate position buffer: start index must be greater than 0 and less than end index."};
      throw std::invalid_argument(errMsg);
    }

    if (endIndex >= sizeOfData)
    {
      const auto errMsg{"Cannot calculate position buffer: end index must be less than the length of data."};
      throw std::invalid_argument(errMsg);
    }

    if (startIndex % 2 != 1 || endIndex % 2 != 1)
    {
      const auto errMsg{"Cannot calculate position buffer: must provide odd indices to access y values."};
      throw std::invalid_argument(errMsg);
    }

    int minIndex = startIndex;
    int maxIndex = startIndex;

    // format is x y x y x
    for (int i = startIndex + 2; i <= endIndex; i += 2)
    {
      if (data[i] > data[maxIndex])
      {
        maxIndex = i;
      }
      else if (data[i] < data[minIndex])
      {
        minIndex = i;
      }
    }

    *min = data[minIndex];
    *minSecs = data[minIndex - 1];
    *max = data[maxIndex];
    *maxSecs = data[maxIndex - 1];
  }
}
