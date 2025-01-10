package gms.shared.signalenhancement.coi.fk;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.fk.FkFrequencyRange;
import gms.shared.stationdefinition.coi.fk.FkUncertaintyOption;
import gms.shared.stationdefinition.coi.fk.FkWaveformSampleRate;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.fk.SlownessGrid;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import java.time.Duration;
import java.util.Optional;

/** Holds the record for the FkSpectraParameters used in configuration */
public record FkSpectraParametersConfiguration(
    Optional<FilterDefinition> preFilter,
    SlownessGrid slownessGrid,
    TaperFunction fftTaperFunction,
    FkWindow fkSpectrumWindow,
    FkFrequencyRange fkFrequencyRange,
    FkUncertaintyOption fkUncertaintyOption,
    FkWaveformSampleRate waveformSampleRate,
    Duration spectrumStepDuration,
    double orientationAngleToleranceDeg,
    int minimumWaveformsForSpectra,
    boolean normalizeWaveforms,
    boolean twoDimensional,
    double fftTaperPercent) {

  public FkSpectraParametersConfiguration {

    Preconditions.checkNotNull(preFilter);
    Preconditions.checkNotNull(slownessGrid);
    Preconditions.checkNotNull(fftTaperFunction);
    Preconditions.checkNotNull(fkSpectrumWindow);
    Preconditions.checkNotNull(fkFrequencyRange);
    Preconditions.checkNotNull(fkUncertaintyOption);
    Preconditions.checkNotNull(waveformSampleRate);
    Preconditions.checkNotNull(spectrumStepDuration);
  }
}
