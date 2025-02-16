package gms.shared.signaldetection.testfixtures;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.CORRESPONDING_CLIP_BOOLEAN;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.CORRESPONDING_UNITS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.DEFAULT_PERIOD_DURATION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3A;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3B;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_NAME_ONE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor;
import static gms.shared.waveform.testfixture.WaveformRequestTestFixtures.channelSegmentDescriptor2;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByIdsRequest;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.types.FirstMotionType;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Defines objects used in testing */
public final class SignalDetectionTestFixtures {

  public static final DetectionsWithSegmentsByStationsAndTimeRequest REQUEST =
      DetectionsWithSegmentsByStationsAndTimeRequest.create(
          ImmutableList.of(STATION),
          Instant.EPOCH,
          Instant.EPOCH.plusSeconds(300),
          WorkflowDefinitionId.from("test"),
          ImmutableList.of());

  public static final DetectionsWithSegmentsByIdsRequest DETECTION_IDS_REQUEST =
      DetectionsWithSegmentsByIdsRequest.create(
          ImmutableList.of(UUID.randomUUID()), WorkflowDefinitionId.from("test"));

  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID1 =
      WorkflowDefinitionId.from(STAGE_1);
  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID2 =
      WorkflowDefinitionId.from(STAGE_2);
  public static final WorkflowDefinitionId WORKFLOW_DEFINITION_ID3 =
      WorkflowDefinitionId.from(STAGE_3);
  public static final ImmutableList<WorkflowDefinitionId> ORDERED_STAGES =
      ImmutableList.copyOf(
          List.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID3));
  public static final String PROPER_CHANNEL_NAME = "STA.CHAN.BHZ";
  public static final UUID ARRIVAL_UUID =
      UUID.nameUUIDFromBytes(
          STAGE_1.concat(String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_UUID_STAGE_2 =
      UUID.nameUUIDFromBytes(
          STAGE_2.concat(String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_UUID_STAGE_3 =
      UUID.nameUUIDFromBytes(
          STAGE_3.concat(String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_UUID_STAGE_3A =
      UUID.nameUUIDFromBytes(
          STAGE_3A.concat(String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_UUID_STAGE_3B =
      UUID.nameUUIDFromBytes(
          STAGE_3B.concat(String.valueOf(ARRIVAL_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_2_UUID =
      UUID.nameUUIDFromBytes(
          STAGE_1.concat(String.valueOf(ARRIVAL_2.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_3_UUID =
      UUID.nameUUIDFromBytes(
          STAGE_1.concat(String.valueOf(ARRIVAL_3.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_HYPOTHESIS_UUID =
      UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_1.getId()).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_TEST_1_SHD_UUID =
      UUID.nameUUIDFromBytes(
          STAGE_1.concat(String.valueOf(ARRIVAL_TEST_1.getId())).getBytes(StandardCharsets.UTF_8));
  public static final UUID ARRIVAL_TEST_3_SHD_UUID =
      UUID.nameUUIDFromBytes(
          STAGE_1.concat(String.valueOf(ARRIVAL_TEST_3.getId())).getBytes(StandardCharsets.UTF_8));

  public static final PhaseTypeMeasurementValue PHASE_MEASUREMENT =
      PhaseTypeMeasurementValue.fromFeaturePrediction(PhaseType.P, Optional.of(0.5));

  public static final Duration MEASURED_WAVEFORM_LEAD_DURATION = Duration.ofMillis(500);
  public static final Duration MEASURED_WAVEFORM_LAG_DURATION = Duration.ofMillis(300);

  // ------- SignalDetectionEventAssociation -------

  public static final double STANDARD_VALUE = 5.0;
  public static final Units STANDARD_UNITS = Units.SECONDS;
  public static final ArrivalTimeMeasurementValue ARRIVAL_TIME_MEASUREMENT =
      ArrivalTimeMeasurementValue.from(
          InstantValue.from(Instant.EPOCH, Duration.ofMillis(1)), Optional.empty());
  private static final NumericMeasurementValue RECEIVER_AZIMUTH_MEASUREMENT =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(180, Optional.of(0.5), Units.DEGREES));
  private static final NumericMeasurementValue SLOWNESS_MEASUREMENT =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(5, Optional.of(0.6), Units.SECONDS));
  private static final NumericMeasurementValue RTSAZIMUTH_MEASUREMENT =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(40, Optional.of(0.7), Units.DEGREES));
  private static final NumericMeasurementValue EMERGENCE_ANGLE_MEASUREMENT =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(40, Optional.of(0.7), Units.DEGREES));
  public static final FirstMotionMeasurementValue FIRST_MOTION_MEASUREMENT =
      FirstMotionMeasurementValue.fromFeaturePrediction(FirstMotionType.DILATION, Optional.of(0.5));
  public static final FirstMotionMeasurementValue LONG_PERIOD_FIRST_MOTION_MEASUREMENT =
      FirstMotionMeasurementValue.fromFeatureMeasurement(
          FirstMotionType.DILATION, Optional.empty(), Instant.EPOCH);
  public static final AmplitudeMeasurementValue AMPLITUDE_MEASUREMENT =
      AmplitudeMeasurementValue.fromFeaturePrediction(
          STANDARD_VALUE, STANDARD_UNITS, Duration.ofMillis(1));
  public static final InstantValue INSTANT_MEASUREMENT =
      InstantValue.from(Instant.EPOCH, Duration.ofMillis(1));

  // ------- Feature Measurements -------

  public static final DoubleValue SIGNAL_DETECTION_FM_SNR =
      DoubleValue.from(1.0, Optional.empty(), Units.DECIBELS);
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue>
      ARRIVAL_TIME_FEATURE_MEASUREMENT =
          FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
              .setMeasurementValue(ARRIVAL_TIME_MEASUREMENT)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();
  // Arrival FM with no measured channel segment
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue>
      ARRIVAL_TIME_FEATURE_MEASUREMENT_NO_MCS =
          ARRIVAL_TIME_FEATURE_MEASUREMENT.toBuilder()
              .setMeasuredChannelSegment(Optional.empty())
              .build();
  public static final FeatureMeasurement<PhaseTypeMeasurementValue> PHASE_FEATURE_MEASUREMENT =
      FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .setMeasurementValue(PHASE_MEASUREMENT)
          .build();
  // Phase FM with no measured channel segment
  public static final FeatureMeasurement<PhaseTypeMeasurementValue>
      PHASE_FEATURE_MEASUREMENT_NO_MCS =
          PHASE_FEATURE_MEASUREMENT.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();
  public static final FeatureMeasurement<FirstMotionMeasurementValue>
      LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT =
          FeatureMeasurement.<FirstMotionMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION)
              .setMeasurementValue(LONG_PERIOD_FIRST_MOTION_MEASUREMENT)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();
  public static final FeatureMeasurement<FirstMotionMeasurementValue>
      LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT_NO_MCS =
          LONG_PERIOD_FIRST_MOTION_FEATURE_MEASUREMENT.toBuilder()
              .setMeasuredChannelSegment(Optional.empty())
              .build();
  public static final FeatureMeasurement<NumericMeasurementValue>
      RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH)
              .setMeasurementValue(RECEIVER_AZIMUTH_MEASUREMENT)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();
  public static final FeatureMeasurement<AmplitudeMeasurementValue> AMPLITUDE_FEATURE_MEASUREMENT =
      FeatureMeasurement.<AmplitudeMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
          .setFeatureMeasurementType(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)
          .setMeasurementValue(AMPLITUDE_MEASUREMENT)
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();
  // Amplitude FM that has no measured channel segment
  public static final FeatureMeasurement<AmplitudeMeasurementValue>
      AMPLITUDE_FEATURE_MEASUREMENT_NO_MCS =
          AMPLITUDE_FEATURE_MEASUREMENT.toBuilder()
              .setMeasuredChannelSegment(Optional.empty())
              .build();
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue> INSTANT_FEATURE_MEASUREMENT =
      FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
          .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
          .setMeasurementValue(
              ArrivalTimeMeasurementValue.from(INSTANT_MEASUREMENT, Optional.empty()))
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue>
      INSTANT_FEATURE_MEASUREMENT_NO_MCS =
          INSTANT_FEATURE_MEASUREMENT.toBuilder()
              .setMeasuredChannelSegment(Optional.empty())
              .build();
  public static final FeatureMeasurement<NumericMeasurementValue> SLOW_FEATURE_MEASUREMENT =
      FeatureMeasurement.<NumericMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
          .setFeatureMeasurementType(FeatureMeasurementTypes.SLOWNESS)
          .setMeasurementValue(SLOWNESS_MEASUREMENT)
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();
  public static final FeatureMeasurement<NumericMeasurementValue> RTSAZIMUTH_FEATURE_MEASUREMENT =
      FeatureMeasurement.<NumericMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
          .setFeatureMeasurementType(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH)
          .setMeasurementValue(RTSAZIMUTH_MEASUREMENT)
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();
  public static final FeatureMeasurement<NumericMeasurementValue>
      EMERGENCE_ANGLE_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
              .setMeasurementValue(EMERGENCE_ANGLE_MEASUREMENT)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();

  public static final double AMPLITUDE_VALUE = AMPLITUDE_DAO.getAmplitude();

  public static final AmplitudeMeasurementValue AMPLITUDE_MEASUREMENT_VALUE =
      AmplitudeMeasurementValue.from(
          AMPLITUDE_VALUE,
          CORRESPONDING_UNITS,
          Optional.of(DEFAULT_PERIOD_DURATION),
          Optional.of(AMPLITUDE_DAO.getAmplitudeTime()),
          Optional.of(AMPLITUDE_DAO.getTime()),
          Optional.of(AMPLITUDE_DAO.getDuration()),
          Optional.of(CORRESPONDING_CLIP_BOOLEAN));

  public static final FeatureMeasurement<AmplitudeMeasurementValue>
      ROOT_MEAN_SQUARE_FEATURE_MEASUREMENT_NO_MCS =
          FeatureMeasurement.<AmplitudeMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(Optional.empty())
              .setFeatureMeasurementType(FeatureMeasurementTypes.ROOT_MEAN_SQUARE)
              .setMeasurementValue(AMPLITUDE_MEASUREMENT_VALUE)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();

  public static final FeatureMeasurement<AmplitudeMeasurementValue>
      AMPLITUDE_FEATURE_MEASUREMENT_2 =
          FeatureMeasurement.<AmplitudeMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)
              .setMeasurementValue(AMPLITUDE_MEASUREMENT_VALUE)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();

  // ------- Signal Detection IDs -------

  public static final UUID SIGNAL_DETECTION_ID =
      UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_1.getId()).getBytes(StandardCharsets.UTF_8));
  public static final UUID SIGNAL_DETECTION_ID_2 =
      UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_2.getId()).getBytes(StandardCharsets.UTF_8));
  public static final UUID SIGNAL_DETECTION_ID_3 =
      UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_3.getId()).getBytes(StandardCharsets.UTF_8));
  public static final String MONITORING_ORG = "Test Monitoring Org";
  public static final UUID HYPOTHESIS_ID = ARRIVAL_UUID;
  public static final UUID HYPOTHESIS_ID_2 =
      UUID.nameUUIDFromBytes(
          STAGE_1
              .concat(String.valueOf(ARRIVAL_1.getId()))
              .concat(CHANNEL_NAME_ONE)
              .getBytes(StandardCharsets.UTF_8));
  public static final UUID HYPOTHESIS_ID_3 = ARRIVAL_3_UUID;
  public static final UUID SIGNAL_DETECTION_TEST_ID_1 =
      UUID.nameUUIDFromBytes(
          String.valueOf(ARRIVAL_TEST_1.getId()).getBytes(StandardCharsets.UTF_8));
  public static final UUID SIGNAL_DETECTION_TEST_ID_3 =
      UUID.nameUUIDFromBytes(
          String.valueOf(ARRIVAL_TEST_3.getId()).getBytes(StandardCharsets.UTF_8));

  // ------- Signal Detection Hypothesis IDs -------

  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, HYPOTHESIS_ID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_2 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_UUID_STAGE_2);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_UUID_STAGE_3);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3A =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_UUID_STAGE_3A);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3B =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_UUID_STAGE_3B);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_2 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, ARRIVAL_HYPOTHESIS_UUID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_2A =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, HYPOTHESIS_ID_2);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_3 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID_3, HYPOTHESIS_ID_3);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_1 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_TEST_ID_1, ARRIVAL_TEST_1_SHD_UUID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_3 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_TEST_ID_3, ARRIVAL_TEST_3_SHD_UUID);
  public static final SignalDetectionHypothesisId SIGNAL_DETECTION_HYPOTHESIS_ID_A5 =
      SignalDetectionHypothesisId.from(SIGNAL_DETECTION_ID, HYPOTHESIS_ID);

  // ------- Signal Detection Hypotheses -------

  public static final List<FeatureMeasurement<?>> MEASUREMENT_LIST =
      List.of(ARRIVAL_TIME_FEATURE_MEASUREMENT, PHASE_FEATURE_MEASUREMENT);
  // List of FMs that have no measured channel segment
  public static final List<FeatureMeasurement<?>> MEASUREMENT_LIST_NO_MCS =
      List.of(ARRIVAL_TIME_FEATURE_MEASUREMENT_NO_MCS, PHASE_FEATURE_MEASUREMENT_NO_MCS);
  public static final List<FeatureMeasurement<?>> MEASUREMENT_LIST_A5 =
      List.of(
          ARRIVAL_TIME_FEATURE_MEASUREMENT,
          PHASE_FEATURE_MEASUREMENT,
          AMPLITUDE_FEATURE_MEASUREMENT);
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE =
      SignalDetectionHypothesis.builder().setId(SIGNAL_DETECTION_HYPOTHESIS_ID_2).build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .build())
          .build();
  // SDH with no measured channel segments in its Feature Measurements
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_NO_MCS =
      SIGNAL_DETECTION_HYPOTHESIS.toBuilder()
          .setData(
              SIGNAL_DETECTION_HYPOTHESIS.getData().get().toBuilder()
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST_NO_MCS))
                  .build())
          .build();

  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_WITH_AMPLITUDE =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(
                      Set.of(
                          ARRIVAL_TIME_FEATURE_MEASUREMENT,
                          PHASE_FEATURE_MEASUREMENT,
                          AMPLITUDE_FEATURE_MEASUREMENT))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_0 =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .setParentSignalDetectionHypothesis(
                      SignalDetectionHypothesis.createEntityReference(
                          SIGNAL_DETECTION_ID, HYPOTHESIS_ID))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_2 =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_2A)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .setParentSignalDetectionHypothesis(
                      SignalDetectionHypothesis.createEntityReference(
                          SIGNAL_DETECTION_ID, HYPOTHESIS_ID))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_2_NO_MCS =
      SIGNAL_DETECTION_HYPOTHESIS_2.toBuilder()
          .setData(
              SIGNAL_DETECTION_HYPOTHESIS_2.getData().get().toBuilder()
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST_NO_MCS))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_A5 =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_A5)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST_A5))
                  .setParentSignalDetectionHypothesis(
                      SignalDetectionHypothesis.createEntityReference(
                          SIGNAL_DETECTION_ID, HYPOTHESIS_ID))
                  .build())
          .build();
  public static final SignalDetectionHypothesis
      SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENT_ENTITY_REFERENCES =
          SignalDetectionHypothesis.builder()
              .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3)
              .setData(
                  SignalDetectionHypothesis.Data.builder()
                      .setMonitoringOrganization(MONITORING_ORG)
                      .setStation(STATION)
                      .setDeleted(false)
                      .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                      .setParentSignalDetectionHypothesis(
                          SignalDetectionHypothesis.createEntityReference(
                                  SIGNAL_DETECTION_ID, ARRIVAL_UUID_STAGE_2)
                              .toBuilder()
                              .setData(
                                  SignalDetectionHypothesis.Data.builder()
                                      .setParentSignalDetectionHypothesis(
                                          SignalDetectionHypothesis.createEntityReference(
                                              SIGNAL_DETECTION_ID, ARRIVAL_UUID))
                                      .build())
                              .build())
                      .build())
              .build();
  public static final SignalDetectionHypothesis
      SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_ENTITY_REFERENCE =
          SignalDetectionHypothesis.builder()
              .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_2)
              .setData(
                  SignalDetectionHypothesis.Data.builder()
                      .setMonitoringOrganization(MONITORING_ORG)
                      .setStation(STATION)
                      .setDeleted(false)
                      .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                      .setParentSignalDetectionHypothesis(
                          SignalDetectionHypothesis.createEntityReference(
                              SIGNAL_DETECTION_ID, ARRIVAL_UUID))
                      .build())
              .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_2)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .setParentSignalDetectionHypothesis(SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT)
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3A =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3A)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .build())
          .build();
  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3B)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .setParentSignalDetectionHypothesis(
                      SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3A)
                  .build())
          .build();
  public static final SignalDetectionHypothesis
      SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B_ENTITY =
          SignalDetectionHypothesis.builder()
              .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3B)
              .setData(
                  SignalDetectionHypothesis.Data.builder()
                      .setMonitoringOrganization(MONITORING_ORG)
                      .setStation(STATION)
                      .setDeleted(false)
                      .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                      .setParentSignalDetectionHypothesis(
                          SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3A.toEntityReference())
                      .build())
              .build();
  public static final SignalDetectionHypothesis
      SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENTS_POPULATED =
          SignalDetectionHypothesis.builder()
              .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3)
              .setData(
                  SignalDetectionHypothesis.Data.builder()
                      .setMonitoringOrganization(MONITORING_ORG)
                      .setStation(STATION)
                      .setDeleted(false)
                      .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                      .setParentSignalDetectionHypothesis(
                          SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED)
                      .build())
              .build();

  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_3 =
      SignalDetectionHypothesis.builder()
          .setId(SIGNAL_DETECTION_HYPOTHESIS_ID_3)
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setDeleted(false)
                  .setFeatureMeasurements(ImmutableSet.copyOf(MEASUREMENT_LIST))
                  .build())
          .build();

  // ------- Signal Detections -------

  public static final SignalDetection SIGNAL_DETECTION =
      SignalDetection.from(
          SIGNAL_DETECTION_ID,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS))
                  .build()));

  public static final SignalDetection SIGNAL_DETECTION_NO_HYPOTHESES =
      SignalDetection.from(
          SIGNAL_DETECTION_ID,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of())
                  .build()));

  public static final SignalDetection SIGNAL_DETECTION_MULTIPLE_HYPOTHESES =
      SignalDetection.from(
          SIGNAL_DETECTION_ID,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(
                      List.of(SIGNAL_DETECTION_HYPOTHESIS, SIGNAL_DETECTION_HYPOTHESIS_2))
                  .build()));

  public static final SignalDetection SIGNAL_DETECTION_MULTIPLE_HYPOTHESES_NO_MCS =
      SignalDetection.from(
          SIGNAL_DETECTION_ID,
          Optional.of(
              SIGNAL_DETECTION_MULTIPLE_HYPOTHESES.getData().get().toBuilder()
                  .setSignalDetectionHypotheses(
                      List.of(
                          SIGNAL_DETECTION_HYPOTHESIS_NO_MCS, SIGNAL_DETECTION_HYPOTHESIS_2_NO_MCS))
                  .build()));

  public static final SignalDetection SIGNAL_DETECTION_2 =
      SignalDetection.from(
          SIGNAL_DETECTION_ID_2,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS))
                  .build()));

  public static final SignalDetection SIGNAL_DETECTION_3 =
      SignalDetection.from(
          SIGNAL_DETECTION_ID_3,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of(SIGNAL_DETECTION_HYPOTHESIS_3))
                  .build()));

  public static final Channel ARRIVAL_CHANNEL =
      UtilsTestFixtures.CHANNEL.toBuilder().setName(PROPER_CHANNEL_NAME).build();
  public static final ChannelSegment<Waveform> ARRIVAL_CHANNEL_SEGMENT =
      ChannelSegmentTestFixtures.createChannelSegment(
          ARRIVAL_CHANNEL, List.copyOf(WaveformTestFixtures.waveforms));

  public static final Channel AMPLITUDE_CHANNEL =
      UtilsTestFixtures.CHANNEL.toBuilder().setName(PROPER_CHANNEL_NAME).build();
  public static final ChannelSegment<Waveform> AMPLITUDE_CHANNEL_SEGMENT =
      ChannelSegmentTestFixtures.createChannelSegment(
          AMPLITUDE_CHANNEL, List.copyOf(WaveformTestFixtures.waveforms));

  public static final FeatureMeasurement<ArrivalTimeMeasurementValue>
      ARRIVAL_TIME_FEATURE_MEASUREMENT_2 =
          FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
              .setChannel(ARRIVAL_CHANNEL)
              .setMeasuredChannelSegment(
                  WaveformTestFixtures.singleStationEpochStart100RandomSamples())
              .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
              .setMeasurementValue(ARRIVAL_TIME_MEASUREMENT)
              .setSnr(SIGNAL_DETECTION_FM_SNR)
              .build();

  public static final UUID detectionId =
      UUID.nameUUIDFromBytes(String.valueOf(ARRIVAL_1.getId()).getBytes(StandardCharsets.UTF_8));
  public static final UUID hypothesis1Id =
      UUID.nameUUIDFromBytes(
          PROPER_CHANNEL_NAME
              .concat(ARRIVAL_1.getArrivalKey().getTime().toString())
              .getBytes(StandardCharsets.UTF_8));
  public static final SignalDetectionHypothesisConverterId converterId =
      SignalDetectionHypothesisConverterId.from(STAGE_1, detectionId, Optional.of(HYPOTHESIS_ID));
  public static final UUID hypothesis2Id =
      UUID.nameUUIDFromBytes(
          PROPER_CHANNEL_NAME
              .concat(ARRIVAL_2.getArrivalKey().getTime().toString())
              .getBytes(StandardCharsets.UTF_8));

  public static final FeatureMeasurement MEASUREMENT_1 =
      FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
          .setChannel(ARRIVAL_CHANNEL)
          .setMeasuredChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
          .setMeasurementValue(
              ArrivalTimeMeasurementValue.from(
                  InstantValue.from(ARRIVAL_1.getArrivalKey().getTime(), Duration.ofSeconds(1)),
                  Optional.empty()))
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();

  public static final FeatureMeasurement MEASUREMENT_1_NO_MCS =
      MEASUREMENT_1.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();

  public static final FeatureMeasurement MEASUREMENT_2 =
      FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
          .setChannel(ARRIVAL_CHANNEL)
          .setMeasuredChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .setMeasurementValue(PHASE_MEASUREMENT)
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();

  public static final FeatureMeasurement MEASUREMENT_2_NO_MCS =
      MEASUREMENT_2.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_1 =
      SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis1Id))
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setDeleted(false)
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setFeatureMeasurements(Set.of(MEASUREMENT_1, MEASUREMENT_2))
                  .build())
          .build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_1_NO_MCS =
      HYPOTHESIS_FROM_ARRIVAL_1.toBuilder()
          .setData(
              HYPOTHESIS_FROM_ARRIVAL_1.getData().get().toBuilder()
                  .setFeatureMeasurements(Set.of(MEASUREMENT_1_NO_MCS, MEASUREMENT_2_NO_MCS))
                  .build())
          .build();

  public static final FeatureMeasurement MEASUREMENT_3 =
      FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
          .setChannel(ARRIVAL_CHANNEL)
          .setMeasuredChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
          .setMeasurementValue(
              ArrivalTimeMeasurementValue.from(
                  InstantValue.from(ARRIVAL_2.getArrivalKey().getTime(), Duration.ofSeconds(1)),
                  Optional.empty()))
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();

  public static final FeatureMeasurement MEASUREMENT_3_NO_MCS =
      MEASUREMENT_3.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();

  public static final FeatureMeasurement MEASUREMENT_4 =
      FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
          .setChannel(ARRIVAL_CHANNEL)
          .setMeasuredChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .setMeasurementValue(PHASE_MEASUREMENT)
          .setSnr(SIGNAL_DETECTION_FM_SNR)
          .build();

  public static final FeatureMeasurement MEASUREMENT_4_NO_MCS =
      MEASUREMENT_4.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_2 =
      SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis2Id))
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setDeleted(false)
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setParentSignalDetectionHypothesis(
                      Optional.of(
                          SignalDetectionHypothesis.createEntityReference(
                              detectionId, hypothesis1Id)))
                  .setFeatureMeasurements(Set.of(MEASUREMENT_3, MEASUREMENT_4))
                  .build())
          .build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ARRIVAL_2_NO_MCS =
      HYPOTHESIS_FROM_ARRIVAL_2.toBuilder()
          .setData(
              HYPOTHESIS_FROM_ARRIVAL_2.getData().get().toBuilder()
                  .setFeatureMeasurements(Set.of(MEASUREMENT_3_NO_MCS, MEASUREMENT_4_NO_MCS))
                  .build())
          .build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ASSOC_1 =
      SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis2Id))
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setDeleted(false)
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setParentSignalDetectionHypothesis(
                      Optional.of(
                          SignalDetectionHypothesis.createEntityReference(
                              detectionId, hypothesis1Id)))
                  .setFeatureMeasurements(Set.of(MEASUREMENT_3, MEASUREMENT_4))
                  .build())
          .build();

  public static final SignalDetectionHypothesis HYPOTHESIS_FROM_ASSOC_2 =
      SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(detectionId, hypothesis2Id))
          .setData(
              SignalDetectionHypothesis.Data.builder()
                  .setDeleted(false)
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setParentSignalDetectionHypothesis(
                      Optional.of(
                          SignalDetectionHypothesis.createEntityReference(
                              detectionId, hypothesis1Id)))
                  .setFeatureMeasurements(Set.of(MEASUREMENT_3, MEASUREMENT_4))
                  .build())
          .build();

  public static final SignalDetection DETECTION_FROM_ARRIVAL =
      SignalDetection.from(
          detectionId,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of(HYPOTHESIS_FROM_ARRIVAL_1))
                  .build()));

  public static final SignalDetection DETECTION_FROM_ARRIVAL_NO_HYPOTHESES =
      SignalDetection.from(
          detectionId,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(List.of())
                  .build()));

  public static final SignalDetection DETECTION_FROM_BOTH_ARRIVALS =
      SignalDetection.from(
          detectionId,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(
                      List.of(HYPOTHESIS_FROM_ARRIVAL_1, HYPOTHESIS_FROM_ARRIVAL_2))
                  .build()));

  public static final SignalDetection DETECTION_FROM_PREVIOUS_STAGE =
      SignalDetection.from(
          detectionId,
          Optional.of(
              SignalDetection.Data.builder()
                  .setMonitoringOrganization(MONITORING_ORG)
                  .setStation(STATION)
                  .setSignalDetectionHypotheses(
                      List.of(
                          HYPOTHESIS_FROM_ARRIVAL_1,
                          HYPOTHESIS_FROM_ASSOC_1,
                          HYPOTHESIS_FROM_ASSOC_2))
                  .build()));

  // --------------------------SignalDetections with ChannelSegment--------------------

  public static final SignalDetectionsWithChannelSegments
      SIGNAL_DETECTIONS_WITH_EMPTY_CHANNEL_SEGMENTS =
          SignalDetectionsWithChannelSegments.builder()
              .setChannelSegments(Set.of())
              .setSignalDetections(Set.of())
              .build();

  public static final SignalDetectionsWithChannelSegments SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS1 =
      SignalDetectionsWithChannelSegments.builder()
          .addSignalDetection(DETECTION_FROM_ARRIVAL)
          .addChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .build();

  public static final SignalDetectionsWithChannelSegments SIGNAL_DETECTIONS_WITH_CHANNEL_SEGMENTS2 =
      SignalDetectionsWithChannelSegments.builder()
          .addSignalDetection(DETECTION_FROM_ARRIVAL)
          .addSignalDetection(DETECTION_FROM_BOTH_ARRIVALS)
          .addChannelSegment(ARRIVAL_CHANNEL_SEGMENT)
          .build();

  public static final SignalDetectionsWithChannelSegments DETECTIONS_WITH_CHANNEL_SEGMENTS =
      SignalDetectionsWithChannelSegments.builder()
          .addSignalDetection(SIGNAL_DETECTION)
          .addChannelSegment(ARRIVAL_TIME_FEATURE_MEASUREMENT.getMeasuredChannelSegment().get())
          .addChannelSegment(PHASE_FEATURE_MEASUREMENT.getMeasuredChannelSegment().get())
          .build();

  public static final Collection<ChannelSegmentDescriptor> CHANNEL_SEGMENT_DESCRIPTORS =
      List.of(channelSegmentDescriptor, channelSegmentDescriptor2);

  private SignalDetectionTestFixtures() {}
}
