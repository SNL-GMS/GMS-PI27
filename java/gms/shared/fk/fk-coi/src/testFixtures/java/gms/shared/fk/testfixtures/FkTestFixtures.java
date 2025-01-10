package gms.shared.fk.testfixtures;

import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNELS;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.control.api.FkStreamingRequest;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

public final class FkTestFixtures {

  public static final double WF_SAMPLE_RATE = 40;

  public static final double FK_SAMPLE_RATE = 1.0;

  public static final double MULTIPLE_FK_LOW_FREQUENCY = 1.2;
  public static final double MULTIPLE_FK_HIGH_FREQUENCY = 1.8;

  public static final double EAST_SLOW_START = -0.3;
  public static final double EAST_SLOW_DELTA = 0.0046875;
  public static final int EAST_SLOW_COUNT = 128;

  public static final double NORTH_SLOW_START = -0.3;
  public static final double NORTH_SLOW_DELTA = 0.0046875;
  public static final int NORTH_SLOW_COUNT = 128;

  public static final Duration WINDOW_LEAD = Duration.ZERO;
  public static final Duration WINDOW_LENGTH = Duration.ofSeconds(4);
  public static final int MIN_WAVEFORMS = 2;

  public static final FkSpectraDefinition DEFINITION =
      FkSpectraDefinition.builder()
          .setUseChannelVerticalOffsets(false)
          .setNormalizeWaveforms(false)
          .setLowFrequencyHz(MULTIPLE_FK_LOW_FREQUENCY)
          .setHighFrequencyHz(MULTIPLE_FK_HIGH_FREQUENCY)
          .setWaveformSampleRateHz(WF_SAMPLE_RATE)
          .setWaveformSampleRateToleranceHz(0.01)
          .setSampleRateHz(FK_SAMPLE_RATE)
          .setSlowStartXSecPerKm(EAST_SLOW_START)
          .setSlowDeltaXSecPerKm(EAST_SLOW_DELTA)
          .setSlowCountX(EAST_SLOW_COUNT)
          .setSlowStartYSecPerKm(NORTH_SLOW_START)
          .setSlowDeltaYSecPerKm(NORTH_SLOW_DELTA)
          .setSlowCountY(NORTH_SLOW_COUNT)
          .setWindowLead(WINDOW_LEAD)
          .setWindowLength(WINDOW_LENGTH)
          .setMinimumWaveformsForSpectra(MIN_WAVEFORMS)
          .setPhaseType(PhaseType.P)
          .build();

  public static final FkStreamingRequest REQUEST =
      FkStreamingRequest.builder()
          .setChannels(Set.of(UtilsTestFixtures.CHANNEL))
          .setStartTime(Instant.EPOCH)
          .setSampleRate(FK_SAMPLE_RATE)
          .setSampleCount(10)
          .setWindowLead(WINDOW_LEAD)
          .setWindowLength(WINDOW_LENGTH)
          .setLowFrequency(MULTIPLE_FK_LOW_FREQUENCY)
          .setHighFrequency(MULTIPLE_FK_HIGH_FREQUENCY)
          .setPhaseType(PhaseType.P)
          .setSlowStartX(EAST_SLOW_START)
          .setSlowDeltaX(EAST_SLOW_DELTA)
          .setSlowCountX(EAST_SLOW_COUNT)
          .setSlowStartY(NORTH_SLOW_START)
          .setSlowDeltaY(NORTH_SLOW_DELTA)
          .setSlowCountY(NORTH_SLOW_COUNT)
          .setUseChannelVerticalOffset(false)
          .setNormalizeWaveforms(false)
          .setChannels(Set.copyOf(BASE_CHANNELS))
          .build();

  private FkTestFixtures() {
    // prevent instantiation
  }
}
