package gms.shared.derivedchannel.coi;

import com.google.common.collect.ImmutableList;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class BeamformingTemplateTest extends BeamErrorTest {
  private static final Duration NEGATIVE_DURATION = Duration.parse("-P2DT3H4M");

  @Test
  void testSerialization() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    JsonTestUtilities.assertSerializes(builder.build(), BeamformingTemplate.class);
  }

  @Test
  void testEmptyChannels() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setInputChannels(ImmutableList.of());

    assertErrorThrown(
        IllegalArgumentException.class, BeamformingTemplate.EMPTY_CHANNNELS, () -> builder.build());
  }

  @Test
  void testMissingBeamDuration() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.noBeamDuration();

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.EMPTY_BEAM_DURATION,
        () -> builder.build());
  }

  @Test
  void testMissingLeadDuration() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.noLeadDuration();

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.EMPTY_LEAD_DURATION,
        () -> builder.build());
  }

  @Test
  void testNegativeBeamDuration() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setBeamDuration(NEGATIVE_DURATION);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.NEGATIVE_BEAM_DURATION,
        () -> builder.build());
  }

  @Test
  void testNegativeLeadDuration() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setLeadDuration(NEGATIVE_DURATION);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.NEGATIVE_LEAD_DURATION,
        () -> builder.build());
  }

  @Test
  void testEmptyMinWaveformsToBeam() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setMinWaveformsToBeam(0);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.EMPTY_MIN_WAVEFORMS_TO_BEAM,
        () -> builder.build());
  }

  @Test
  void testNegativeSampleRateTolerance() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setSampleRateToleranceHz(-10);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.NEGATIVE_SAMPLE_RATE_TOLERANCE,
        () -> builder.build());
  }

  @Test
  void testOutOfRangeOrientationTolerance() {
    var builder = BeamTestFixtures.getDefaultBeamformingTemplateBuilder();
    builder.setOrientationAngleToleranceDeg(361);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamformingTemplate.OUT_OF_RANGE_ORIENTATION_TOLERANCE,
        () -> builder.build());
  }
}
