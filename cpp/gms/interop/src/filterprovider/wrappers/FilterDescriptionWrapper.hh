#ifndef FILTER_DESCRIPTION_WRAPPER_H
#define FILTER_DESCRIPTION_WRAPPER_H

#include <optional>

#include "filterprovider/descriptions/LinearIIRFilterDescription.hh"
#include "filterprovider/descriptions/LinearFIRFilterDescription.hh"
#include "filterprovider/enums.hh"

class FilterDescriptionWrapper
{
public:
    class Builder
    {
    public:
        std::optional<LinearFIRFilterDescription> _firDescription;
        std::optional<LinearIIRFilterDescription> _iirDescription;
        FilterDescriptionType _filterType;

        Builder& firDescription(LinearFIRFilterDescription const& firFilterDescription)
        {
            this->_firDescription = firFilterDescription;
            this->_filterType = FilterDescriptionType::FIR_FILTER_DESCRIPTION;
            return *this;
        };

        Builder& iirDescription(LinearIIRFilterDescription const& iirFilterDescription)
        {
            this->_iirDescription = iirFilterDescription;
            this->_filterType = FilterDescriptionType::IIR_FILTER_DESCRIPTION;
            return *this;
        };

        FilterDescriptionWrapper build() const
        {
            auto output = FilterDescriptionWrapper(*this);
            return output;
        };
    };

    int getFilterTypeValue() const;
    FilterDescriptionType filterType;
    std::optional<LinearFIRFilterDescription> firDescription;
    std::optional<LinearIIRFilterDescription> iirDescription;
    
private:
    explicit FilterDescriptionWrapper(FilterDescriptionWrapper::Builder bld) noexcept
        : filterType(bld._filterType),
        firDescription(bld._firDescription),
        iirDescription(bld._iirDescription) {};



};
#endif // FILTER_DESCRIPTION_WRAPPER_H