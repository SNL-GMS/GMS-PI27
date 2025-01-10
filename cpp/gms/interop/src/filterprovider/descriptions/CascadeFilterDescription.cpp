#include "CascadeFilterDescription.hh"

CascadeFilterDescription::CascadeFilterDescription(
    std::vector<FilterDescriptionWrapper> const& filterDescriptions,
    CascadeFilterParameters const& parameters,
    bool causal,
    std::string const& comments) noexcept : BaseFilterDescription(causal, comments),
    filterDescriptions(filterDescriptions),
    parameters(parameters) {};