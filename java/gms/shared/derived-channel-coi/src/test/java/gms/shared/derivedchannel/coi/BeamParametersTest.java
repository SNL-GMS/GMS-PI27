package gms.shared.derivedchannel.coi;

import static gms.shared.derivedchannel.coi.BeamParameters.EMPTY_MIN_WAVEFORMS_TO_BEAM;
import static gms.shared.derivedchannel.coi.BeamParameters.NEGATIVE_SAMPLE_RATE;
import static gms.shared.derivedchannel.coi.BeamParameters.NEGATIVE_SAMPLE_RATE_TOLERANCE;
import static gms.shared.derivedchannel.coi.BeamParameters.NEGATIVE_SLOWNESS;
import static gms.shared.derivedchannel.coi.BeamParameters.ORIENTATION_ANGLE_DEGREE_RANGE;
import static gms.shared.derivedchannel.coi.BeamParameters.SOURCE_AZIMUTH_DEGREE_RANGE;

import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class BeamParametersTest extends BeamErrorTest {

  @Test
  void testSerialization() {
    var builder = BeamTestFixtures.getDefaultBeamParametersBuilder();

    JsonTestUtilities.assertSerializes(builder.build(), BeamParameters.class);
  }

  @Test
  void testEmptyMinWaveformsToBeam() {
    var builder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder.setMinWaveformsToBeam(-1);

    assertErrorThrown(
        IllegalArgumentException.class, EMPTY_MIN_WAVEFORMS_TO_BEAM, () -> builder.build());
  }

  @Test
  void testNegativeSampleRate() {
    var builder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder.setSampleRateHz(-1.0);

    assertErrorThrown(IllegalArgumentException.class, NEGATIVE_SAMPLE_RATE, () -> builder.build());
  }

  @Test
  void testNegativeSampleRateTolerance() {
    var builder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder.setSampleRateToleranceHz(-1.0);

    assertErrorThrown(
        IllegalArgumentException.class, NEGATIVE_SAMPLE_RATE_TOLERANCE, () -> builder.build());
  }

  @Test
  void testNegativeSlowness() {
    var builder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder.setSlownessSecPerDeg(-1.0);

    assertErrorThrown(IllegalArgumentException.class, NEGATIVE_SLOWNESS, () -> builder.build());
  }

  @Test
  void testAzimuthDegOutsideRange() {
    var builder_over_range = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder_over_range.setReceiverToSourceAzimuthDeg(460.0);

    assertErrorThrown(
        IllegalArgumentException.class,
        SOURCE_AZIMUTH_DEGREE_RANGE,
        () -> builder_over_range.build());

    var builder_under_range = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder_under_range.setReceiverToSourceAzimuthDeg(-0.1);

    assertErrorThrown(
        IllegalArgumentException.class,
        SOURCE_AZIMUTH_DEGREE_RANGE,
        () -> builder_under_range.build());
  }

  @Test
  void testOrientationTolDegOutsideRange() {
    var builder_over_range = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder_over_range.setOrientationAngleToleranceDeg(460.0);

    assertErrorThrown(
        IllegalArgumentException.class,
        ORIENTATION_ANGLE_DEGREE_RANGE,
        () -> builder_over_range.build());

    var builder_under_range = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder_under_range.setOrientationAngleToleranceDeg(460.0);

    assertErrorThrown(
        IllegalArgumentException.class,
        ORIENTATION_ANGLE_DEGREE_RANGE,
        () -> builder_under_range.build());
  }
}
