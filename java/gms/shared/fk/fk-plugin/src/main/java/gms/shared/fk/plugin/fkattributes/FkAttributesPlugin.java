package gms.shared.fk.plugin.fkattributes;

import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.fk.pluginregistry.Plugin;
import gms.shared.waveform.coi.FkAttributes;
import gms.shared.waveform.coi.FkSpectrum;
import org.apache.commons.lang3.tuple.Pair;

public interface FkAttributesPlugin extends Plugin {

  /**
   * Generates a list of FeatureMeasurement objects given a spectra and measurement definition.
   *
   * @param spectraInfo
   * @param spectrum
   */
  FkAttributes generateFkAttributes(FkSpectraInfo spectraInfo, FkSpectrum spectrum);

  /**
   * Generates a list of FeatureMeasurement objects given a spectra and measurement definition.
   *
   * @param spectraInfo
   * @param spectrum @return Spectrum for which to calculate attributes on
   * @param customPoint Point to calculate FK Attributes with
   */
  FkAttributes generateFkAttributes(
      FkSpectraInfo spectraInfo, FkSpectrum spectrum, Pair<Double, Double> customPoint);
}
