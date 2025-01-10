#ifndef BASE_FILTER_DESCRIPTION_H
#define BASE_FILTER_DESCRIPTION_H
#include <string>
#include "filterprovider/enums.hh"

class BaseFilterDescription
{
public:
    BaseFilterDescription(bool causal, std::string const& comments)noexcept;
    virtual ~BaseFilterDescription() = default;
    bool causal;
    std::string comments;

    virtual FilterDescriptionType getFilterDescriptionType() const
    {
        return FilterDescriptionType::BASE_FILTER_DESCRIPTION;
    };
};

#endif