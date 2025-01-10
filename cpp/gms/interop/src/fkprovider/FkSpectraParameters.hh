#ifndef FK_SEPCTRA_PARAMETERS_H
#define FK_SEPCTRA_PARAMETERS_H

#include <map>
#include <stdexcept>
#include <optional>

#include "filterprovider/definitions/BaseFilterDefinition.hh"

#include "common/RequiredPropertyException.hh"
#include "common/TaperFunction.hh"
#include "FkFrequencyRange.hh"
#include "FkSpectrumWindow.hh"
#include "FkUncertaintyOption.hh"
#include "FkWaveformSampleRate.hh"
#include "SlownessGrid.hh"

class FkSpectraParameters
{
public:
    class Builder
    {

    public:
        std::map<std::string, bool, std::less<>> required = {
            {"fkFrequencyRange", false},
            {"fftTaperFunction", false},
            {"fftTaperPercent", false},
            {"fkSpectrumWindow", false},
            {"fkUncertaintyOption", false},
            {"minimumWaveformsForSpectra", false},
            {"normalizeWaveforms", false},
            {"phase", false},
            {"orientationAngleToleranceDeg", false},
            {"slownessGrid", false},
            {"spectrumStepDuration", false},
            {"twoDimensional", false},
            {"waveformSampleRate", false} };

        std::optional<FkFrequencyRange> _fkFrequencyRange;
        std::optional<TaperFunction> _fftTaperFunction;
        std::optional<double> _fftTaperPercent;
        std::optional<FkSpectrumWindow> _fkSpectrumWindow;
        std::optional<FkUncertaintyOption> _fkUncertaintyOption;
        std::optional<int> _minimumWaveformsForSpectra;
        std::optional<bool> _normalizeWaveforms;
        std::optional<std::string> _phase;
        std::optional<BaseFilterDefinition> _preFilter;
        std::optional<double> _orientationAngleToleranceDeg;
        std::optional<SlownessGrid> _slownessGrid;
        std::optional<double> _spectrumStepDuration;
        std::optional<bool> _twoDimensional;
        std::optional<FkWaveformSampleRate> _waveformSampleRate;

        Builder& fkFrequencyRange(FkFrequencyRange const& fkFrequencyRange)
        {
            this->_fkFrequencyRange = fkFrequencyRange;
            this->required["fkFrequencyRange"] = true;
            return *this;
        };

        Builder& fftTaperFunction(TaperFunction fftTaperFunction)
        {
            this->_fftTaperFunction = fftTaperFunction;
            this->required["fftTaperFunction"] = true;
            return *this;
        };

        Builder& fftTaperPercent(double fftTaperPercent)
        {
            this->_fftTaperPercent = fftTaperPercent;
            this->required["fftTaperPercent"] = true;
            return *this;
        };

        Builder& fkSpectrumWindow(FkSpectrumWindow const& fkSpectrumWindow)
        {
            this->_fkSpectrumWindow = fkSpectrumWindow;
            this->required["fkSpectrumWindow"] = true;
            return *this;
        };

        Builder& fkUncertaintyOption(FkUncertaintyOption fkUncertaintyOption)
        {
            this->_fkUncertaintyOption = fkUncertaintyOption;
            this->required["fkUncertaintyOption"] = true;
            return *this;
        };

        Builder& minimumWaveformsForSpectra(int minimumWaveformsForSpectra)
        {
            this->_minimumWaveformsForSpectra = minimumWaveformsForSpectra;
            this->required["minimumWaveformsForSpectra"] = true;
            return *this;
        };

        Builder& normalizeWaveforms(bool normalizeWaveforms)
        {
            this->_normalizeWaveforms = normalizeWaveforms;
            this->required["normalizeWaveforms"] = true;
            return *this;
        };

        Builder& phase(std::string phase)
        {
            this->_phase = phase;
            this->required["phase"] = true;
            return *this;
        };

        Builder& preFilter(BaseFilterDefinition const& preFilter)
        {
            this->_preFilter = preFilter;
            return *this;
        };

        Builder& orientationAngleToleranceDeg(double orientationAngleToleranceDeg)
        {
            this->_orientationAngleToleranceDeg = orientationAngleToleranceDeg;
            this->required["orientationAngleToleranceDeg"] = true;
            return *this;
        };

        Builder& slownessGrid(SlownessGrid const& slownessGrid)
        {
            this->_slownessGrid = slownessGrid;
            this->required["slownessGrid"] = true;
            return *this;
        };

        Builder& spectrumStepDuration(double spectrumStepDuration)
        {
            this->_spectrumStepDuration = spectrumStepDuration;
            this->required["spectrumStepDuration"] = true;
            return *this;
        };

        Builder& twoDimensional(bool twoDimensional)
        {
            this->_twoDimensional = twoDimensional;
            this->required["twoDimensional"] = true;
            return *this;
        };

        Builder& waveformSampleRate(FkWaveformSampleRate waveformSampleRate)
        {
            this->_waveformSampleRate = waveformSampleRate;
            this->required["waveformSampleRate"] = true;
            return *this;
        };

        FkSpectraParameters build() const
        {
            for (const auto& [key, value] : required)
            {
                if (value == false)
                {
                    auto errorMsg = "Required property is missing: [" + key + ", false]";
                    throw RequiredPropertyException(errorMsg);
                }
            }
            auto output = FkSpectraParameters(*this);
            return output;
        };
    };

    FkFrequencyRange fkFrequencyRange;
    TaperFunction fftTaperFunction;
    double fftTaperPercent;
    FkSpectrumWindow fkSpectrumWindow;
    FkUncertaintyOption fkUncertaintyOption;
    int minimumWaveformsForSpectra;
    bool normalizeWaveforms;
    std::string phase;
    BaseFilterDefinition preFilter;
    double orientationAngleToleranceDeg;
    SlownessGrid slownessGrid;
    double spectrumStepDuration;
    bool twoDimensional;
    FkWaveformSampleRate waveformSampleRate;

private:
    explicit FkSpectraParameters(FkSpectraParameters::Builder bld) : fkFrequencyRange(bld._fkFrequencyRange.value()),
        fftTaperFunction(bld._fftTaperFunction.value()),
        fftTaperPercent(bld._fftTaperPercent.value()),
        fkSpectrumWindow(bld._fkSpectrumWindow.value()),
        fkUncertaintyOption(bld._fkUncertaintyOption.value()),
        minimumWaveformsForSpectra(bld._minimumWaveformsForSpectra.value()),
        normalizeWaveforms(bld._normalizeWaveforms.value()),
        phase(bld._phase.value()),
        preFilter(bld._preFilter.value()),
        orientationAngleToleranceDeg(bld._orientationAngleToleranceDeg.value()),
        slownessGrid(bld._slownessGrid.value()),
        spectrumStepDuration(bld._spectrumStepDuration.value()),
        twoDimensional(bld._twoDimensional.value()),
        waveformSampleRate(bld._waveformSampleRate.value()) {};
};

#endif // FK_SEPCTRA_PARAMETERS_H