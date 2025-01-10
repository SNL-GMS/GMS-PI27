package gms.shared.fk.plugin;

import com.google.auto.service.AutoService;
import gms.shared.fk.plugin.algorithm.DefaultFkMeasurementsAlgorithms;
import gms.shared.fk.plugin.fkattributes.FkAttributesCalculator;
import gms.shared.fk.plugin.fkattributes.FkAttributesPlugin;
import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.fk.pluginregistry.Plugin;
import gms.shared.waveform.coi.FkAttributes;
import gms.shared.waveform.coi.FkSpectrum;
import java.util.Objects;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@AutoService(Plugin.class)
public class MaxPowerFkAttributesPlugin implements FkAttributesPlugin {

  private static final Logger LOGGER = LoggerFactory.getLogger(MaxPowerFkAttributesPlugin.class);

  public MaxPowerFkAttributesPlugin() {
    // no special operations needed
  }

  /**
   * Obtains this plugin's name
   *
   * @return the name of the plugin
   */
  @Override
  public String getName() {
    return "maxPowerFkAttributesPlugin";
  }

  /**
   * Calculate various FK attributes from a given FK spectrum
   *
   * @param spectraInfo A {@link FkSpectraInfo} that contains fields from {@link FkSpectrum} needed
   *     to calculate the FK Attributes
   * @param spectrum {@link FkSpectrum} to generate attributes from
   * @return Calculated {@link FkAttributes} for the spectrum at an FK Max Coordinate
   */
  public FkAttributes generateFkAttributes(FkSpectraInfo spectraInfo, FkSpectrum spectrum) {
    Objects.requireNonNull(spectraInfo, "(FkSpectrainfo) spectra information cannot be null.");
    Objects.requireNonNull(spectrum, "(FkSpectrum) spectrum values cannot be null.");

    LOGGER.debug("Validating arguments");

    // All of the calculations will need the (x,y) coordinate of the FK max
    Pair<Double, Double> fMaxCoordinate =
        DefaultFkMeasurementsAlgorithms.indexOfFkMax(spectrum.getPower().copyOf());

    LOGGER.debug("FK max at {}", fMaxCoordinate);

    var calc = FkAttributesCalculator.create(spectraInfo, spectrum, fMaxCoordinate);

    return FkAttributes.builder()
        .setAzimuth(calc.azimuth())
        .setSlowness(calc.slowness())
        .setAzimuthUncertainty(calc.azimuthUncertainty())
        .setSlownessUncertainty(calc.slownessUncertainty())
        .setPeakFStat(calc.fStatistic())
        .build();
  }

  /**
   * Calculate various FK attributes from a given FK spectrum and custom point representing a peak
   *
   * @param spectraInfo A {@link FkSpectraInfo} that contains fields from {@link FkSpectrum} needed
   *     to calculate the FK Attributes
   * @param spectrum {@link FkSpectrum} to generate attributes from
   * @param customPoint {@link Pair} of {@link Double}s representing a custom point on the FK
   *     Spectrum
   * @return Calculated {@link FkAttributes} for the spectrum at an FK Max Coordinate
   */
  public FkAttributes generateFkAttributes(
      FkSpectraInfo spectraInfo, FkSpectrum spectrum, Pair<Double, Double> customPoint) {
    LOGGER.debug("Validating arguments");
    Objects.requireNonNull(spectraInfo, "(FkSpectraInfo) spectraInfo cannot be null");
    Objects.requireNonNull(spectrum, "(FkSpectrum) spectrum cannot be null.");
    Objects.requireNonNull(customPoint, "(Pair<Double, Double>) customPoint cannot be null.");

    LOGGER.info("Generating FkAttributes for spectrum {}", spectrum);

    LOGGER.debug("Generating FK Attributes for spectrum: {}", spectrum);

    LOGGER.debug("Custom FK Max at {} read from definition.", customPoint);

    var calc = FkAttributesCalculator.create(spectraInfo, spectrum, customPoint);

    return FkAttributes.builder()
        .setAzimuth(calc.azimuth())
        .setSlowness(calc.slowness())
        .setAzimuthUncertainty(calc.azimuthUncertainty())
        .setSlownessUncertainty(calc.slownessUncertainty())
        .setPeakFStat(calc.fStatistic())
        .build();
  }
}
