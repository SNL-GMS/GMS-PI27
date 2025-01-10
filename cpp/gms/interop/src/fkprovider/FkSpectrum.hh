#ifndef FK_SPECTRUM_H
#define FK_SPECTRUM_H

#include <optional>
#include "FkAttributes.hh"

class FkSpectrum
{
public:
  FkSpectrum(
    std::vector<std::vector<double>> const& fstat,
    std::vector<std::vector<double>> const& power,
    std::optional<std::vector<FkAttributes>> const& fkAttributes,
    std::optional<double> const& fkQual
  )
    : fkAttributes(fkAttributes),
    fstat(fstat),
    power(power),
    fkQual(fkQual) {};

  std::vector<std::vector<double>> fstat;
  std::vector<std::vector<double>> power;
  std::optional<std::vector<FkAttributes>> fkAttributes;
  std::optional<double> fkQual;
};

#endif // FK_SPECTRUM_H