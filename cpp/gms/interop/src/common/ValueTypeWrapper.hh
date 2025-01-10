#ifndef VALUE_TYPE_WRAPPER_H
#define VALUE_TYPE_WRAPPER_H

#include <cassert>
#include <optional>
#include "DoubleValue.hh"
#include "DurationValue.hh"
#include "InstantValue.hh"

class ValueTypeWrapper {
public:
    enum class ValueTypeDiscriminator {
        DOUBLE_VALUE = 0,
        DURATION_VALUE = 1,
        INSTANT_VALUE = 2
    };
    class Builder {
    public:
        std::optional<DoubleValue> _doubleValue;
        std::optional<DurationValue> _durationValue;
        std::optional<InstantValue> _instantValue;
        ValueTypeDiscriminator _discriminator;

        Builder& doubleValue(DoubleValue doubleValue)
        {
            this->_doubleValue = doubleValue;
            this->_discriminator = ValueTypeDiscriminator::DOUBLE_VALUE;
            return *this;
        };

        Builder& durationValue(DurationValue durationValue)
        {
            this->_durationValue = durationValue;
            this->_discriminator = ValueTypeDiscriminator::DURATION_VALUE;
            return *this;
        };

        Builder& instantValue(InstantValue instantValue)
        {
            this->_instantValue = instantValue;
            this->_discriminator = ValueTypeDiscriminator::INSTANT_VALUE;
            return *this;
        };

        ValueTypeWrapper build() const
        {
            auto output = ValueTypeWrapper(*this);
            return output;
        };
    };

    DoubleValue* getDoubleValue() {
        return &this->doubleValue.value();
    };

    DurationValue* getDurationValue() {
        return &this->durationValue.value();
    }

    InstantValue* getInstantValue() {
        return &this->instantValue.value();
    }

private:
    explicit ValueTypeWrapper(ValueTypeWrapper::Builder bld) : discriminator(bld._discriminator) {
        if (bld._doubleValue.has_value()) {
            this->doubleValue = bld._doubleValue.value();
        }
        if (bld._durationValue.has_value()) {
            this->durationValue = bld._durationValue.value();
        }
        if (bld._instantValue.has_value()) {
            this->instantValue = bld._instantValue.value();
        }
        assert(bld._discriminator == this->discriminator);
    };

    std::optional<DoubleValue> doubleValue;
    std::optional<DurationValue> durationValue;
    std::optional<InstantValue> instantValue;
    ValueTypeWrapper::ValueTypeDiscriminator discriminator;
};



#endif // VALUE_TYPE_WRAPPER_H