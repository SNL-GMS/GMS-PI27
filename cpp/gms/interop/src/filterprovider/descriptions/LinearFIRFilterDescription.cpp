#include "LinearFIRFilterDescription.hh"

LinearFIRFilterDescription::LinearFIRFilterDescription(FIRFilterParameters const& parameters,
    bool causal,
    std::string const& comments,
    double highFrequencyHz,
    double lowFrequencyHz,
    FilterBandType passBandType,
    FilterDesignModel filterDesignModel,
    int order,
    bool zeroPhase) noexcept : BaseLinearFilterDescription(
        lowFrequencyHz,
        highFrequencyHz,
        passBandType,
        filterDesignModel,
        order,
        zeroPhase,
        causal,
        comments),
    parameters(parameters) {};
