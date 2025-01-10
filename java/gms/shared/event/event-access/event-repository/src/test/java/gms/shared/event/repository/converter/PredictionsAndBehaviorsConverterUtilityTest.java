package gms.shared.event.repository.converter;

import static gms.shared.event.coi.EventTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.EMERGENCE_ANGLE_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.PHASE_TYPE_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.SLOWNESS_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT;
import static gms.shared.event.coi.EventTestFixtures.SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.repository.BridgeTestFixtures;
import gms.shared.event.repository.BridgedSdhInformation;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import gms.shared.stationdefinition.coi.utils.Units;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class PredictionsAndBehaviorsConverterUtilityTest {

  @Test
  void testFromLegacyToPredictionsAndBehaviors() {
    var assocDao =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withEmergenceAngleResidual(0.2)
            .withTimeDefining(DefiningFlag.DEFAULT_DEFINING)
            .withEmergenceAngleResidual(0.2)
            .withAzimuthDefining(DefiningFlag.DEFAULT_DEFINING)
            .withSlownessDefining(DefiningFlag.DEFAULT_DEFINING)
            .build();

    var arInfoDao =
        ArInfoDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_AR_INFO_DAO)
            .withBaseModelTravelTime(1.1)
            .withTravelTimeStaticCorrection(1.1)
            .withTravelTimeEllipticityCorrection(1.1)
            .withTravelTimeElevationCorrection(1.1)
            .withTravelTimeSourceSpecificCorrection(1.1)
            .withTotalTravelTime(203.232)
            .withTravelTimeModelError(1.232)
            .build();

    // create the SDH
    var signalDetectionHypothesisData =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization("TEST")
            .setDeleted(false)
            .setStation(STATION)
            .setFeatureMeasurements(
                Set.of(
                    ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    EMERGENCE_ANGLE_FEATURE_MEASUREMENT,
                    PHASE_TYPE_FEATURE_MEASUREMENT,
                    RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
                    SLOWNESS_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT))
            .build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.create(
            SignalDetectionHypothesisId.from(
                UUID.fromString("88e26793-1606-4b4d-8d7b-fd06a9b0d9ee"),
                UUID.fromString("c68ea2ee-9d3d-4f20-ac1c-a1dc7f12f963")),
            Optional.of(signalDetectionHypothesisData));

    var eventLocation = EventTestFixtures.EVENT_LOCATION;
    var sdhInfo =
        BridgedSdhInformation.builder()
            .setAssocDao(assocDao)
            .setSignalDetectionHypothesis(signalDetectionHypothesis)
            .setStaMagDaos(Collections.emptyList())
            .build();

    sdhInfo = sdhInfo.toBuilder().setArInfoDao(arInfoDao).build();

    var results =
        PredictionsAndBehaviorsConverterUtility.fromLegacyToPredictionsAndBehaviors(
            sdhInfo, eventLocation);

    assertEquals(4, results.getLocationBehaviors().size());

    var featurePredictions = results.getFeaturePredictions();

    var arrivalSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE));
    assertEquals(1, arrivalSet.size());
    var arrivalTimePF = arrivalSet.iterator().next();
    assertEquals(
        203,
        arrivalTimePF
            .getPredictionValue()
            .getPredictedValue()
            .getArrivalTime()
            .getValue()
            .getEpochSecond());
    assertEquals(5, arrivalTimePF.getPredictionValue().getFeaturePredictionComponentSet().size());

    var emergenceAngleSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.EMERGENCE_ANGLE_PREDICTION_TYPE));
    assertEquals(1, emergenceAngleSet.size());
    var emergenceAngleFP = emergenceAngleSet.iterator().next();
    assertEquals(
        0.8,
        emergenceAngleFP.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    assertEquals(
        Units.DEGREES,
        emergenceAngleFP.getPredictionValue().getPredictedValue().getMeasuredValue().getUnits());
    assertEquals(
        1, emergenceAngleFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var receiverToSourceAzimuthSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE));
    assertEquals(1, receiverToSourceAzimuthSet.size());
    var receiverToSourceAzimuthFP = receiverToSourceAzimuthSet.iterator().next();
    assertEquals(
        1.0,
        receiverToSourceAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        receiverToSourceAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        2,
        receiverToSourceAzimuthFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var slownessSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SLOWNESS_PREDICTION_TYPE));
    assertEquals(1, slownessSet.size());
    var slownessFP = slownessSet.iterator().next();
    assertEquals(
        0.0, slownessFP.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    assertEquals(
        Units.SECONDS_PER_DEGREE,
        slownessFP.getPredictionValue().getPredictedValue().getMeasuredValue().getUnits());
    assertEquals(2, slownessFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var sourceToReceiverAzimuthSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE));
    assertEquals(1, sourceToReceiverAzimuthSet.size());
    var sourceToReceiverAzimuthFP = sourceToReceiverAzimuthSet.iterator().next();
    assertEquals(
        1.0,
        sourceToReceiverAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        sourceToReceiverAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        1,
        sourceToReceiverAzimuthFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var sourceToReceiverDistanceSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SOURCE_TO_RECEIVER_DISTANCE_PREDICTION_TYPE));
    assertEquals(1, sourceToReceiverDistanceSet.size());
    var sourceToReceiverDistanceFP = sourceToReceiverDistanceSet.iterator().next();
    assertEquals(
        1.0,
        sourceToReceiverDistanceFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        sourceToReceiverDistanceFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        1,
        sourceToReceiverDistanceFP.getPredictionValue().getFeaturePredictionComponentSet().size());
  }

  @Test
  void testFromLegacyToPredictionsAndBehaviorsInvalidDefiningFlag() {
    var assocDao =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withEmergenceAngleResidual(0.2)
            .withTimeDefining(null)
            .withEmergenceAngleResidual(0.2)
            .withAzimuthDefining(null)
            .withSlownessDefining(null)
            .build();

    var arInfoDao =
        ArInfoDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_AR_INFO_DAO)
            .withBaseModelTravelTime(1.1)
            .withTravelTimeStaticCorrection(1.1)
            .withTravelTimeEllipticityCorrection(1.1)
            .withTravelTimeElevationCorrection(1.1)
            .withTravelTimeSourceSpecificCorrection(1.1)
            .withTotalTravelTime(203.232)
            .withTravelTimeModelError(1.232)
            .build();

    // create the SDH
    var signalDetectionHypothesisData =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization("TEST")
            .setDeleted(false)
            .setStation(STATION)
            .setFeatureMeasurements(
                Set.of(
                    ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    EMERGENCE_ANGLE_FEATURE_MEASUREMENT,
                    PHASE_TYPE_FEATURE_MEASUREMENT,
                    RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
                    SLOWNESS_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT))
            .build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.create(
            SignalDetectionHypothesisId.from(
                UUID.fromString("5063ca7f-3ef0-4101-a4f2-f9ad05413819"),
                UUID.fromString("39a319e6-2f39-4c5b-b45d-c9845482caf8")),
            Optional.of(signalDetectionHypothesisData));

    var eventLocation = EventTestFixtures.EVENT_LOCATION;
    var sdhInfo =
        BridgedSdhInformation.builder()
            .setAssocDao(assocDao)
            .setSignalDetectionHypothesis(signalDetectionHypothesis)
            .setStaMagDaos(Collections.emptyList())
            .build();

    sdhInfo = sdhInfo.toBuilder().setArInfoDao(arInfoDao).build();

    var results =
        PredictionsAndBehaviorsConverterUtility.fromLegacyToPredictionsAndBehaviors(
            sdhInfo, eventLocation);

    assertEquals(4, results.getLocationBehaviors().size());

    var featurePredictions = results.getFeaturePredictions();

    var arrivalSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE));
    assertEquals(1, arrivalSet.size());
    var arrivalTimePF = arrivalSet.iterator().next();
    assertEquals(
        203,
        arrivalTimePF
            .getPredictionValue()
            .getPredictedValue()
            .getArrivalTime()
            .getValue()
            .getEpochSecond());
    assertEquals(5, arrivalTimePF.getPredictionValue().getFeaturePredictionComponentSet().size());

    var emergenceAngleSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.EMERGENCE_ANGLE_PREDICTION_TYPE));
    assertEquals(1, emergenceAngleSet.size());
    var emergenceAngleFP = emergenceAngleSet.iterator().next();
    assertEquals(
        0.8,
        emergenceAngleFP.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    assertEquals(
        Units.DEGREES,
        emergenceAngleFP.getPredictionValue().getPredictedValue().getMeasuredValue().getUnits());
    assertEquals(
        1, emergenceAngleFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var receiverToSourceAzimuthSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE));
    assertEquals(1, receiverToSourceAzimuthSet.size());
    var receiverToSourceAzimuthFP = receiverToSourceAzimuthSet.iterator().next();
    assertEquals(
        1.0,
        receiverToSourceAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        receiverToSourceAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        2,
        receiverToSourceAzimuthFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var slownessSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SLOWNESS_PREDICTION_TYPE));
    assertEquals(1, slownessSet.size());
    var slownessFP = slownessSet.iterator().next();
    assertEquals(
        0.0, slownessFP.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    assertEquals(
        Units.SECONDS_PER_DEGREE,
        slownessFP.getPredictionValue().getPredictedValue().getMeasuredValue().getUnits());
    assertEquals(2, slownessFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var sourceToReceiverAzimuthSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SOURCE_TO_RECEIVER_AZIMUTH_PREDICTION_TYPE));
    assertEquals(1, sourceToReceiverAzimuthSet.size());
    var sourceToReceiverAzimuthFP = sourceToReceiverAzimuthSet.iterator().next();
    assertEquals(
        1.0,
        sourceToReceiverAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        sourceToReceiverAzimuthFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        1,
        sourceToReceiverAzimuthFP.getPredictionValue().getFeaturePredictionComponentSet().size());

    var sourceToReceiverDistanceSet =
        new HashSet<>(
            featurePredictions.getFeaturePredictionsForType(
                FeaturePredictionType.SOURCE_TO_RECEIVER_DISTANCE_PREDICTION_TYPE));
    assertEquals(1, sourceToReceiverDistanceSet.size());
    var sourceToReceiverDistanceFP = sourceToReceiverDistanceSet.iterator().next();
    assertEquals(
        1.0,
        sourceToReceiverDistanceFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getValue());
    assertEquals(
        Units.DEGREES,
        sourceToReceiverDistanceFP
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getUnits());
    assertEquals(
        1,
        sourceToReceiverDistanceFP.getPredictionValue().getFeaturePredictionComponentSet().size());
  }

  @Test
  void testFromLegacyToPredictionsNoArInfo() {

    var assocDao =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withEmergenceAngleResidual(0.2)
            .withTimeDefining(DefiningFlag.DEFAULT_DEFINING)
            .withEmergenceAngleResidual(0.2)
            .withAzimuthDefining(DefiningFlag.DEFAULT_DEFINING)
            .withSlownessDefining(DefiningFlag.DEFAULT_DEFINING)
            .build();

    var arInfoDao =
        ArInfoDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_AR_INFO_DAO)
            .withBaseModelTravelTime(1.1)
            .withTravelTimeStaticCorrection(1.1)
            .withTravelTimeEllipticityCorrection(1.1)
            .withTravelTimeElevationCorrection(1.1)
            .withTravelTimeSourceSpecificCorrection(1.1)
            .withTotalTravelTime(203.232)
            .withTravelTimeModelError(1.232)
            .build();

    // create the SDH
    var signalDetectionHypothesisData =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization("TEST")
            .setDeleted(false)
            .setStation(STATION)
            .setFeatureMeasurements(
                Set.of(
                    ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    EMERGENCE_ANGLE_FEATURE_MEASUREMENT,
                    PHASE_TYPE_FEATURE_MEASUREMENT,
                    RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
                    SLOWNESS_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT))
            .build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.create(
            SignalDetectionHypothesisId.from(
                UUID.fromString("9b115a9b-a61c-44c5-afac-cd601d4c7130"),
                UUID.fromString("24115ccd-7c34-412e-891e-aee31ebf89ed")),
            Optional.of(signalDetectionHypothesisData));

    var eventLocation = EventTestFixtures.EVENT_LOCATION;
    var sdhInfo =
        BridgedSdhInformation.builder()
            .setAssocDao(assocDao)
            .setSignalDetectionHypothesis(signalDetectionHypothesis)
            .setStaMagDaos(Collections.emptyList())
            .build();

    // test that empty arInfo records produce results
    var resultNoArInfo =
        PredictionsAndBehaviorsConverterUtility.fromLegacyToPredictionsAndBehaviors(
            sdhInfo, eventLocation);
    assertEquals(4, resultNoArInfo.getLocationBehaviors().size());

    var residuals =
        resultNoArInfo.getLocationBehaviors().stream()
            .map(LocationBehavior::getResidual)
            .flatMap(Optional::stream)
            .toList();
    var weights =
        resultNoArInfo.getLocationBehaviors().stream()
            .map(LocationBehavior::getWeight)
            .flatMap(Optional::stream)
            .toList();
    var featurePredictions =
        resultNoArInfo.getLocationBehaviors().stream()
            .map(LocationBehavior::getPrediction)
            .flatMap(Optional::stream)
            .toList();

    assertEquals(1, residuals.size());
    assertEquals(0, weights.size());
    assertEquals(1, featurePredictions.size());
  }

  @Test
  void testFromLegacyToPredictionsAndBehaviorsNAValues() {
    var assocDao =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withEmergenceAngleResidual(0.2)
            .withTimeDefining(DefiningFlag.DEFAULT_DEFINING)
            .withEmergenceAngleResidual(0.2)
            .withAzimuthDefining(DefiningFlag.DEFAULT_DEFINING)
            .withSlownessDefining(DefiningFlag.DEFAULT_DEFINING)
            .build();

    var arInfoDaoNAValues =
        ArInfoDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_AR_INFO_DAO)
            .withBaseModelTravelTime(1.1)
            .withTravelTimeStaticCorrection(1.1)
            .withTravelTimeEllipticityCorrection(1.1)
            .withTravelTimeElevationCorrection(1.1)
            .withTravelTimeSourceSpecificCorrection(1.1)
            .withTotalTravelTime(203.232)
            .withTravelTimeModelError(1.232)
            .withTravelTimeImport(-1.0)
            .withAzimuthImport(-1.0)
            .withSlownessImport(-1.0)
            .build();

    var signalDetectionHypothesisData =
        SignalDetectionHypothesis.Data.builder()
            .setMonitoringOrganization("TEST")
            .setDeleted(false)
            .setStation(STATION)
            .setFeatureMeasurements(
                Set.of(
                    ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    EMERGENCE_ANGLE_FEATURE_MEASUREMENT,
                    PHASE_TYPE_FEATURE_MEASUREMENT,
                    RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
                    SLOWNESS_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT,
                    SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT))
            .build();

    var signalDetectionHypothesis =
        SignalDetectionHypothesis.create(
            SignalDetectionHypothesisId.from(
                UUID.fromString("b26806ca-2bbf-4f00-ba7c-de894028814d"),
                UUID.fromString("c0ea6fe2-4014-4f8a-bdbc-df68ba2f459f")),
            Optional.of(signalDetectionHypothesisData));

    var eventLocation = EventTestFixtures.EVENT_LOCATION;
    var sdhInfo =
        BridgedSdhInformation.builder()
            .setAssocDao(assocDao)
            .setSignalDetectionHypothesis(signalDetectionHypothesis)
            .setStaMagDaos(Collections.emptyList())
            .build();

    sdhInfo = sdhInfo.toBuilder().setArInfoDao(arInfoDaoNAValues).build();
    var resultsNAValues =
        PredictionsAndBehaviorsConverterUtility.fromLegacyToPredictionsAndBehaviors(
            sdhInfo, eventLocation);
    assertEquals(4, resultsNAValues.getLocationBehaviors().size());
  }

  @ParameterizedTest
  @MethodSource("fromLegacyToLocationBehaviorFeaturePredictionPairErrors")
  void testFromLegacyToLocationBehaviorFeaturePredictionPairErrors(
      BridgedSdhInformation sdhInfo,
      EventLocation eventLocation,
      Class<Throwable> expectedExceptionClass) {

    assertThrows(
        expectedExceptionClass,
        () ->
            PredictionsAndBehaviorsConverterUtility.fromLegacyToPredictionsAndBehaviors(
                sdhInfo, eventLocation));
  }

  private static Stream<Arguments> fromLegacyToLocationBehaviorFeaturePredictionPairErrors() {
    var sdhInfo = BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION;
    var sdhNoData = sdhInfo.getSignalDetectionHypothesis().orElseThrow().toEntityReference();
    var sdhInfoWithEmptySdh =
        BridgedSdhInformation.builder()
            .setArInfoDao(BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION.getArInfoDao().get())
            .setAssocDao(BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION.getAssocDao())
            .setStaMagDaos(BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION.getStaMagDaos())
            .build();
    var eventLocation = EventTestFixtures.EVENT_LOCATION;

    return Stream.of(
        arguments(null, eventLocation, NullPointerException.class),
        arguments(sdhInfo, null, NullPointerException.class),
        arguments(
            sdhInfo.toBuilder().setSignalDetectionHypothesis(sdhNoData).build(),
            eventLocation,
            IllegalArgumentException.class),
        arguments(sdhInfoWithEmptySdh, eventLocation, IllegalArgumentException.class));
  }
}
