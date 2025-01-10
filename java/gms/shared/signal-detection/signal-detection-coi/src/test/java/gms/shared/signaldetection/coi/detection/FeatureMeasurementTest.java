package gms.shared.signaldetection.coi.detection;

import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.signaldetection.coi.types.ArrivalTimeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/** Test {@link FeatureMeasurement} factory creation */
class FeatureMeasurementTest {

  /**
   * Tests that all combinations of malformed arguments passed to {@link
   * FeatureMeasurement#from(Channel, FeatureMeasurementType, Object, Optional)} result in the
   * correct exceptions being thrown.
   *
   * <p>
   *
   * <p>Note that channelSegment is allowed to be null. This case is tested in
   * testNullChannelSegmentJsonCreator.
   */
  @ParameterizedTest
  @MethodSource("testMalformedArgumentsJsonCreatorProvider")
  <V> void testMalformedArgumentsJsonCreator(
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      FeatureMeasurementType<V> featureMeasurementType,
      V measurementValue,
      Optional<DoubleValue> snr,
      Class<Throwable> expectedExceptionClass) {

    assertThrows(
        expectedExceptionClass,
        () -> {
          FeatureMeasurement.<V>builder()
              .setChannel(channel)
              .setMeasuredChannelSegment(channelSegment)
              .setFeatureMeasurementType(featureMeasurementType)
              .setMeasurementValue(measurementValue)
              .setSnr(snr)
              .build();
        });
  }

  private static Stream<Arguments> testMalformedArgumentsJsonCreatorProvider() {
    ArrivalTimeMeasurementType featureMeasurementType = FeatureMeasurementTypes.ARRIVAL_TIME;
    InstantValue instantValue = InstantValue.from(Instant.EPOCH, Duration.ofMillis(2));

    Optional<DoubleValue> snr = Optional.of(DoubleValue.from(1.0, Optional.of(0.1), Units.DEGREES));

    return Stream.of(
        Arguments.arguments(
            null,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            featureMeasurementType,
            instantValue,
            snr,
            NullPointerException.class),
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            null,
            instantValue,
            snr,
            NullPointerException.class),
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL,
            WaveformTestFixtures.singleStationEpochStart100RandomSamples(),
            featureMeasurementType,
            null,
            snr,
            NullPointerException.class));
  }

  @ParameterizedTest
  @MethodSource("testNullChannelSegmentJsonCreatorProvider")
  <V> void testNullChannelSegmentJsonCreator(
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      FeatureMeasurementType<V> featureMeasurementType,
      V measurementValue,
      Optional<DoubleValue> snr,
      Optional<WaveformAndFilterDefinition> waveform) {

    Assertions.assertDoesNotThrow(
        () -> {
          FeatureMeasurement.<V>builder()
              .setChannel(channel)
              .setMeasuredChannelSegment(channelSegment)
              .setFeatureMeasurementType(featureMeasurementType)
              .setMeasurementValue(measurementValue)
              .setSnr(snr)
              .setAnalysisWaveform(waveform)
              .build();
        },
        "measureChannelSegement is allowed to be null");
  }

  private static Stream<Arguments> testNullChannelSegmentJsonCreatorProvider() {
    ArrivalTimeMeasurementType featureMeasurementType = FeatureMeasurementTypes.ARRIVAL_TIME;
    InstantValue instantValue = InstantValue.from(Instant.EPOCH, Duration.ofMillis(2));

    Optional<DoubleValue> snr = Optional.of(DoubleValue.from(1.0, Optional.of(0.1), Units.DEGREES));

    var waveform =
        Optional.of(
            WaveformAndFilterDefinition.builder()
                .setWaveform(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
                .build());

    return Stream.of(
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL, null, featureMeasurementType, instantValue, snr, waveform));
  }

  @ParameterizedTest
  @MethodSource("testSetDoubleSnrProvider")
  void testSetDoubleSnr(
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      FeatureMeasurementType<InstantValue> featureMeasurementType,
      InstantValue measurementValue,
      DoubleValue snr) {

    Assertions.assertDoesNotThrow(
        () -> {
          FeatureMeasurement.<InstantValue>builder()
              .setChannel(channel)
              .setMeasuredChannelSegment(channelSegment)
              .setFeatureMeasurementType(featureMeasurementType)
              .setMeasurementValue(measurementValue)
              .setSnr(snr)
              .build();
        },
        "SNR is allowed to be DoubleValue");
  }

  private static Stream<Arguments> testSetDoubleSnrProvider() {
    ArrivalTimeMeasurementType featureMeasurementType = FeatureMeasurementTypes.ARRIVAL_TIME;
    InstantValue instantValue = InstantValue.from(Instant.EPOCH, Duration.ofMillis(2));

    DoubleValue snr = DoubleValue.from(1.0, Optional.of(0.1), Units.DEGREES);

    return Stream.of(
        Arguments.arguments(
            UtilsTestFixtures.CHANNEL, null, featureMeasurementType, instantValue, snr));
  }

  @Test
  void testSerializationPhaseMeasurement() {

    DoubleValue snr = DoubleValue.from(1.0, Optional.of(0.1), Units.DEGREES);

    var pmWithSnr =
        SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT_NO_MCS.toBuilder()
            .setSnr(snr)
            .build();

    JsonTestUtilities.assertSerializes(pmWithSnr, FeatureMeasurement.class);
  }

  @Test
  void testSerializationSetAnalysisWaveform() {
    var waveform =
        WaveformAndFilterDefinition.builder()
            .setWaveform(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
            .build();

    var pmWithWaveform =
        SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT_NO_MCS.toBuilder()
            .setAnalysisWaveform(waveform)
            .build();

    JsonTestUtilities.assertSerializes(pmWithWaveform, FeatureMeasurement.class);

    var pmWithOptionalWaveform =
        SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT_NO_MCS.toBuilder()
            .setAnalysisWaveform(Optional.of(waveform))
            .build();

    JsonTestUtilities.assertSerializes(pmWithOptionalWaveform, FeatureMeasurement.class);
  }

  @Test
  void testSerializationFirstMotionMeasurement() {
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT_NO_MCS,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationNumericalMeasurement() {
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT_NO_MCS,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationAmplitudeMeasurement() {
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT_NO_MCS, FeatureMeasurement.class);

    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.ROOT_MEAN_SQUARE_FEATURE_MEASUREMENT_NO_MCS,
        FeatureMeasurement.class);
  }

  @Test
  void testSerializationInstantMeasurement() {
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.INSTANT_FEATURE_MEASUREMENT_NO_MCS, FeatureMeasurement.class);
  }

  @Test
  void testSerializationBaseMeasurementValue() {
    JsonTestUtilities.assertSerializes(SignalDetectionTestFixtures.STANDARD_VALUE, double.class);
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.ARRIVAL_TIME_MEASUREMENT, ArrivalTimeMeasurementValue.class);
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.PHASE_MEASUREMENT, PhaseTypeMeasurementValue.class);
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.FIRST_MOTION_MEASUREMENT, FirstMotionMeasurementValue.class);
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.AMPLITUDE_MEASUREMENT, AmplitudeMeasurementValue.class);
    JsonTestUtilities.assertSerializes(
        SignalDetectionTestFixtures.INSTANT_MEASUREMENT, InstantValue.class);
  }
}
