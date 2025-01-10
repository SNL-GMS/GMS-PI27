#ifndef BEAM_PARAMETERS_H
#define BEAM_PARAMETERS_H

#include <functional>
#include <map>
#include <stdexcept>
#include <string>
#include "common/EventHypothesis.hh"
#include "common/Location.hh"
#include "common/OrientationAngles.hh"
#include "common/RequiredPropertyException.hh"
#include "common/SignalDetectionHypothesis.hh"

class BeamParameters {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"minWaveformsToBeam", false},
            {"orientationAngles", false},
            {"orientationAngleToleranceDeg", false},
            {"sampleRateHz", false},
            {"sampleRateToleranceHz", false}
        };

        std::optional<int> _minWaveformsToBeam;
        std::optional<OrientationAngles> _orientationAngles;
        std::optional<double> _orientationAngleToleranceDeg;
        std::optional<double> _receiverToSourceAzimuthDeg;
        std::optional<double> _sampleRateHz;
        std::optional<double> _slownessSecPerDeg;
        std::optional<double> _sampleRateToleranceHz;
        std::optional<Location> _location; // optional

        Builder& minWaveformsToBeam(double minWaveformsToBeam)
        {
            this->_minWaveformsToBeam = minWaveformsToBeam;
            this->required["minWaveformsToBeam"] = true;
            return *this;
        };

        Builder& orientationAngles(OrientationAngles const& orientationAngles)
        {
            this->_orientationAngles = orientationAngles;
            this->required["orientationAngles"] = true;
            return *this;
        };

        Builder& orientationAngleToleranceDeg(double const& orientationAngleToleranceDeg)
        {
            this->_orientationAngleToleranceDeg = orientationAngleToleranceDeg;
            this->required["orientationAngleToleranceDeg"] = true;
            return *this;
        };

        Builder& receiverToSourceAzimuthDeg(std::optional<double>  receiverToSourceAzimuthDeg)
        {
            this->_receiverToSourceAzimuthDeg = receiverToSourceAzimuthDeg;
            return *this;
        };

        Builder& sampleRateHz(double sampleRateHz)
        {
            this->_sampleRateHz = sampleRateHz;
            this->required["sampleRateHz"] = true;
            return *this;
        };

        Builder& slownessSecPerDeg(std::optional<double> slownessSecPerDeg)
        {
            this->_slownessSecPerDeg = slownessSecPerDeg;
            return *this;
        };

        Builder& sampleRateToleranceHz(double sampleRateToleranceHz)
        {
            this->_sampleRateToleranceHz = sampleRateToleranceHz;
            this->required["sampleRateToleranceHz"] = true;
            return *this;
        };

        Builder& location(std::optional<Location> const& location)
        {
            this->_location = location;
            return *this;
        };

        BeamParameters build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = BeamParameters(*this);
            return output;
        };
    };

    int minWaveformsToBeam;
    OrientationAngles orientationAngles;
    double orientationAngleToleranceDeg;
    double receiverToSourceAzimuthDeg;
    double sampleRateHz;
    double slownessSecPerDeg;
    double sampleRateToleranceHz;
    std::optional<Location> location;

private:
    explicit BeamParameters(BeamParameters::Builder bld)
        : minWaveformsToBeam(bld._minWaveformsToBeam.value()),
        orientationAngles(bld._orientationAngles.value()),
        orientationAngleToleranceDeg(bld._orientationAngleToleranceDeg.value()),
        receiverToSourceAzimuthDeg(bld._receiverToSourceAzimuthDeg.value()),
        sampleRateHz(bld._sampleRateHz.value()),
        slownessSecPerDeg(bld._slownessSecPerDeg.value()),
        sampleRateToleranceHz(bld._sampleRateToleranceHz.value()) {

        if (bld._location.has_value()) {
            location = bld._location.value();
        }
        if (bld._receiverToSourceAzimuthDeg.has_value()) {
            receiverToSourceAzimuthDeg = bld._receiverToSourceAzimuthDeg.value();
        }
        if (bld._slownessSecPerDeg.has_value()) {
            slownessSecPerDeg = bld._slownessSecPerDeg.value();
        }
    };
};

#endif // BEAM_PARAMETERS_H
