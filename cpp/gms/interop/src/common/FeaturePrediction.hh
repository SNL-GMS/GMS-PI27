#ifndef FEATURE_PREDICTION_H
#define FEATURE_PREDICTION_H

#include <functional>
#include <map>
#include <optional>
#include <stdexcept>
#include <string>
#include "Channel.hh"
#include "ChannelVersionReference.hh"
#include "ChannelSegment.hh"
#include "EventLocation.hh"
#include "FeatureMeasurementType.hh"
#include "Location.hh"
#include "PredictionValue.hh"
#include "ValueTypeWrapper.hh"

// TODO: this class (instead of PredictionValue) will hold feature prediction components in the future (instead of PredictionValue)
// TODO: derivative map in the future (when ready)
class FeaturePrediction {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"phase", false},
            {"extrapolated", false},
            {"predictedValue", false},
            {"sourceLocation", false},
            {"receiverLocation", false},
            {"predictionType", false}
        };

        std::optional<std::string> _phase;
        std::optional<bool> _extrapolated;
        std::optional<ValueTypeWrapper> _predictedValue;
        std::optional<EventLocation> _sourceLocation;
        std::optional<Location> _receiverLocation;
        std::optional<ChannelVersionReference> _channel; // optional
        std::optional<ChannelSegment> _predictionChannelSegment; // optional
        std::optional<FeatureMeasurementType> _predictionType;

        Builder& phase(std::string phase)
        {
            this->_phase = phase;
            this->required["phase"] = true;
            return *this;
        };

        Builder& extrapolated(bool extrapolated)
        {
            this->_extrapolated = extrapolated;
            this->required["extrapolated"] = true;
            return *this;
        };

        Builder& predictedValue(ValueTypeWrapper predictedValue)
        {
            this->_predictedValue = predictedValue;
            this->required["predictedValue"] = true;
            return *this;
        };

        Builder& sourceLocation(EventLocation sourceLocation)
        {
            this->_sourceLocation = sourceLocation;
            this->required["sourceLocation"] = true;
            return *this;
        };

        Builder& receiverLocation(Location receiverLocation)
        {
            this->_receiverLocation = receiverLocation;
            this->required["receiverLocation"] = true;
            return *this;
        };

        Builder& channel(ChannelVersionReference channel)
        {
            this->_channel = channel;
            return *this;
        };

        Builder& predictionChannelSegment(ChannelSegment predictionChannelSegment)
        {
            this->_predictionChannelSegment = predictionChannelSegment;
            return *this;
        };

        Builder& predictionType(FeatureMeasurementType predictionType)
        {
            this->_predictionType = predictionType;
            this->required["predictionType"] = true;
            return *this;
        };

        FeaturePrediction build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = FeaturePrediction(*this);
            return output;
        };
    };

    std::string phase;
    bool extrapolated;
    ValueTypeWrapper predictedValue;
    EventLocation sourceLocation;
    Location receiverLocation;
    ChannelVersionReference channel; // optional
    std::optional<ChannelSegment> predictionChannelSegment; // optional
    FeatureMeasurementType predictionType;

private:
    explicit FeaturePrediction(FeaturePrediction::Builder bld)
        : phase(bld._phase.value()),
        extrapolated(bld._extrapolated.value()),
        predictedValue(bld._predictedValue.value()),
        sourceLocation(bld._sourceLocation.value()),
        receiverLocation(bld._receiverLocation.value()),
        channel(bld._channel.value()),
        predictionType(bld._predictionType.value()) {
        if (bld._predictionChannelSegment.has_value()) {
            predictionChannelSegment = bld._predictionChannelSegment.value();
        }
    };
};

#endif // FEATURE_PREDICTION_H