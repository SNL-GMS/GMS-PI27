#include "IIRFilterParameters.hh"
#include "wasm/ArrayConverter.hh"

IIRFilterParameters::IIRFilterParameters(
  std::vector<double> const& sosNumerator,
  std::vector<double> const& sosDenominator,
  std::vector<double> const& sosCoefficients,
  int groupDelaySec,
  bool isDesigned,
  double sampleRateHz,
  double sampleRateToleranceHz
) : BaseFilterParameters(groupDelaySec, isDesigned, sampleRateHz, sampleRateToleranceHz),
sosNumerator(sosNumerator),
sosDenominator(sosDenominator),
sosCoefficients(sosCoefficients),
numberOfSos(static_cast<int>(sosNumerator.size() / 3)) {};

#if (__EMSCRIPTEN__)

emscripten::val IIRFilterParameters::getSosNumeratorAsTypedArray()
{
  return ArrayConverter::convertToFloat64Array(sosNumerator);
}

emscripten::val IIRFilterParameters::getSosDenominatorAsTypedArray()
{
  return ArrayConverter::convertToFloat64Array(sosDenominator);
}

emscripten::val IIRFilterParameters::getSosCoefficientsAsTypedArray()
{
  return ArrayConverter::convertToFloat64Array(sosCoefficients);
}

#endif