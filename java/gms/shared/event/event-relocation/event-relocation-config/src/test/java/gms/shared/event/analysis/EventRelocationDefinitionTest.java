package gms.shared.event.analysis;

import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventRelocationDefinitionTest {

  @Test
  void testSerialization() {
    var signalDetectionUuid = UUID.nameUUIDFromBytes("A".getBytes());
    var signalDetectionHypothesis1Uuid = UUID.nameUUIDFromBytes("B".getBytes());
    var signalDetectionHypothesis2Uuid = UUID.nameUUIDFromBytes("C".getBytes());

    var signalDetectionHypothesis1 =
        SignalDetectionHypothesis.createEntityReference(
            signalDetectionUuid, signalDetectionHypothesis1Uuid);
    var signalDetectionHypothesis2 =
        SignalDetectionHypothesis.createEntityReference(
            signalDetectionUuid, signalDetectionHypothesis2Uuid);

    var sdh1Defining =
        new DefiningFeatureByFeatureMeasurementType(
            Map.of(
                FeatureMeasurementTypes.ARRIVAL_TIME,
                    new DefiningFeatureDefinition(true, true, true),
                FeatureMeasurementTypes.SLOWNESS, new DefiningFeatureDefinition(true, false, true),
                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                    new DefiningFeatureDefinition(true, true, false)));

    var sdh2Defining =
        new DefiningFeatureByFeatureMeasurementType(
            Map.of(
                FeatureMeasurementTypes.ARRIVAL_TIME,
                    new DefiningFeatureDefinition(true, true, true),
                FeatureMeasurementTypes.SLOWNESS, new DefiningFeatureDefinition(true, true, false),
                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                    new DefiningFeatureDefinition(true, false, false)));

    var definingFeatureSdhMap =
        Map.of(
            signalDetectionHypothesis1, sdh1Defining,
            signalDetectionHypothesis2, sdh2Defining);

    var masterEventHypothesis = EventTestFixtures.getTestEventHypothesis();

    var eventRelocationDefinition =
        new EventRelocationDefinition(
            definingFeatureSdhMap, new MasterEventCorrectionDefinition(masterEventHypothesis));

    JsonTestUtilities.assertSerializes(eventRelocationDefinition, EventRelocationDefinition.class);
  }
}
