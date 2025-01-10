#ifndef BEAM_DESCRIPTION_H
#define BEAM_DESCRIPTION_H
#include <functional>
#include <map>
#include <optional>
#include <string>
#include "beamprovider/BeamSummationType.hh"
#include "beamprovider/BeamType.hh"
#include "common/RequiredPropertyException.hh"
#include "common/SamplingType.hh"


#include "filterprovider/definitions/BaseFilterDefinition.hh"

class BeamDescription
{
public:
    class Builder
    {
    public:
        std::map<std::string, bool, std::less<>> required = {
            {"beamSummation", false},
            {"beamType", false},
            {"phase", false},
            {"samplingType", false},
            {"twoDimensional", false}
        };

        std::optional<BeamSummationType> _beamSummation;
        std::optional<BeamType> _beamType;
        std::optional<SamplingType> _samplingType;
        std::optional<std::string> _phase;
        std::optional<bool> _twoDimensional;
        std::optional<BaseFilterDefinition> _preFilterDefinition;

        Builder& beamSummation(BeamSummationType const& beamSummation)
        {
            this->_beamSummation = beamSummation;
            this->required["beamSummation"] = true;
            return *this;
        };

        Builder& beamType(BeamType const& beamType)
        {
            this->_beamType = beamType;
            this->required["beamType"] = true;
            return *this;
        };

        Builder& phase(std::string const& phase)
        {
            this->_phase = phase;
            this->required["phase"] = true;
            return *this;
        };


        Builder& samplingType(SamplingType const& samplingType) {
            this->_samplingType = samplingType;
            this->required["samplingType"] = true;
            return *this;
        };

        Builder& twoDimensional(bool twoDimensional) {
            this->_twoDimensional = twoDimensional;
            this->required["twoDimensional"] = true;
            return *this;
        };

        Builder& preFilterDefinition(std::optional<BaseFilterDefinition> const& preFilterDefinition) {
            this->_preFilterDefinition = preFilterDefinition;
            return *this;
        };

        BeamDescription build() const
        {
            for (const auto& [key, value] : required) {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = BeamDescription(*this);
            return output;
        };
    };

    BeamSummationType beamSummation;
    BeamType beamType;
    std::string phase;
    SamplingType samplingType;
    bool twoDimensional;
    std::optional<BaseFilterDefinition> preFilterDefinition; // optional

private:
    explicit BeamDescription(BeamDescription::Builder bld)
        : beamSummation(bld._beamSummation.value()),
        beamType(bld._beamType.value()),
        phase(bld._phase.value()),
        samplingType(bld._samplingType.value()),
        twoDimensional(bld._twoDimensional.value()) {
        if (bld._preFilterDefinition.has_value()) {
            preFilterDefinition = bld._preFilterDefinition.value();
        }
    };
};

#endif // BEAM_DESCRIPTION_H