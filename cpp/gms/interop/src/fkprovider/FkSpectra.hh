#ifndef FK_SPECTRA_H
#define FK_SPECTRA_H

#include <vector>

#include "common/Timeseries.hh"
#include "FkSpectrum.hh"
#include "FkSpectraMetadata.hh"
#include <optional>

class FkSpectra : public Timeseries
{
public:
    FkSpectra(
        std::vector<FkSpectrum> const& samples,
        std::optional<FkSpectraMetadata> const& fkSpectraMetadata,
        double const& startTime,
        double const& endTime,
        double sampleRateHz,
        int sampleCount) : Timeseries(startTime, endTime, sampleRateHz, sampleCount),
        fkSpectraMetadata(fkSpectraMetadata),
        samples(samples) {};

    std::optional<FkSpectraMetadata> fkSpectraMetadata;
    std::vector<FkSpectrum> samples;
};

#endif // FK_SPECTRA_H