package gms.shared.event.analysis.relocation.locoo3d.plugin;

import static gms.shared.event.coi.EventTestFixtures.EVENT_UUID;
import static gms.shared.event.coi.EventTestFixtures.HYPOTHESIS_UUID;
import static gms.shared.event.coi.EventTestFixtures.LOCATION_SOLUTION_DATA;
import static gms.shared.event.coi.EventTestFixtures.LOCATION_UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsInput;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsInputOutputFactory;
import gms.shared.event.analysis.relocation.locoo3d.apibridge.GmsOutput;
import gms.shared.event.analysis.relocation.locoo3d.plugin.LocOo3dEventRelocator.GmsInputAcceptCoiException;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.baseobjects.globals.GMPGlobals;
import gov.sandia.gmp.locoo3d.LocOO;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LocOo3dEventRelocatorTest {

  private static final EventHypothesis BASE_EVENT_HYPOTHESIS =
      EventTestFixtures.generateDummyEventHypothesis(
          EVENT_UUID,
          HYPOTHESIS_UUID,
          LOCATION_UUID,
          3.3,
          Instant.EPOCH.plusSeconds(2024),
          MagnitudeType.MB,
          DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
          List.of());

  @Mock private LocOO locOO;
  @Mock private GmsOutput gmsOutputMock;
  @Mock private GmsInput gmsInputMock;

  @Test
  void testValidGmsRelocation() throws Exception {
    var uuid = UUID.fromString("00000000-000-0000-0000-000000000001");
    Map<UUID, LocationSolution> locationSolutionsMap =
        Map.of(
            uuid, LocationSolution.builder().setData(LOCATION_SOLUTION_DATA).setId(uuid).build());
    GmsInput gmsInput = getGmsInput();
    var gmsOutput = new GmsOutput(getProperties(), gmsInput);
    try (MockedConstruction<GmsInputOutputFactory> mocked =
        Mockito.mockConstruction(
            GmsInputOutputFactory.class,
            (mock, context) -> {
              when(mock.getDataInput()).thenReturn(gmsInputMock);
              when(mock.getDataOutput()).thenReturn(gmsOutputMock);
            })) {

      when(gmsOutputMock.getOutputLocationSolutions()).thenReturn(locationSolutionsMap);
      doNothing().when(locOO).run(any());
      LocOo3dEventRelocator locOo3dEventRelocator = new LocOo3dEventRelocator(locOO);

      var assoicatedSdhEnitityReferences =
          getSdhSet().stream().map(sdh -> sdh.toEntityReference()).toList();
      var eventRelocationDefinition = getEventRelocationDefinition(getSdhDefiningMap());
      EventHypothesis eventHypothesis = getEventHypothesis(assoicatedSdhEnitityReferences);
      Collection<LocationSolution> locationSolutions =
          locOo3dEventRelocator.relocate(
              eventHypothesis,
              eventRelocationDefinition,
              getEventRelocationDefinitionByPhaseType(),
              getEventRelocationProcessingDefinition());

      var locationRestraints =
          getEventRelocationProcessingDefinition().locationRestraints().stream()
              .collect(Collectors.toSet());

      GmsInputOutputFactory factoryMock = mocked.constructed().get(0);
      verify(factoryMock, times(1)).getDataInput();
      verify(factoryMock, times(1)).getDataOutput();
      verify(gmsInputMock, times(1))
          .acceptCoi(eventHypothesis, eventRelocationDefinition, locationRestraints);
      verify(locOO, times(1)).run(factoryMock);
      Assertions.assertFalse(locationSolutions.isEmpty());
    }
  }

  @Test
  void testFactoryCreationException() throws Exception {
    try (MockedConstruction<GmsInputOutputFactory> mocked =
        Mockito.mockConstruction(
            GmsInputOutputFactory.class,
            (mock, context) -> {
              throw new LocOo3dEventRelocator.FactoryCreationException(new Exception());
            })) {
      LocOo3dEventRelocator locOo3dEventRelocator = new LocOo3dEventRelocator(locOO);

      var eventRelocationDefinition = getEventRelocationDefinition(getSdhDefiningMap());

      var assoicatedSdhEnitityReferences =
          getSdhSet().stream().map(sdh -> sdh.toEntityReference()).toList();

      EventHypothesis eventHypothesis = getEventHypothesis(assoicatedSdhEnitityReferences);
      var eventRelocationDefinitionByPhaseType = getEventRelocationDefinitionByPhaseType();
      var eventRelocationProcessingDefinition = getEventRelocationProcessingDefinition();

      Assertions.assertThrows(
          LocOo3dEventRelocator.FactoryCreationException.class,
          () ->
              locOo3dEventRelocator.relocate(
                  eventHypothesis,
                  eventRelocationDefinition,
                  eventRelocationDefinitionByPhaseType,
                  eventRelocationProcessingDefinition));
    }
  }

  @Test
  void testGmsInputAcceptCoiException() throws Exception {
    try (MockedConstruction<GmsInputOutputFactory> mocked =
        Mockito.mockConstruction(
            GmsInputOutputFactory.class,
            (mock, context) -> {
              when(mock.getDataInput()).thenReturn(gmsInputMock);
            })) {
      LocOo3dEventRelocator locOo3dEventRelocator = new LocOo3dEventRelocator(locOO);

      var eventRelocationDefinition = getEventRelocationDefinition(getSdhDefiningMap());

      var assoicatedSdhEnitityReferences =
          getSdhSet().stream().map(sdh -> sdh.toEntityReference()).toList();

      EventHypothesis eventHypothesis = getEventHypothesis(assoicatedSdhEnitityReferences);
      var eventRelocationDefinitionByPhaseType = getEventRelocationDefinitionByPhaseType();
      var eventRelocationProcessingDefinition = getEventRelocationProcessingDefinition();

      var locationRestraints =
          getEventRelocationProcessingDefinition().locationRestraints().stream()
              .collect(Collectors.toSet());

      doThrow(GmsInputAcceptCoiException.class)
          .when(gmsInputMock)
          .acceptCoi(eventHypothesis, eventRelocationDefinition, locationRestraints);
      Assertions.assertThrows(
          GmsInputAcceptCoiException.class,
          () ->
              locOo3dEventRelocator.relocate(
                  eventHypothesis,
                  eventRelocationDefinition,
                  eventRelocationDefinitionByPhaseType,
                  eventRelocationProcessingDefinition));

      GmsInputOutputFactory factoryMock = mocked.constructed().get(0);
      verify(factoryMock, times(1)).getDataInput();
      verify(locOO, times(0)).run(factoryMock);
      verify(factoryMock, times(0)).getDataOutput();
    }
  }

  @Test
  void testLocOORunException() throws Exception {
    try (MockedConstruction<GmsInputOutputFactory> mocked =
        Mockito.mockConstruction(
            GmsInputOutputFactory.class,
            (mock, context) -> {
              when(mock.getDataInput()).thenReturn(gmsInputMock);
              when(mock.getDataOutput()).thenReturn(gmsOutputMock);
            })) {
      LocOo3dEventRelocator locOo3dEventRelocator = new LocOo3dEventRelocator(locOO);

      var eventRelocationDefinition = getEventRelocationDefinition(getSdhDefiningMap());

      var assoicatedSdhEnitityReferences =
          getSdhSet().stream().map(sdh -> sdh.toEntityReference()).toList();

      EventHypothesis eventHypothesis = getEventHypothesis(assoicatedSdhEnitityReferences);
      var eventRelocationDefinitionByPhaseType = getEventRelocationDefinitionByPhaseType();
      var eventRelocationProcessingDefinition = getEventRelocationProcessingDefinition();

      doThrow(LocOo3dEventRelocator.LocOORunException.class).when(locOO).run(any());

      Assertions.assertThrows(
          LocOo3dEventRelocator.LocOORunException.class,
          () ->
              locOo3dEventRelocator.relocate(
                  eventHypothesis,
                  eventRelocationDefinition,
                  eventRelocationDefinitionByPhaseType,
                  eventRelocationProcessingDefinition));

      GmsInputOutputFactory factoryMock = mocked.constructed().get(0);
      verify(factoryMock, times(1)).getDataInput();
      verify(locOO, times(1)).run(factoryMock);
      verify(factoryMock, times(1)).getDataOutput();
    }
  }

  private GmsInput getGmsInput() throws Exception {

    var locationRestraintsMap =
        Map.of(
            EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION,
            GMPGlobals.DEPTH,
            LocationRestraint.builder()
                .setLongitudeRestraintDegrees(100.0)
                .setLatitudeRestraintDegrees(89.0)
                .setPositionRestraintType(RestraintType.FIXED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.LAT,
            LocationRestraint.builder()
                .setTimeRestraint(Instant.EPOCH.plusSeconds(1045))
                .setTimeRestraintType(RestraintType.FIXED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.TIME);

    var eventRelocationDefinition = getEventRelocationDefinition(getSdhDefiningMap());

    var assoicatedSdhEnitityReferences =
        getSdhSet().stream().map(sdh -> sdh.toEntityReference()).toList();

    EventHypothesis eventHypothesis = getEventHypothesis(assoicatedSdhEnitityReferences);

    var newGmsInput = new GmsInput(getProperties());
    newGmsInput.acceptCoi(
        eventHypothesis, eventRelocationDefinition, locationRestraintsMap.keySet());

    return newGmsInput;
  }

  private EventHypothesis getEventHypothesis(
      List<SignalDetectionHypothesis> assoicatedSdhEnitityReferences) {
    var eventHypothesis =
        BASE_EVENT_HYPOTHESIS.toBuilder()
            .setData(
                BASE_EVENT_HYPOTHESIS.getData().get().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(assoicatedSdhEnitityReferences)
                    .setPreferredLocationSolution(
                        BASE_EVENT_HYPOTHESIS
                            .getData()
                            .get()
                            .getPreferredLocationSolution()
                            .get()
                            .toEntityReference())
                    .build())
            .build();
    return eventHypothesis;
  }

  private PropertiesPlusGMP getProperties() {

    var properties = new PropertiesPlusGMP();
    properties.put("dataLoaderInputType", "application");
    properties.put("dataLoaderInputFormat", "gms");
    properties.put("dataLoaderOutputType", "application");
    properties.put("dataLoaderOutputFormat", "gms");
    properties.setProperty("gen_allow_big_residuals", true);
    properties.setProperty("gen_big_residual_threshold", "0.0");
    properties.setProperty("gen_big_residual_max_fraction", "0.0");

    properties.setProperty("loc_predictor_type", "lookup2d, bender(P, Pn), slbm(Pg, Pn)");
    properties.setProperty("gen_error_ellipse_type", "COVERAGE");
    properties.setProperty("gen_jordan_sverdrup_k", Double.toString(Double.POSITIVE_INFINITY));
    properties.setProperty("gen_apriori_standard_error", "10.0");
    properties.setProperty("gen_confidence_level", "0.5");

    return properties;
  }

  private Set<SignalDetectionHypothesis> getSdhSet() {
    var slownessFm1 = SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT;

    slownessFm1 =
        slownessFm1.toBuilder()
            .setMeasurementValue(
                NumericMeasurementValue.from(
                    slownessFm1.getMeasurementValue().getReferenceTime(),
                    DoubleValue.from(
                        slownessFm1.getMeasurementValue().getMeasuredValue().getValue(),
                        slownessFm1.getMeasurementValue().getMeasuredValue().getStandardDeviation(),
                        Units.SECONDS_PER_DEGREE)))
            .build();

    var featureMeasurements =
        Set.of(
            slownessFm1,
            SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT);

    var baseSdh1 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh1 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(1000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    var baseSdh2 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh2 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(2000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    return Set.of(baseSdh1, baseSdh2);
  }

  private Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType>
      getSdhDefiningMap() {

    return getSdhSet().stream()
        .map(
            sdh ->
                Map.entry(
                    sdh,
                    new DefiningFeatureByFeatureMeasurementType(
                        Map.of(
                            FeatureMeasurementTypes.ARRIVAL_TIME,
                            new DefiningFeatureDefinition(true, false, true),
                            FeatureMeasurementTypes.SLOWNESS,
                            new DefiningFeatureDefinition(true, false, true),
                            FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                            new DefiningFeatureDefinition(true, false, true)))))
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }

  private EventRelocationProcessingDefinition getEventRelocationProcessingDefinition() {
    EventRelocationPredictorDefinition defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("lookup2d")
            .setEarthModel("default earth model")
            .build();

    Collection<LocationRestraint> locationRestraints =
        List.of(
            LocationRestraint.builder()
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .build());

    Collection<LocationUncertaintyDefinition> locationUncertaintyDefinitions =
        List.of(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(Double.POSITIVE_INFINITY)
                .setScalingFactorType(ScalingFactorType.COVERAGE)
                .build());

    ResidualDefinition residualDefinition =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setBigResidualThreshold(0.0)
            .setMaxFraction(0.0)
            .build();

    return EventRelocationProcessingDefinition.builder()
        .setDefaultPredictorDefinition(defaultPredictorDefinition)
        .setEventRelocationPredictorDefinitions(List.of())
        .setEventRelocator("event relocator")
        .setLocationRestraints(locationRestraints)
        .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
        .setResidualDefinition(residualDefinition)
        .build();
  }

  private Map<PhaseType, List<EventRelocationPredictorDefinition>>
      getEventRelocationDefinitionByPhaseType() {
    EventRelocationPredictorDefinition defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("lookup2d")
            .setEarthModel("default earth model")
            .build();

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsA =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("bender")
                .setEarthModel("earth model 1")
                .build(),
            EventRelocationPredictorDefinition.builder()
                .setPredictor("slbm")
                .setEarthModel("earth model 1")
                .build());

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsB =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("bender")
                .setEarthModel("earth model 1")
                .build());

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsC =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("slbm")
                .setEarthModel("earth model 1")
                .build());

    return Map.of(
        PhaseType.Pn,
        eventRelocationPredictorDefinitionsA,
        PhaseType.P,
        eventRelocationPredictorDefinitionsB,
        PhaseType.Pg,
        eventRelocationPredictorDefinitionsC);
  }

  private EventRelocationDefinition getEventRelocationDefinition(
      Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType> sdhDefiningMap) {
    return new EventRelocationDefinition(sdhDefiningMap, null);
  }
}
