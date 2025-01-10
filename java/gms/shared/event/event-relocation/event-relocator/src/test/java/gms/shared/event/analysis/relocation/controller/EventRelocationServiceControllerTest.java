package gms.shared.event.analysis.relocation.controller;

import static org.mockito.BDDMockito.given;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Table;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.analysis.relocation.service.EventRelocationControl;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.api.DefiningFeatureMapByChannelAndPhaseType;
import gms.shared.event.api.DefiningFeatureMapRequest;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

@WebMvcTest(EventRelocationServiceController.class)
@Import(EventRelocationServiceControllerTestConfiguration.class)
class EventRelocationServiceControllerTest extends SpringTestBase {

  private static final DefiningFeatureDefinition DEFINING_FEATURE_DEFINITION =
      new DefiningFeatureDefinition(true, true, true);

  @MockBean private EventRelocationControl eventRelocationControl;

  @Test
  void testGetEventRelocationProcessingDefinitionEndpoint() throws Exception {

    var defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("default")
            .setEarthModel("default earth model")
            .build();

    var eventRelocationPredictorDefinitions =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("predictor 1")
                .setEarthModel("earth model 1")
                .build());

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

    var expectedDefinition =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(eventRelocationPredictorDefinitions)
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    Mockito.when(eventRelocationControl.getEventRelocationProcessingDefinition())
        .thenReturn(expectedDefinition);

    MockHttpServletResponse response =
        getResult("/relocation/event-relocation-processing-definition", HttpStatus.OK);

    Assertions.assertNotNull(response.getContentAsString());
    Assertions.assertFalse(response.getContentAsString().isEmpty());

    var actualDefinition =
        ObjectMappers.jsonReader()
            .readValue(response.getContentAsString(), EventRelocationProcessingDefinition.class);

    Assertions.assertEquals(expectedDefinition, actualDefinition);
  }

  @Test
  void testGetDefaultDefiningFeatureMaps() throws Exception {
    DefiningFeatureMapRequest request =
        new DefiningFeatureMapRequest(
            ImmutableList.of(PhaseType.P),
            ImmutableList.of(UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR));

    Table<PhaseType, String, Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>>
        configTable = HashBasedTable.create();

    Map<FeatureMeasurementType<?>, DefiningFeatureDefinition> slowness =
        Map.of(FeatureMeasurementTypes.SLOWNESS, new DefiningFeatureDefinition(true, true, true));

    configTable.put(PhaseType.P, UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR.getName(), slowness);

    var expectedDefiningFeatureMap = new DefiningFeatureMapByChannelAndPhaseType(configTable);
    var expectedResponse =
        "{\"definingFeatureMapByChannelAndPhaseType\":{\"P\":{\"ASAR.beam.SHZ\":{\"SLOWNESS\":{\"analystOverridable\":true,\"defining\":true,\"systemOverridable\":true}}}}}";

    given(eventRelocationControl.getDefiningFeatureMaps(request))
        .willReturn(expectedDefiningFeatureMap);

    MockHttpServletResponse response =
        postResult("/relocation/default-defining-feature-maps", request, HttpStatus.OK);

    Assertions.assertNotNull(response.getContentAsString());
    Assertions.assertFalse(response.getContentAsString().isEmpty());
    Assertions.assertEquals(expectedResponse, response.getContentAsString());
  }

  @Test
  void testRelocate() throws Exception {
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

    given(eventRelocationControl.relocate(eventHypothesisMap, phasePredictorMap, erpd))
        .willReturn(Set.of(eventHypothesis));

    MockHttpServletResponse response = postResult("/relocation/relocate", request, HttpStatus.OK);

    Assertions.assertNotNull(response.getContentAsString());
    Assertions.assertFalse(response.getContentAsString().isEmpty());

    Collection<EventHypothesis> actualEventHypotheses =
        ObjectMappers.jsonReader()
            .forType(new TypeReference<Collection<EventHypothesis>>() {})
            .readValue(response.getContentAsString());

    Assertions.assertEquals(1, actualEventHypotheses.size());

    Assertions.assertEquals(eventHypothesis, actualEventHypotheses.stream().findFirst().get());
  }
}
