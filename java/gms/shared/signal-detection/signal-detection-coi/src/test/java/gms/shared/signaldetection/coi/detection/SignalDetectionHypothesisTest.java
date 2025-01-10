package gms.shared.signaldetection.coi.detection;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASUREMENT_LIST;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASUREMENT_LIST_NO_MCS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.collect.ImmutableSet;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Test {@link SignalDetectionHypothesis} factory creation */
class SignalDetectionHypothesisTest {

  private static final UUID id = UUID.fromString("10000000-100-0000-1000-100000000113");
  private static final UUID id2 = UUID.fromString("10000000-100-0000-1000-100000000114");
  private static final UUID id4 = UUID.fromString("10000000-100-0000-1000-100000000115");
  private static final UUID id5 = UUID.fromString("10000000-100-0000-1000-100000000116");

  private static final boolean NOT_DELETED = false;
  private static final FeatureMeasurement<ArrivalTimeMeasurementValue> arrivalMeasurement =
      ARRIVAL_TIME_FEATURE_MEASUREMENT;
  private static final FeatureMeasurement<PhaseTypeMeasurementValue> phaseMeasurement =
      PHASE_FEATURE_MEASUREMENT;
  private static final List<FeatureMeasurement<?>> featureMeasurements = MEASUREMENT_LIST;
  private static final List<FeatureMeasurement<?>> featureMeasurementsNoMcs =
      MEASUREMENT_LIST_NO_MCS;

  private static final String monitoringOrganization = "CTBTO";

  private SignalDetectionHypothesis signalDetectionHypothesis;

  @BeforeEach
  void testCreateSignalDetectionHypothesis() {
    signalDetectionHypothesis =
        SignalDetectionHypothesis.from(
            SignalDetectionHypothesisId.from(id, id5),
            Optional.of(
                SignalDetectionHypothesis.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(UtilsTestFixtures.STATION)
                    .setDeleted(false)
                    .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                    .build()));
  }

  @Test
  void testSerialization() throws Exception {
    final SignalDetectionHypothesis hyp =
        SignalDetectionHypothesis.from(
            SignalDetectionHypothesisId.from(
                id, UUID.fromString("10000000-100-0000-1000-100000000117")),
            Optional.of(
                SignalDetectionHypothesis.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(UtilsTestFixtures.STATION)
                    .setParentSignalDetectionHypothesis(
                        Optional.of(
                            SignalDetectionHypothesis.createEntityReference(
                                id, UUID.fromString("10000000-100-0000-1000-100000000118"))))
                    .setDeleted(NOT_DELETED)
                    .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurementsNoMcs))
                    .build()));
    JsonTestUtilities.assertSerializes(hyp, SignalDetectionHypothesis.class);
  }

  @Test
  void testFrom() {
    final SignalDetectionHypothesis signalDetectionHypothesis =
        SignalDetectionHypothesis.from(
            SignalDetectionHypothesisId.from(id2, id),
            Optional.of(
                SignalDetectionHypothesis.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(UtilsTestFixtures.STATION)
                    .setParentSignalDetectionHypothesis(
                        Optional.of(
                            SignalDetectionHypothesis.create(
                                SignalDetectionHypothesisId.from(
                                    id, UUID.fromString("10000000-100-0000-1000-100000000119")),
                                Optional.empty())))
                    .setDeleted(NOT_DELETED)
                    .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                    .build()));
    assertEquals(id2, signalDetectionHypothesis.getId().getSignalDetectionId());
    assertEquals(id, signalDetectionHypothesis.getId().getId());
    assertEquals(NOT_DELETED, signalDetectionHypothesis.getData().orElseThrow().isDeleted());
    assertArrayEquals(
        featureMeasurements.toArray(),
        signalDetectionHypothesis.getData().get().getFeatureMeasurements().toArray());
  }

  @Test
  void testNoArrivalTimeFeatureMeasurement() {
    List<FeatureMeasurement<?>> featureMeasurementList = List.of(phaseMeasurement);
    SignalDetectionHypothesis.Data.Builder dataBuilder =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(UtilsTestFixtures.STATION)
            .setParentSignalDetectionHypothesis(
                Optional.of(SignalDetectionHypothesis.createEntityReference(id, id4)))
            .setDeleted(NOT_DELETED)
            .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurementList));
    assertThrows(IllegalArgumentException.class, dataBuilder::build);
  }

  @Test
  void testNoPhaseFeatureMeasurement() {
    List<FeatureMeasurement<?>> featureMeasurementList = List.of(arrivalMeasurement);
    SignalDetectionHypothesis.Data.Builder dataBuilder =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(UtilsTestFixtures.STATION)
            .setParentSignalDetectionHypothesis(
                Optional.of(SignalDetectionHypothesis.createEntityReference(id, id4)))
            .setDeleted(NOT_DELETED)
            .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurementList));
    assertThrows(IllegalArgumentException.class, dataBuilder::build);
  }

  @Test
  void testGetFeatureMeasurementByType() {
    Optional<FeatureMeasurement<ArrivalTimeMeasurementValue>> arrivalTime =
        signalDetectionHypothesis
            .getData()
            .orElseThrow()
            .getFeatureMeasurement(FeatureMeasurementTypes.ARRIVAL_TIME);
    assertNotNull(arrivalTime);
    assertTrue(arrivalTime.isPresent());
    assertEquals(arrivalMeasurement, arrivalTime.get());
    // get phase measurement
    Optional<FeatureMeasurement<PhaseTypeMeasurementValue>> phase =
        signalDetectionHypothesis
            .getData()
            .orElseThrow()
            .getFeatureMeasurement(FeatureMeasurementTypes.PHASE);
    assertNotNull(phase);
    assertTrue(phase.isPresent());
    assertEquals(phaseMeasurement, phase.get());
    // get non-existent measurement
    Optional<FeatureMeasurement<NumericMeasurementValue>> emergenceAngle =
        signalDetectionHypothesis
            .getData()
            .orElseThrow()
            .getFeatureMeasurement(FeatureMeasurementTypes.EMERGENCE_ANGLE);
    assertEquals(Optional.empty(), emergenceAngle);
  }

  @Test
  void testWithMeasurementsWrongChannelBuild() {

    FeatureMeasurement<PhaseTypeMeasurementValue> phaseMeasurement =
        FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
            .setChannel(UtilsTestFixtures.CHANNEL_TWO_FACET)
            .setMeasuredChannelSegment(
                WaveformTestFixtures.singleStationEpochStart100RandomSamples())
            .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
            .setMeasurementValue(
                PhaseTypeMeasurementValue.fromFeaturePrediction(PhaseType.P, Optional.of(1.0)))
            .setSnr(Optional.of(DoubleValue.from(1.0, Optional.empty(), Units.DECIBELS)))
            .build();

    List<FeatureMeasurement<?>> measurements = List.of(arrivalMeasurement, phaseMeasurement);

    SignalDetectionHypothesis.Data.Builder data =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(UtilsTestFixtures.STATION)
            .setDeleted(NOT_DELETED)
            .setFeatureMeasurements(ImmutableSet.copyOf(measurements));

    assertThrows(IllegalStateException.class, data::build);
  }

  @Test
  void testCreateFacetedSignalDetectionHypothesis() {
    assertDoesNotThrow(() -> SignalDetectionHypothesis.createEntityReference(id, id2));

    SignalDetectionHypothesis signalDetectionHypothesis =
        SignalDetectionHypothesis.createEntityReference(id, id2);
    assertEquals(Optional.empty(), signalDetectionHypothesis.getData());
    assertEquals(id, signalDetectionHypothesis.getId().getSignalDetectionId());
    assertEquals(id2, signalDetectionHypothesis.getId().getId());
  }

  @Test
  void testToFacetedSignalDetection() {
    assertDoesNotThrow(SIGNAL_DETECTION_HYPOTHESIS::toEntityReference);

    SignalDetectionHypothesis signalDetectionHypothesis =
        SIGNAL_DETECTION_HYPOTHESIS.toEntityReference();
    assertEquals(Optional.empty(), signalDetectionHypothesis.getData());
    assertEquals(
        SIGNAL_DETECTION_HYPOTHESIS.getId().getSignalDetectionId(),
        signalDetectionHypothesis.getId().getSignalDetectionId());
    assertEquals(
        SIGNAL_DETECTION_HYPOTHESIS.getId().getId(), signalDetectionHypothesis.getId().getId());
  }
}
