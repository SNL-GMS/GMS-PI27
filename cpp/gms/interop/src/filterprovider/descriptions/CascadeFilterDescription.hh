
#ifndef CASCADED_FILTER_DESCRIPTION_H
#define CASCADED_FILTER_DESCRIPTION_H

#include <stdexcept>
#include "filterprovider/parameters/CascadeFilterParameters.hh"

class CascadeFilterDescription : public BaseFilterDescription
{
public:
  CascadeFilterDescription(
    std::vector<FilterDescriptionWrapper> const& filterDescriptions,
    CascadeFilterParameters const& parameters,
    bool causal,
    std::string const& comments) noexcept;

  std::vector<FilterDescriptionWrapper> filterDescriptions;
  CascadeFilterParameters parameters;
};

#endif // CASCADED_FILTER_DESCRIPTION_H
