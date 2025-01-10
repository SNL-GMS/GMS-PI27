package gms.shared.event.analysis.relocation.controller;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class EventRelocationRequestTest {

  @Test
  void testSerialization() {
    var eventHypothesis = EventTestFixtures.getTestEventHypothesis();

    var definingFeatureMap =
        new DefiningFeatureByFeatureMeasurementType(
            Map.of(
                FeatureMeasurementTypes.ARRIVAL_TIME,
                new DefiningFeatureDefinition(true, true, false)));

    var sdhDefinitionMap =
        eventHypothesis.getData().get().getAssociatedSignalDetectionHypotheses().stream()
            .map(sdh -> Map.entry(sdh, definingFeatureMap))
            .collect(Collectors.toMap(Entry::getKey, Entry::getValue));

    var correction =
        new MasterEventCorrectionDefinition(EventTestFixtures.getTestEventHypothesis());
    var definition = new EventRelocationDefinition(sdhDefinitionMap, correction);

    var eventHypothesisMap = Map.of(eventHypothesis, definition);

    var phasePredictorMap =
        Map.of(
            PhaseType.P,
                List.of(new EventRelocationPredictorDefinition("myPredictorP", "myModelP")),
            PhaseType.S,
                List.of(
                    new EventRelocationPredictorDefinition("myPredictorS1", "myModelS1"),
                    new EventRelocationPredictorDefinition("myPredictorS2", "myModelS2")));

    var defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("default")
            .setEarthModel("default earth model")
            .build();

    var locationRestraints =
        List.of(
            LocationRestraint.builder()
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .build());

    var locationUncertaintyDefinitions =
        List.of(
            LocationUncertaintyDefinition.builder()
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(0.0)
                .setScalingFactorType(ScalingFactorType.CONFIDENCE)
                .build());

    var residualDefinition =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setBigResidualThreshold(0.0)
            .setMaxFraction(0.0)
            .build();

    var erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(List.of())
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    var request = new EventRelocationRequest(eventHypothesisMap, phasePredictorMap, erpd);

    JsonTestUtilities.assertSerializes(request, EventRelocationRequest.class);
  }
}
