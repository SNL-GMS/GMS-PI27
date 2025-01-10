#ifndef ELLIPSE_H
#define ELLIPSE_H

#include <functional>
#include <string>
#include <map>
#include <stdexcept>
#include <optional>
#include "ScalingFactorType.hh"
#include "RequiredPropertyException.hh"


class Ellipse {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"scalingFactorType", false},
            {"kWeight", false},
            {"confidenceLevel", false},
            {"semiMajorAxisLengthKm", false},
            {"semiMajorAxisTrendDeg", false},
            {"semiMinorAxisLengthKm", false},
            {"depthUncertaintyKm", false},
            {"timeUncertainty", false}
        };

        std::optional<ScalingFactorType> _scalingFactorType;
        std::optional<double> _kWeight;
        std::optional<double> _confidenceLevel;
        std::optional<double> _semiMajorAxisLengthKm; //optional
        std::optional<double> _semiMajorAxisTrendDeg; //optional
        std::optional<double> _semiMinorAxisLengthKm; // optional
        std::optional<double> _depthUncertaintyKm; // optional
        std::optional<double> _timeUncertainty; //optional

        Builder& scalingFactorType(ScalingFactorType scalingFactorType) {
            this->_scalingFactorType = scalingFactorType;
            this->required["scalingFactorType"] = true;
            return *this;
        };

        Builder& kWeight(double kWeight) {
            this->_kWeight = kWeight;
            this->required["kWeight"] = true;
            return *this;
        };

        Builder& confidenceLevel(double confidenceLevel) {
            this->_confidenceLevel = confidenceLevel;
            this->required["confidenceLevel"] = true;
            return *this;
        };

        Builder& semiMajorAxisLengthKm(double semiMajorAxisLengthKm) {
            this->_semiMajorAxisLengthKm = semiMajorAxisLengthKm;
            return *this;
        };

        Builder& semiMajorAxisTrendDeg(double semiMajorAxisTrendDeg) {
            this->_semiMajorAxisTrendDeg = semiMajorAxisTrendDeg;
            return *this;
        };

        Builder& semiMinorAxisLengthKm(double semiMinorAxisLengthKm) {
            this->_semiMinorAxisLengthKm = semiMinorAxisLengthKm;
            return *this;
        };

        Builder& depthUncertaintyKm(double depthUncertaintyKm) {
            this->_depthUncertaintyKm = depthUncertaintyKm;
            return *this;
        };

        Builder& timeUncertainty(double timeUncertainty) {
            this->_timeUncertainty = timeUncertainty;
            return *this;
        };

        Ellipse build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = Ellipse(*this);
            return output;
        };
    };

    ScalingFactorType scalingFactorType;
    double kWeight;
    double confidenceLevel;
    double semiMajorAxisLengthKm; //optional
    double semiMajorAxisTrendDeg; //optional
    double semiMinorAxisLengthKm; // optional
    double depthUncertaintyKm; // optional
    double timeUncertainty; //optional

private:
    explicit Ellipse(Ellipse::Builder bld)
        : scalingFactorType(bld._scalingFactorType.value()),
        kWeight(bld._kWeight.value()),
        confidenceLevel(bld._confidenceLevel.value()),
        semiMajorAxisLengthKm(bld._semiMajorAxisLengthKm.value()),
        semiMajorAxisTrendDeg(bld._semiMajorAxisTrendDeg.value()),
        semiMinorAxisLengthKm(bld._semiMinorAxisLengthKm.value()),
        timeUncertainty(bld._timeUncertainty.value()) {};
};

#endif // ELLIPSE_H