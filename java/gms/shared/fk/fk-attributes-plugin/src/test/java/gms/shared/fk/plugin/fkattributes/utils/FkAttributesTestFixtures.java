package gms.shared.fk.plugin.fkattributes.utils;

import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.waveform.coi.FkAttributes;
import gms.shared.waveform.coi.FkSpectrum;
import org.apache.commons.lang3.tuple.ImmutablePair;

public final class FkAttributesTestFixtures {

  public static final FkSpectraInfo SPECTRA_INFO =
      FkSpectraInfo.builder()
          .setLowFrequency(0.0)
          .setHighFrequency(10.0)
          .setEastSlowStart(-0.1)
          .setEastSlowDelta(0.1)
          .setNorthSlowStart(-0.1)
          .setNorthSlowDelta(0.1)
          .build();

  public static final double[][] POWER = {
    {0, 0, 0},
    {0, 0, 0},
    {0, 1, 0}
  };

  public static final double[][] FSTAT = {
    {0, 0, 0},
    {0, 0, 0},
    {0, 19.801980198019827, 0}
  };

  public static final int QUALITY = 4;

  public static final FkSpectrum SPECTRUM = FkSpectrum.from(POWER, FSTAT, QUALITY);

  public static final ImmutablePair<Double, Double> FK_MAX_COORDINATES = ImmutablePair.of(1.0, 2.0);

  public static final double AZIMUTH = 180.0;
  public static final double SLOWNESS = 11.119492664455874;
  public static final double DEL_AZ = 1.1786995569241125;
  public static final double DEL_SLOW = 0.22874826155190894;
  public static final double F_STAT = 19.801980198019827;

  public static final FkAttributes ATTRIBUTES =
      FkAttributes.builder()
          .setAzimuth(AZIMUTH)
          .setSlowness(SLOWNESS)
          .setAzimuthUncertainty(DEL_AZ)
          .setSlownessUncertainty(DEL_SLOW)
          .setPeakFStat(F_STAT)
          .build();
}
