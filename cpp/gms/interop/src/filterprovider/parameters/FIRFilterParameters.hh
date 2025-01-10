#ifndef FIR_FILTER_PARAMETERS_H
#define FIR_FILTER_PARAMETERS_H

#include <array>
#include <vector>
#include "filterprovider/constants.hh"
#include "BaseFilterParameters.hh"

#if (__EMSCRIPTEN__)

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/em_macros.h>

#endif

class FIRFilterParameters : public BaseFilterParameters
{

public:
  FIRFilterParameters(
  std::vector<double> const& transferFunctionB,
  int groupDelaySec,
  bool isDesigned,
  double sampleRateHz,
  double sampleRateToleranceHz
);

  std::vector<double> transferFunctionB;
  int numTransferFunction;

#if (__EMSCRIPTEN__)

  emscripten::val getTransferFunctionAsTypedArray();

#endif
};
#endif