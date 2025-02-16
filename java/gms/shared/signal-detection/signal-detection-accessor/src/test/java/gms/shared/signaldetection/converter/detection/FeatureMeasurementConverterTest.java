package gms.shared.signaldetection.converter.detection;

import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.ARRIVAL_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.LONG_PERIOD_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.PHASE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.PHASE_MEASUREMENT_SPEC_2;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.RECEIVER_AZIMUTH_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_FM_SNR;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeatureMeasurementConverterTest {

  private FeatureMeasurementConverter converter;

  @BeforeEach
  void setup() {
    converter = new FeatureMeasurementConverter();
  }

  @ParameterizedTest
  @MethodSource("getCreateMeasurementValueSpecValidationArguments")
  <V> void testCreateMeasurementValueSpecValidation(
      Class<? extends Exception> expectedException,
      FeatureMeasurementType<V> featureMeasurementType,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {

    assertThrows(
        expectedException,
        () ->
            converter.createMeasurementValueSpec(
                featureMeasurementType, arrivalDao, assocDao, Optional.empty()));
  }

  static Stream<Arguments> getCreateMeasurementValueSpecValidationArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, ARRIVAL_1, Optional.of(ASSOC_DAO_1)),
        arguments(
            NullPointerException.class,
            FeatureMeasurementTypes.ARRIVAL_TIME,
            null,
            Optional.of(ASSOC_DAO_2)),
        arguments(
            NullPointerException.class, FeatureMeasurementTypes.ARRIVAL_TIME, ARRIVAL_1, null));
  }

  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  <V> void testConvertValidation(
      Class<? extends Exception> expectedException,
      MeasurementValueSpec<V> spec,
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      DoubleValue snr,
      WaveformAndFilterDefinition analysisWaveform) {

    assertThrows(
        expectedException,
        () -> converter.convert(spec, channel, channelSegment, snr, analysisWaveform));
  }

  static Stream<Arguments> getConvertValidationArguments() {

    return Stream.of(
        arguments(
            NullPointerException.class,
            null,
            ARRIVAL_CHANNEL,
            ARRIVAL_CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            NullPointerException.class,
            ARRIVAL_MEASUREMENT_SPEC,
            null,
            ARRIVAL_CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            NullPointerException.class,
            ARRIVAL_MEASUREMENT_SPEC,
            ARRIVAL_CHANNEL,
            null,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            NullPointerException.class,
            ARRIVAL_MEASUREMENT_SPEC,
            ARRIVAL_CHANNEL,
            ARRIVAL_CHANNEL_SEGMENT,
            null,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            NullPointerException.class,
            ARRIVAL_MEASUREMENT_SPEC,
            ARRIVAL_CHANNEL,
            ARRIVAL_CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            null));
  }

  @ParameterizedTest
  @MethodSource("getCreateMeasurementValueSpecArguments")
  <V> void testCreateMeasurementValueSpec(
      Stream<MeasurementValueSpec<V>> expected,
      FeatureMeasurementType<V> featureMeasurementType,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {

    Stream<MeasurementValueSpec<V>> actual =
        converter.createMeasurementValueSpec(
            featureMeasurementType, arrivalDao, assocDao, amplitudeDao);

    assertEquals(expected.findFirst().orElseThrow(), actual.findFirst().orElseThrow());
  }

  static Stream<Arguments> getCreateMeasurementValueSpecArguments() {
    return Stream.of(
        arguments(
            Stream.of(ARRIVAL_MEASUREMENT_SPEC),
            FeatureMeasurementTypes.ARRIVAL_TIME,
            ARRIVAL_1,
            Optional.empty(),
            Optional.empty()),
        arguments(
            Stream.of(PHASE_MEASUREMENT_SPEC),
            FeatureMeasurementTypes.PHASE,
            ARRIVAL_1,
            Optional.empty(),
            Optional.empty()),
        arguments(
            Stream.of(PHASE_MEASUREMENT_SPEC_2),
            FeatureMeasurementTypes.PHASE,
            ARRIVAL_2,
            Optional.of(ASSOC_DAO_2),
            Optional.empty()),
        arguments(
            Stream.of(AMPLITUDE_MEASUREMENT_SPEC),
            FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
            ARRIVAL_1,
            Optional.empty(),
            Optional.of(AMPLITUDE_DAO)));
  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  <V> void testConvert(
      FeatureMeasurement<V> expected,
      MeasurementValueSpec<V> spec,
      Channel channel,
      ChannelSegment<Waveform> channelSegment,
      DoubleValue snr,
      WaveformAndFilterDefinition analyisWaveform) {

    Optional<FeatureMeasurement<V>> actual =
        converter.convert(spec, channel, channelSegment, snr, analyisWaveform);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());
  }

  static Stream<Arguments> getConvertArguments() {
    // Note the WaveformAndFilterDefinition are not apart of the SignalDetectionTestFixtures
    // due to it's very unhelpful ordering. Adding these directly will not be
    // easy.
    return Stream.of(
        arguments(
            ARRIVAL_TIME_FEATURE_MEASUREMENT.toBuilder()
                .setAnalysisWaveform(ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION)
                .build(),
            ARRIVAL_MEASUREMENT_SPEC,
            CHANNEL,
            CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT.toBuilder()
                .setAnalysisWaveform(
                    ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION.toBuilder()
                        .setFilterDefinitionUsage(Optional.empty())
                        .build())
                .build(),
            LONG_PERIOD_MEASUREMENT_SPEC,
            CHANNEL,
            CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT.toBuilder()
                .setAnalysisWaveform(
                    ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION.toBuilder()
                        .setFilterDefinitionUsage(Optional.empty())
                        .build())
                .build(),
            RECEIVER_AZIMUTH_MEASUREMENT_SPEC,
            CHANNEL,
            CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
        arguments(
            AMPLITUDE_FEATURE_MEASUREMENT_2.toBuilder()
                .setAnalysisWaveform(
                    AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION.toBuilder().build())
                .build(),
            AMPLITUDE_MEASUREMENT_SPEC,
            CHANNEL,
            CHANNEL_SEGMENT,
            SIGNAL_DETECTION_FM_SNR,
            AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION));
  }
}
