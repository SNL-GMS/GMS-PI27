package gms.shared.signaldetection.coi.detection;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_MULTIPLE_HYPOTHESES;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_MULTIPLE_HYPOTHESES_NO_MCS;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.collect.ImmutableSet;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Test {@link gms.shared.frameworks.osd.coi.signaldetection.SignalDetection} factory creation */
class SignalDetectionTest {

  private final UUID id = UUID.fromString("10000000-100-0000-1000-100000000120");
  private final UUID id2 = UUID.fromString("10000000-100-0000-1000-100000000121");
  private final SignalDetectionHypothesisId signalDetectionHypothesisId =
      SignalDetectionHypothesisId.from(id, id2);
  private final String monitoringOrganization = "CTBTO";

  private final List<FeatureMeasurement<?>> featureMeasurements =
      List.of(
          SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT,
          SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT);

  private final List<SignalDetectionHypothesis> SIGNAL_DETECTION_HYPOTHESIS_LIST =
      List.of(SIGNAL_DETECTION_HYPOTHESIS);

  @Test
  void testSerialization() throws Exception {
    final SignalDetection signalDetection = SIGNAL_DETECTION_MULTIPLE_HYPOTHESES_NO_MCS;
    JsonTestUtilities.assertSerializes(signalDetection, SignalDetection.class);
  }

  @Test
  void testSerializationFaceted() throws Exception {
    SignalDetection detection =
        SIGNAL_DETECTION_MULTIPLE_HYPOTHESES.toBuilder().setData(Optional.empty()).build();
    JsonTestUtilities.assertSerializes(detection, SignalDetection.class);
  }

  @Test
  void testFrom() {
    SignalDetection.Data data =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(STATION)
            .setSignalDetectionHypotheses(
                List.of(
                    SignalDetectionHypothesis.create(
                        signalDetectionHypothesisId,
                        Optional.of(
                            SignalDetectionHypothesis.Data.builder()
                                .setMonitoringOrganization(monitoringOrganization)
                                .setStation(STATION)
                                .setDeleted(false)
                                .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                                .build()))))
            .build();
    SignalDetection signalDetection = SignalDetection.from(id, Optional.of(data));

    assertEquals(id, signalDetection.getId());
    assertEquals(monitoringOrganization, signalDetection.getMonitoringOrganization());
    assertEquals(STATION, signalDetection.getStation());
    assertEquals(1, signalDetection.getSignalDetectionHypotheses().size());
  }

  @Test
  void testRejectNullId() {
    SignalDetection signalDetection = SIGNAL_DETECTION_MULTIPLE_HYPOTHESES;

    assertThrows(
        NullPointerException.class,
        () -> {
          signalDetection.delete(null);
        });
  }

  @Test
  void testRejectInvalidId() {
    SignalDetection signalDetection = SIGNAL_DETECTION_MULTIPLE_HYPOTHESES;
    assertThrows(
        IllegalArgumentException.class,
        () -> {
          signalDetection.delete(id2);
        });
  }

  @Test
  void testReject() {
    SignalDetection signalDetection = SIGNAL_DETECTION_MULTIPLE_HYPOTHESES;
    SignalDetectionHypothesis signalDetectionHypothesis =
        signalDetection.getSignalDetectionHypotheses().get(0);

    SignalDetection signalDetectionNew =
        signalDetection.delete(signalDetectionHypothesis.getId().getId());
    var signalDetectionHypothesisCollectionSize =
        signalDetectionNew.getSignalDetectionHypotheses().size();

    assertEquals(3, signalDetectionHypothesisCollectionSize);
    assertTrue(
        signalDetectionNew
            .getSignalDetectionHypotheses()
            .get(signalDetectionHypothesisCollectionSize - 1)
            .getData()
            .orElseThrow()
            .isDeleted());
  }

  @Test
  void testOnlyContainsDeleted() {
    SignalDetectionHypothesis signalDetectionHypothesis =
        SignalDetectionHypothesis.from(
            SignalDetectionHypothesisId.from(id, id),
            Optional.ofNullable(
                SignalDetectionHypothesis.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(STATION)
                    .setParentSignalDetectionHypothesis(
                        Optional.of(SignalDetectionHypothesis.createEntityReference(id, id2)))
                    .setDeleted(true)
                    .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                    .build()));
    List<SignalDetectionHypothesis> signalDetectionHypothesisList =
        List.of(signalDetectionHypothesis);
    SignalDetection.Data.Builder dataBuilder =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(STATION)
            .setSignalDetectionHypotheses(signalDetectionHypothesisList);
    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, dataBuilder::build);
    assertTrue(
        ex.getMessage()
            .contains(
                "Cannot create a SignalDetection containing only deleted"
                    + " SignalDetectionHypotheses"));
  }

  @Test
  void testEqualsHashCode() {

    final SignalDetection sd1 =
        SignalDetection.from(
            SIGNAL_DETECTION_ID,
            Optional.of(
                SignalDetection.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(STATION)
                    .setSignalDetectionHypotheses(SIGNAL_DETECTION_HYPOTHESIS_LIST)
                    .build()));

    SignalDetection.Data data2 =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(sd1.getMonitoringOrganization())
            .setStation(sd1.getStation())
            .setSignalDetectionHypotheses(sd1.getSignalDetectionHypotheses())
            .build();

    final SignalDetection sd2 = SignalDetection.from(sd1.getId(), Optional.of(sd1.getData().get()));

    assertEquals(sd1, sd2);
    assertEquals(sd1.hashCode(), sd2.hashCode());
  }

  @Test
  void testEqualsExpectInequality() {
    SignalDetectionHypothesis signalDetectionHypothesis =
        SignalDetectionHypothesis.from(
            SignalDetectionHypothesisId.from(id, id2),
            Optional.ofNullable(
                SignalDetectionHypothesis.Data.builder()
                    .setMonitoringOrganization(monitoringOrganization)
                    .setStation(STATION)
                    .setDeleted(false)
                    .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                    .build()));
    SignalDetection.Data data =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(STATION)
            .setSignalDetectionHypotheses(List.of(signalDetectionHypothesis))
            .build();
    final SignalDetection sd1 = SignalDetection.from(id, Optional.of(data));
    SignalDetection sd2 =
        SignalDetection.from(
            id2,
            Optional.of(
                data.toBuilder()
                    .setSignalDetectionHypotheses(
                        List.of(
                            signalDetectionHypothesis.toBuilder()
                                .setId(
                                    SignalDetectionHypothesisId.from(
                                        id2,
                                        sd1.getSignalDetectionHypotheses().get(0).getId().getId()))
                                .build()))
                    .build()));

    // Different id
    assertNotEquals(sd1, sd2);

    // Different monitoring org
    sd2 =
        SignalDetection.from(
            sd1.getId(),
            Optional.of(
                SignalDetection.Data.builder()
                    .setMonitoringOrganization("diffMonitoringOrg")
                    .setStation(sd1.getStation())
                    .setSignalDetectionHypotheses(sd1.getSignalDetectionHypotheses())
                    .build()));
    assertNotEquals(sd1, sd2);

    // Different station id
    sd2 =
        SignalDetection.from(
            sd1.getId(),
            Optional.of(
                SignalDetection.Data.builder()
                    .setMonitoringOrganization(sd1.getMonitoringOrganization())
                    .setStation(UtilsTestFixtures.STATION_2)
                    .setSignalDetectionHypotheses(sd1.getSignalDetectionHypotheses())
                    .build()));
    assertNotEquals(sd1, sd2);

    // Different signal hypotheses
    sd2 =
        SignalDetection.from(
            sd1.getId(),
            Optional.of(
                SignalDetection.Data.builder()
                    .setMonitoringOrganization(sd1.getMonitoringOrganization())
                    .setStation(sd1.getStation())
                    .setSignalDetectionHypotheses(Collections.emptyList())
                    .build()));
    assertNotEquals(sd1, sd2);
  }

  @Test
  void testFromMultipleNoParentHypotheses() {
    List<SignalDetectionHypothesis> hypotheses =
        List.of(
            SignalDetectionHypothesis.from(
                SignalDetectionHypothesisId.from(
                    id, UUID.fromString("10000000-100-0000-1000-100000000122")),
                Optional.ofNullable(
                    SignalDetectionHypothesis.Data.builder()
                        .setMonitoringOrganization(monitoringOrganization)
                        .setStation(STATION)
                        .setDeleted(false)
                        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                        .build())),
            SignalDetectionHypothesis.from(
                SignalDetectionHypothesisId.from(
                    id, UUID.fromString("10000000-100-0000-1000-100000000123")),
                Optional.ofNullable(
                    SignalDetectionHypothesis.Data.builder()
                        .setMonitoringOrganization(monitoringOrganization)
                        .setStation(STATION)
                        .setDeleted(false)
                        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                        .build())));

    SignalDetection.Data.Builder data =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(STATION)
            .setSignalDetectionHypotheses(hypotheses);
    assertThrows(IllegalStateException.class, data::build);
  }

  @Test
  void testFromParentAfterChild() {
    UUID firstId = UUID.fromString("10000000-100-0000-1000-100000000124");
    UUID secondId = UUID.fromString("10000000-100-0000-1000-100000000124");
    UUID thirdId = UUID.fromString("10000000-100-0000-1000-100000000126");
    List<SignalDetectionHypothesis> hypotheses =
        List.of(
            SignalDetectionHypothesis.from(
                SignalDetectionHypothesisId.from(id, firstId),
                Optional.ofNullable(
                    SignalDetectionHypothesis.Data.builder()
                        .setMonitoringOrganization(monitoringOrganization)
                        .setStation(STATION)
                        .setDeleted(false)
                        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                        .build())),
            SignalDetectionHypothesis.from(
                SignalDetectionHypothesisId.from(id, secondId),
                Optional.ofNullable(
                    SignalDetectionHypothesis.Data.builder()
                        .setMonitoringOrganization(monitoringOrganization)
                        .setStation(STATION)
                        .setParentSignalDetectionHypothesis(
                            Optional.of(
                                SignalDetectionHypothesis.createEntityReference(id, thirdId)))
                        .setDeleted(false)
                        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                        .build())),
            SignalDetectionHypothesis.from(
                SignalDetectionHypothesisId.from(id, thirdId),
                Optional.ofNullable(
                    SignalDetectionHypothesis.Data.builder()
                        .setMonitoringOrganization(monitoringOrganization)
                        .setStation(STATION)
                        .setParentSignalDetectionHypothesis(
                            Optional.of(
                                SignalDetectionHypothesis.createEntityReference(id, firstId)))
                        .setDeleted(false)
                        .setFeatureMeasurements(ImmutableSet.copyOf(featureMeasurements))
                        .build())));

    SignalDetection.Data.Builder dataBuilder =
        SignalDetection.Data.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setStation(STATION)
            .setSignalDetectionHypotheses(hypotheses);
    assertThrows(IllegalStateException.class, dataBuilder::build);
  }

  @Test
  void testCreateFacetedSignalDetection() {
    assertDoesNotThrow(() -> SignalDetection.createEntityReference(id));

    SignalDetection signalDetection = SignalDetection.createEntityReference(id);
    assertEquals(Optional.empty(), signalDetection.getData());
    assertEquals(id, signalDetection.getId());
  }

  @Test
  void testToFacetedSignalDetection() {
    assertDoesNotThrow(SIGNAL_DETECTION_MULTIPLE_HYPOTHESES::toEntityReference);

    SignalDetection signalDetection = SIGNAL_DETECTION_MULTIPLE_HYPOTHESES.toEntityReference();
    assertEquals(Optional.empty(), signalDetection.getData());
    assertEquals(SIGNAL_DETECTION_MULTIPLE_HYPOTHESES.getId(), signalDetection.getId());
  }
}
