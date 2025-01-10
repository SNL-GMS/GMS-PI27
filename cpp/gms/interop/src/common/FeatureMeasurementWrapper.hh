#ifndef FEATURE_MEASUREMENT_WRAPPER_H
#define FEATURE_MEASUREMENT_WRAPPER_H

#include <cassert>
#include <optional>
#include "AmplitudeMeasurementValue.hh"
#include "ArrivalTimeMeasurementValue.hh"
#include "DurationMeasurementValue.hh"
#include "FeatureMeasurementType.hh"
#include "EnumeratedMeasurementValue.hh"
#include "NumericMeasurementValue.hh"

class FeatureMeasurementWrapper {
public:
    enum class MeasurementValueDiscriminator {
        AMPLITUDE = 0,
        ARRIVAL_TIME = 1,
        DURATION = 2,
        ENUMERATED = 3,
        NUMERIC = 4
    };
    class Builder {
    public:
        std::optional<AmplitudeMeasurementValue> _amplitudeMeasurementValue;
        std::optional<ArrivalTimeMeasurementValue> _arrivalTimeMeasurementValue;
        std::optional<DurationMeasurementValue> _durationMeasurementValue;
        std::optional<EnumeratedMeasurementValue> _enumeratedMeasurementValue;
        std::optional<NumericMeasurementValue> _numericMeasurementValue;
        MeasurementValueDiscriminator _discriminator;

        Builder& amplitudeMeasurementValue(AmplitudeMeasurementValue amplitudeMeasurementValue)
        {
            this->_amplitudeMeasurementValue = amplitudeMeasurementValue;
            this->_discriminator = MeasurementValueDiscriminator::AMPLITUDE;
            return *this;
        };

        Builder& arrivalTimeMeasurementValue(ArrivalTimeMeasurementValue arrivalTimeMeasurementValue)
        {
            this->_arrivalTimeMeasurementValue = arrivalTimeMeasurementValue;
            this->_discriminator = MeasurementValueDiscriminator::ARRIVAL_TIME;
            return *this;
        };

        Builder& durationMeasurementValue(DurationMeasurementValue durationMeasurementValue)
        {
            this->_durationMeasurementValue = durationMeasurementValue;
            this->_discriminator = MeasurementValueDiscriminator::DURATION;
            return *this;
        };

        Builder& enumeratedMeasurementValue(EnumeratedMeasurementValue enumeratedMeasurementValue)
        {
            this->_enumeratedMeasurementValue = enumeratedMeasurementValue;
            this->_discriminator = MeasurementValueDiscriminator::ENUMERATED;
            return *this;
        };

        Builder& numericMeasurementValue(NumericMeasurementValue numericMeasurementValue)
        {
            this->_numericMeasurementValue = numericMeasurementValue;
            this->_discriminator = MeasurementValueDiscriminator::NUMERIC;
            return *this;
        };

        FeatureMeasurementWrapper build() const
        {
            auto output = FeatureMeasurementWrapper(*this);
            return output;
        };
    };

    AmplitudeMeasurementValue* getAmplitudeMeasurementValue() {
        return &this->amplitudeMeasurementValue.value();
    };

    ArrivalTimeMeasurementValue* getArrivalTimeMeasurementValue() {
        return &this->arrivalTimeMeasurementValue.value();
    }

    DurationMeasurementValue* getDurationMeasurementValue() {
        return &this->durationMeasurementValue.value();
    }

    EnumeratedMeasurementValue* getEnumeratedMeasurementValue() {
        return &this->enumeratedMeasurementValue.value();
    }

    NumericMeasurementValue* getNumericMeasurementValue() {
        return &this->numericMeasurementValue.value();
    }

private:
    explicit FeatureMeasurementWrapper(FeatureMeasurementWrapper::Builder bld) : discriminator(bld._discriminator) {
        if (bld._amplitudeMeasurementValue.has_value()) {
            this->amplitudeMeasurementValue = bld._amplitudeMeasurementValue.value();
        }
        if (bld._arrivalTimeMeasurementValue.has_value()) {
            this->arrivalTimeMeasurementValue = bld._arrivalTimeMeasurementValue.value();
        }
        if (bld._durationMeasurementValue.has_value()) {
            this->durationMeasurementValue = bld._durationMeasurementValue.value();
        }
        if (bld._enumeratedMeasurementValue.has_value()) {
            this->enumeratedMeasurementValue = bld._enumeratedMeasurementValue.value();
        }
        if (bld._numericMeasurementValue.has_value()) {
            this->numericMeasurementValue = bld._numericMeasurementValue.value();
        }
        assert(bld._discriminator == this->discriminator);
    };

    std::optional<AmplitudeMeasurementValue> amplitudeMeasurementValue;
    std::optional<ArrivalTimeMeasurementValue> arrivalTimeMeasurementValue;
    std::optional<DurationMeasurementValue> durationMeasurementValue;
    std::optional<EnumeratedMeasurementValue> enumeratedMeasurementValue;
    std::optional<NumericMeasurementValue> numericMeasurementValue;
    FeatureMeasurementWrapper::MeasurementValueDiscriminator discriminator;
};



#endif // FEATURE_MEASUREMENT_WRAPPER_H