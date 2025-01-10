#ifndef LOCATION_RESTRAINT_H
#define LOCATION_RESTRAINT_H

#include <functional>
#include <optional>
#include <string>
#include <map>
#include <stdexcept>

#include "RestraintType.hh"
#include "DepthRestraintReason.hh"
#include "RequiredPropertyException.hh"


// TODO: epicenterRestraintType when ready
class LocationRestraint {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"depthRestraintType", false},
            {"timeRestraintType", false},
            {"positionRestraintType", false}
        };

        std::optional<RestraintType> _depthRestraintType;
        std::optional<RestraintType> _timeRestraintType;
        std::optional<RestraintType> _positionRestraintType;
        std::optional<DepthRestraintReason> _depthRestraintReason; // optional
        std::optional<double> _depthRestraintKm; // optional
        std::optional<double> _latitudeRestraintDegrees; // optional
        std::optional<double> _longitudeRestraintDegrees; // optional
        std::optional<double> _timeRestraint; // optional

        Builder& depthRestraintType(RestraintType const& depthRestraintType)
        {
            this->_depthRestraintType = depthRestraintType;
            this->required["depthRestraintType"] = true;
            return *this;
        };

        Builder& timeRestraintType(RestraintType const& timeRestraintType)
        {
            this->_timeRestraintType = timeRestraintType;
            this->required["timeRestraintType"] = true;
            return *this;
        };

        Builder& positionRestraintType(RestraintType const& positionRestraintType)
        {
            this->_positionRestraintType = positionRestraintType;
            this->required["positionRestraintType"] = true;
            return *this;
        };

        Builder& depthRestraintReason(DepthRestraintReason const& depthRestraintReason)
        {
            this->_depthRestraintReason = depthRestraintReason;
            return *this;
        };

        Builder& depthRestraintKm(double depthRestraintKm)
        {
            this->_depthRestraintKm = depthRestraintKm;
            return *this;
        };

        Builder& latitudeRestraintDegrees(double latitudeRestraintDegrees)
        {
            this->_latitudeRestraintDegrees = latitudeRestraintDegrees;
            return *this;
        };

        Builder& longitudeRestraintDegrees(double longitudeRestraintDegrees)
        {
            this->_longitudeRestraintDegrees = longitudeRestraintDegrees;
            return *this;
        };

        Builder& timeRestraint(double timeRestraint)
        {
            this->_timeRestraint = timeRestraint;
            return *this;
        };

        LocationRestraint build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = LocationRestraint(*this);
            return output;
        };
    };

    RestraintType depthRestraintType;
    RestraintType timeRestraintType;
    RestraintType positionRestraintType;
    DepthRestraintReason depthRestraintReason; // optional
    double depthRestraintKm; // optional
    double latitudeRestraintDegrees; // optional
    double longitudeRestraintDegrees; // optional
    std::optional<double> timeRestraint; // optional

private:
    explicit LocationRestraint(LocationRestraint::Builder bld)
        : depthRestraintType(bld._depthRestraintType.value()),
        timeRestraintType(bld._timeRestraintType.value()),
        positionRestraintType(bld._positionRestraintType.value()) {

        if (bld._depthRestraintReason.has_value()) {
            depthRestraintReason = bld._depthRestraintReason.value();
        }
        if (bld._depthRestraintKm.has_value()) {
            depthRestraintKm = bld._depthRestraintKm.value();
        }
        if (bld._latitudeRestraintDegrees.has_value()) {
            latitudeRestraintDegrees = bld._latitudeRestraintDegrees.value();
        }
        if (bld._longitudeRestraintDegrees.has_value()) {
            longitudeRestraintDegrees = bld._longitudeRestraintDegrees.value();
        }
        if (bld._timeRestraint.has_value()) {
            timeRestraint = bld._timeRestraint.value();
        }

    };
};

#endif // LOCATION_RESTRAINT_H