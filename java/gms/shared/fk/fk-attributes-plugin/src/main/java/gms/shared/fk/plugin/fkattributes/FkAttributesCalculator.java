package gms.shared.fk.plugin.fkattributes;

import gms.shared.fk.plugin.algorithm.DefaultFkMeasurementsAlgorithms;
import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.waveform.coi.FkSpectrum;
import java.util.Objects;
import org.apache.commons.lang3.tuple.Pair;

/**
 * FkAttributesCalculator is a lazy calculator for the FK attributes.
 *
 * <p>It resolves dependencies among measurements using lazy loading, to allow for order-agnostic
 * calls to the calculation methods. For example, azimuth uncertainty depends on slowness
 * uncertainty, so if a call to the azimuth method will first calculate the slowness uncertainty if
 * it has not already been calculated.
 */
public final class FkAttributesCalculator {

  private static final double DEFAULT_DB_DOWN_RADIUS = 0.04;

  private Double azimuth;
  private Double slowness;
  private Double azimuthUncertainty;
  private Double slownessUncertainty;
  private Double fStatistic;
  private FkSpectraInfo spectraInfo;
  private FkSpectrum spectrum;
  private Pair<Double, Double> fkMaxCoordinate;

  private FkAttributesCalculator(
      FkSpectraInfo spectraInfo, FkSpectrum spectrum, Pair<Double, Double> fkMaxCoordinate) {
    this.spectraInfo = spectraInfo;
    this.spectrum = spectrum;
    this.fkMaxCoordinate = fkMaxCoordinate;
  }

  public static FkAttributesCalculator create(
      FkSpectraInfo spectraInfo, FkSpectrum spectrum, Pair<Double, Double> fkMaxCoordinate) {
    Objects.requireNonNull(spectraInfo, "Fk Spectra Info cannot be null.");
    Objects.requireNonNull(spectrum, "Fk Spectrum cannot be null.");
    Objects.requireNonNull(fkMaxCoordinate, "Fk Max Coordinate info cannot be null.");
    return new FkAttributesCalculator(spectraInfo, spectrum, fkMaxCoordinate);
  }

  public double azimuth() {
    if (azimuth == null) {
      azimuth =
          DefaultFkMeasurementsAlgorithms.azimuthOfIndex(
              spectraInfo.getEastSlowStart(),
              spectraInfo.getEastSlowDelta(),
              spectraInfo.getNorthSlowStart(),
              spectraInfo.getNorthSlowDelta(),
              fkMaxCoordinate.getRight(),
              fkMaxCoordinate.getLeft());
    }

    return azimuth;
  }

  public double slowness() {
    if (slowness == null) {
      slowness =
          DefaultFkMeasurementsAlgorithms.slownessOfIndex(
              spectraInfo.getEastSlowStart(),
              spectraInfo.getEastSlowDelta(),
              spectraInfo.getNorthSlowStart(),
              spectraInfo.getNorthSlowDelta(),
              fkMaxCoordinate.getLeft(),
              fkMaxCoordinate.getRight());
    }

    return slowness;
  }

  public double fStatistic() {
    if (fStatistic == null) {
      // (x,y) => (column, row)
      fStatistic =
          spectrum
              .getFstat()
              .getValue(
                  fkMaxCoordinate.getRight().intValue(), fkMaxCoordinate.getLeft().intValue());
    }

    return fStatistic;
  }

  public double slownessUncertainty() {
    if (this.slownessUncertainty != null) {
      return this.slownessUncertainty;
    }

    double uncertainty =
        DefaultFkMeasurementsAlgorithms.slownessUncertainty(
            this.spectraInfo.getHighFrequency(),
            this.spectraInfo.getLowFrequency(),
            this.fStatistic(),
            DEFAULT_DB_DOWN_RADIUS);

    this.slownessUncertainty = uncertainty;

    return uncertainty;
  }

  public double azimuthUncertainty() {
    if (azimuthUncertainty == null) {
      azimuthUncertainty =
          DefaultFkMeasurementsAlgorithms.azimuthUncertainty(
              this.slowness(), this.slownessUncertainty());
    }

    return azimuthUncertainty;
  }
}
