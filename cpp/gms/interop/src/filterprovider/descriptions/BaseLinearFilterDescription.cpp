#include "BaseLinearFilterDescription.hh"

BaseLinearFilterDescription::BaseLinearFilterDescription(
  double lowFrequencyHz,
  double highFrequencyHz,
  FilterBandType passBandType,
  FilterDesignModel filterDesignModel,
  int order,
  bool zeroPhase,
  bool causal,
  std::string const& comments) noexcept :
  BaseFilterDescription(causal, comments),
  lowFrequencyHz(lowFrequencyHz),
  highFrequencyHz(highFrequencyHz),
  passBandType(passBandType),
  filterDesignModel(filterDesignModel),
  order(order),
  zeroPhase(zeroPhase) {};
