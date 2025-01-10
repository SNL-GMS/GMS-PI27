#ifndef FK_SPECTRA_METADATA_H
#define FK_SPECTRA_METADATA_H

#include <string>

#include "FkSpectrumWindow.hh"
#include "SlownessGrid.hh"

class FkSpectraMetadata
{
public:
  FkSpectraMetadata(FkSpectrumWindow fkSpectrumWindow,
    std::string const& phase,
    SlownessGrid slownessGrid)
    : fkSpectrumWindow(fkSpectrumWindow),
    phase(phase),
    slownessGrid(slownessGrid) {};

  FkSpectrumWindow fkSpectrumWindow;
  std::string phase;
  SlownessGrid slownessGrid;

  FkSpectraMetadata() = default;
};

#endif // FK_SPECTRA_METADATA_H