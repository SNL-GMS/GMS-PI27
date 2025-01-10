#ifndef ROTATION_PARAMETERS_H
#define ROTATION_PARAMETERS_H

#include <map>
#include <optional>

#include "common/Location.hh"
#include "common/RequiredPropertyException.hh"
#include "common/OrientationAngles.hh"

class RotationParameters {
public:
    class Builder
    {
    public:
        Builder() = default;
        std::map<std::string, bool, std::less<>> required = {
            {"receiverToSourceAzimuthDeg", false},
            {"sampleRateHz", false},
            {"sampleRateToleranceHz", false},
            {"location", false},
            {"locationToleranceKm", false},
            {"orientationAngles", false},
            {"orientationAngleToleranceDeg", false},
        };
        std::optional<double> _receiverToSourceAzimuthDeg;
        std::optional<double> _slownessSecPerDeg;
        std::optional<double> _sampleRateHz;
        std::optional<double> _sampleRateToleranceHz;
        std::optional<Location> _location;
        std::optional<double> _locationToleranceKm;
        std::optional<OrientationAngles> _orientationAngles;
        std::optional<double> _orientationAngleToleranceDeg;

        Builder& receiverToSourceAzimuthDeg(double receiverToSourceAzimuthDeg)
        {
            this->_receiverToSourceAzimuthDeg = receiverToSourceAzimuthDeg;
            this->required["receiverToSourceAzimuthDeg"] = true;
            return *this;
        };

        Builder& slownessSecPerDeg(std::optional<double> const& slownessSecPerDeg)
        {
            this->_slownessSecPerDeg = slownessSecPerDeg;
            return *this;
        };
        Builder& sampleRateHz(double sampleRateHz)
        {
            this->_sampleRateHz = sampleRateHz;
            this->required["sampleRateHz"] = true;
            return *this;
        };
        Builder& sampleRateToleranceHz(double sampleRateToleranceHz)
        {
            this->_sampleRateToleranceHz = sampleRateToleranceHz;
            this->required["sampleRateToleranceHz"] = true;
            return *this;
        };
        Builder& location(Location const& location)
        {
            this->_location = location;
            this->required["location"] = true;
            return *this;
        };
        Builder& locationToleranceKm(double locationToleranceKm)
        {
            this->_locationToleranceKm = locationToleranceKm;
            this->required["locationToleranceKm"] = true;
            return *this;
        };
        Builder& orientationAngles(OrientationAngles const& orientationAngles)
        {
            this->_orientationAngles = orientationAngles;
            this->required["orientationAngles"] = true;
            return *this;
        };
        Builder& orientationAngleToleranceDeg(double orientationAngleToleranceDeg)
        {
            this->_orientationAngleToleranceDeg = orientationAngleToleranceDeg;
            this->required["orientationAngleToleranceDeg"] = true;
            return *this;
        };

        RotationParameters build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = RotationParameters(*this);
            return output;
        };

    };


    double receiverToSourceAzimuthDeg;
    std::optional<double> slownessSecPerDeg;
    double sampleRateHz;
    double sampleRateToleranceHz;
    Location location;
    double locationToleranceKm;
    OrientationAngles orientationAngles;
    double orientationAngleToleranceDeg;

private:
    explicit RotationParameters(RotationParameters::Builder bld)
        : receiverToSourceAzimuthDeg(bld._receiverToSourceAzimuthDeg.value()),
        sampleRateHz(bld._sampleRateHz.value()),
        sampleRateToleranceHz(bld._sampleRateToleranceHz.value()),
        location(bld._location.value()),
        locationToleranceKm(bld._locationToleranceKm.value()),
        orientationAngles(bld._orientationAngles.value()),
        orientationAngleToleranceDeg(bld._orientationAngleToleranceDeg.value()) {
            if(bld._slownessSecPerDeg.has_value()){
                this->slownessSecPerDeg =  bld._slownessSecPerDeg.value();
            }
        };
};

#endif //ROTATION_PARAMETERS_H