#include "FIRFilterParameters.hh"
#include "wasm/ArrayConverter.hh"

FIRFilterParameters::FIRFilterParameters(
  std::vector<double> const& transferFunctionB,
  int groupDelaySec,
  bool isDesigned,
  double sampleRateHz,
  double sampleRateToleranceHz
) : BaseFilterParameters(groupDelaySec,
  isDesigned,
  sampleRateHz,
  sampleRateToleranceHz),
transferFunctionB(transferFunctionB),
numTransferFunction(static_cast<int>(transferFunctionB.size() / 3)) {};

#if (__EMSCRIPTEN__)

emscripten::val FIRFilterParameters::getTransferFunctionAsTypedArray()
{
  return ArrayConverter::convertToFloat64Array(transferFunctionB);
}

#endif