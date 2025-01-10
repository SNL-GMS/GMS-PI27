#ifndef ELLIPSOID_H
#define ELLIPSOID_H

#include <functional>
#include <string>
#include <map>
#include <stdexcept>
#include <optional>
#include "ScalingFactorType.hh"
#include "RequiredPropertyException.hh"


class Ellipsoid {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"scalingFactorType", false},
            {"kWeight", false},
            {"confidenceLevel", false},
            {"semiMajorAxisLengthKm", false},
            {"semiMajorAxisTrendDeg", false},
            {"semiMajorAxisPlungeDeg", false},
            {"semiIntermediateAxisLengthKm", false},
            {"semiIntermediateAxisTrendDeg", false},
            {"semiIntermediateAxisPlungeDeg", false},
            {"semiMinorAxisLengthKm", false},
            {"semiMinorAxisTrendDeg", false},
            {"semiMinorAxisPlungeDeg", false},
            {"timeUncertainty", false}
        };

        std::optional<ScalingFactorType> _scalingFactorType;
        std::optional<double> _kWeight;
        std::optional<double> _confidenceLevel;
        std::optional<double> _semiMajorAxisLengthKm; //optional
        std::optional<double> _semiMajorAxisTrendDeg; //optional
        std::optional<double> _semiMajorAxisPlungeDeg; //optional
        std::optional<double> _semiIntermediateAxisLengthKm; //optional
        std::optional<double> _semiIntermediateAxisTrendDeg; //optional
        std::optional<double> _semiIntermediateAxisPlungeDeg; //optional
        std::optional<double> _semiMinorAxisLengthKm; // optional
        std::optional<double> _semiMinorAxisTrendDeg; // optional
        std::optional<double> _semiMinorAxisPlungeDeg; // optional
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

        Builder& semiMajorAxisPlungeDeg(double semiMajorAxisPlungeDeg) {
            this->_semiMajorAxisPlungeDeg = semiMajorAxisPlungeDeg;
            return *this;
        };

        Builder& semiIntermediateAxisLengthKm(double semiIntermediateAxisLengthKm) {
            this->_semiIntermediateAxisLengthKm = semiIntermediateAxisLengthKm;
            return *this;
        };

        Builder& semiIntermediateAxisTrendDeg(double semiIntermediateAxisTrendDeg) {
            this->_semiIntermediateAxisTrendDeg = semiIntermediateAxisTrendDeg;
            return *this;
        };

        Builder& semiIntermediateAxisPlungeDeg(double semiIntermediateAxisPlungeDeg) {
            this->_semiIntermediateAxisPlungeDeg = semiIntermediateAxisPlungeDeg;
            return *this;
        };

        Builder& semiMinorAxisLengthKm(double semiMinorAxisLengthKm) {
            this->_semiMinorAxisLengthKm = semiMinorAxisLengthKm;
            return *this;
        };

        Builder& semiMinorAxisTrendDeg(double semiMinorAxisTrendDeg) {
            this->_semiMinorAxisTrendDeg = semiMinorAxisTrendDeg;
            return *this;
        };

        Builder& semiMinorAxisPlungeDeg(double semiMinorAxisPlungeDeg) {
            this->_semiMinorAxisPlungeDeg = semiMinorAxisPlungeDeg;
            return *this;
        };

        Builder& timeUncertainty(double timeUncertainty) {
            this->_timeUncertainty = timeUncertainty;
            return *this;
        };

        Ellipsoid build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = Ellipsoid(*this);
            return output;
        };
    };

    ScalingFactorType scalingFactorType;
    double kWeight;
    double confidenceLevel;
    double semiMajorAxisLengthKm; //optional
    double semiMajorAxisTrendDeg; //optional
    double semiMajorAxisPlungeDeg; //optional
    double semiIntermediateAxisLengthKm; //optional
    double semiIntermediateAxisTrendDeg; //optional
    double semiIntermediateAxisPlungeDeg; //optional
    double semiMinorAxisLengthKm; // optional
    double semiMinorAxisTrendDeg; // optional
    double semiMinorAxisPlungeDeg; // optional
    double timeUncertainty; //optional

private:
    explicit Ellipsoid(Ellipsoid::Builder bld)
        : scalingFactorType(bld._scalingFactorType.value()),
        kWeight(bld._kWeight.value()),
        confidenceLevel(bld._confidenceLevel.value()),
        semiMajorAxisLengthKm(bld._semiMajorAxisLengthKm.value()),
        semiMajorAxisTrendDeg(bld._semiMajorAxisTrendDeg.value()),
        semiMajorAxisPlungeDeg(bld._semiMajorAxisPlungeDeg.value()),
        semiIntermediateAxisLengthKm(bld._semiIntermediateAxisLengthKm.value()),
        semiIntermediateAxisTrendDeg(bld._semiIntermediateAxisTrendDeg.value()),
        semiIntermediateAxisPlungeDeg(bld._semiIntermediateAxisPlungeDeg.value()),
        semiMinorAxisLengthKm(bld._semiMinorAxisLengthKm.value()),
        semiMinorAxisTrendDeg(bld._semiMinorAxisTrendDeg.value()),
        semiMinorAxisPlungeDeg(bld._semiMinorAxisPlungeDeg.value()),
        timeUncertainty(bld._timeUncertainty.value()) {};
};

#endif // ELLIPSOID_H