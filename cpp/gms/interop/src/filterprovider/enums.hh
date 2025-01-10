#ifndef GMS_FILTER_INTEROP_ENUMS_H
#define GMS_FILTER_INTEROP_ENUMS_H

enum class FilterComputationType
{
  FIR = 0,
  IIR = 1,
  AR = 2,
  PM = 3
};

enum class FilterDesignModel
{
  BUTTERWORTH = 0,
  CHEBYSHEV_I = 1,
  CHEBYSHEV_II = 2,
  ELLIPTIC = 3
};

enum class FilterBandType
{
  LOW_PASS = 0,
  HIGH_PASS = 1,
  BAND_PASS = 2,
  BAND_REJECT = 3
};

enum class FilterDescriptionType
{
  BASE_FILTER_DESCRIPTION = 0,
  BASE_LINEAR_FILTER_DESCRIPTION = 1,
  FIR_FILTER_DESCRIPTION = 2,
  IIR_FILTER_DESCRIPTION =3
};

#endif //GMS_FILTER_INTEROP_ENUMS_H