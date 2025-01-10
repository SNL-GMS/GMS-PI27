#ifndef LOCATION_UNCERTAINTY_H
#define LOCATION_UNCERTAINTY_H

#include <functional>
#include <string>
#include <map>
#include <stdexcept>
#include <optional>
#include <vector>
#include "RequiredPropertyException.hh"
#include "Ellipse.hh"
#include "Ellipsoid.hh"

class LocationUncertainty {
public:
    class Builder {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"ellipses", false},
            {"ellipsoids", false},
            {"stdDevOneObservation", false},
            {"xx", false},
            {"xy", false},
            {"xz", false},
            {"xt", false},
            {"yy", false},
            {"yz", false},
            {"yt", false},
            {"zz", false},
            {"zt", false},
            {"tt", false}
        };

        std::optional<std::vector<Ellipse>> _ellipses;
        std::optional<std::vector<Ellipsoid>> _ellipsoids;
        std::optional<double> _stdDevOneObservation; // optional
        std::optional<double> _xx; // optional
        std::optional<double> _xy; // optional
        std::optional<double> _xz; // optional
        std::optional<double> _xt; // optional
        std::optional<double> _yy; // optional
        std::optional<double> _yz; // optional
        std::optional<double> _yt; // optional
        std::optional<double> _zz; // optional
        std::optional<double> _zt; // optional
        std::optional<double> _tt; // optional

        Builder& ellipses(std::vector<Ellipse> const& ellipses) {
            this->_ellipses = ellipses;
            this->required["ellipses"] = true;
            return *this;
        };

        Builder& ellipsoids(std::vector<Ellipsoid> const& ellipsoids) {
            this->_ellipsoids = ellipsoids;
            this->required["ellipsoids"] = true;
            return *this;
        };

        Builder& stdDevOneObservation(double stdDevOneObservation) {
            this->_stdDevOneObservation = stdDevOneObservation;
            return *this;
        };

        Builder& xx(double xx) {
            this->_xx = xx;
            return *this;
        };

        Builder& xy(double xy) {
            this->_xy = xy;
            return *this;
        };

        Builder& xz(double xz) {
            this->_xz = xz;
            return *this;
        };

        Builder& xt(double xt) {
            this->_xt = xt;
            return *this;
        };

        Builder& yy(double yy) {
            this->_yy = yy;
            return *this;
        };

        Builder& yz(double yz) {
            this->_yz = yz;
            return *this;
        };

        Builder& yt(double yt) {
            this->_yt = yt;
            return *this;
        };

        Builder& zz(double zz) {
            this->_zz = zz;
            return *this;
        };

        Builder& zt(double zt) {
            this->_zt = zt;
            return *this;
        };

        Builder& tt(double tt) {
            this->_tt = tt;
            return *this;
        };

        LocationUncertainty build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = LocationUncertainty(*this);
            return output;
        };
    };

    std::vector<Ellipse> ellipses;
    std::vector<Ellipsoid> ellipsoids;
    double stdDevOneObservation; // optional
    double xx; // optional
    double xy; // optional
    double xz; // optional
    double xt; // optional
    double yy; // optional
    double yz; // optional
    double yt; // optional
    double zz; // optional
    double zt; // optional
    double tt; // optional

private:
    explicit LocationUncertainty(LocationUncertainty::Builder bld)
        : ellipses(bld._ellipses.value()),
        ellipsoids(bld._ellipsoids.value()),
        xx(bld._xx.value()),
        xy(bld._xy.value()),
        xz(bld._xz.value()),
        xt(bld._xt.value()),
        yy(bld._yy.value()),
        yz(bld._yz.value()),
        yt(bld._yt.value()),
        zz(bld._zz.value()),
        zt(bld._zt.value()),
        tt(bld._tt.value()) {};
};

#endif // LOCATION_UNCERTAINTY_H