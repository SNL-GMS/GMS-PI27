package gms.shared.event.analysis.relocation.service;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.api.EventRelocatorPlugin;
import gms.shared.event.api.DefiningFeatureMapRequest;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.RestraintType;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.io.File;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class EventRelocationControlTest {

  private EventRelocationConfigurationResolver eventRelocationConfigurationResolver;
  private static ConfigurationConsumerUtility configurationConsumerUtility;

  @BeforeAll
  static void init() {
    var configurationRoot =
        Preconditions.checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();
  }

  @BeforeEach
  void setUp() {
    eventRelocationConfigurationResolver =
        new EventRelocationConfigurationResolver(
            configurationConsumerUtility,
            "event-relocation-service.event-relocation-processing-definition",
            "event-relocation-service.event-relocation-predictors-for-phases",
            "event-relocation-service.event-relocation-earthmodels-for-predictors",
            "event-relocation-service.event-relocation-defining-feature-measurement");
  }

  @Test
  void testGetDefiningFeatureMaps() {
    DefiningFeatureMapRequest request =
        new DefiningFeatureMapRequest(
            ImmutableList.of(PhaseType.P, PhaseType.S),
            ImmutableList.of(
                UtilsTestFixtures.CHANNEL_VERSION_REAL_NAME,
                UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR));

    var eventRelocationControl =
        new EventRelocationControl(eventRelocationConfigurationResolver, Map.of());

    var definingFeatureMaps = eventRelocationControl.getDefiningFeatureMaps(request);
    var p_sta01 =
        definingFeatureMaps
            .definingFeatureMapByChannelAndPhaseType()
            .get(PhaseType.P, UtilsTestFixtures.CHANNEL_VERSION_REAL_NAME.getName());
    var s_sta01 =
        definingFeatureMaps
            .definingFeatureMapByChannelAndPhaseType()
            .get(PhaseType.S, UtilsTestFixtures.CHANNEL_VERSION_REAL_NAME.getName());
    var p_asar =
        definingFeatureMaps
            .definingFeatureMapByChannelAndPhaseType()
            .get(PhaseType.P, UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR.getName());

    Assertions.assertNotNull(definingFeatureMaps);

    Assertions.assertTrue(p_sta01.containsKey(FeatureMeasurementTypes.ARRIVAL_TIME));

    Assertions.assertEquals(1, p_sta01.size());

    Assertions.assertTrue(s_sta01.containsKey(FeatureMeasurementTypes.ARRIVAL_TIME));

    Assertions.assertEquals(1, s_sta01.size());

    Assertions.assertTrue(p_asar.containsKey(FeatureMeasurementTypes.SLOWNESS));

    Assertions.assertEquals(1, p_asar.size());

    Assertions.assertTrue(s_sta01.containsKey(FeatureMeasurementTypes.ARRIVAL_TIME));

    Assertions.assertEquals(1, s_sta01.size());
  }

  @Test
  void testRelocate() {

    //
    // Create two event hypothesis - one with a preferred location solution with a "free"
    // LocationRestraint, the other with a preferred location solution
    // with a time restrained LocationRestraint, which is one of the LocationRestraints passed in.
    //
    var eventHypothesisNoMatchingPreferred = EventTestFixtures.getTestEventHypothesis();

    var data = eventHypothesisNoMatchingPreferred.getData().get();

    var nonMatchingPreferredLocationSolution = data.getPreferredLocationSolution().get();

    var timeRestraint =
        LocationRestraint.builder()
            .setTimeRestraint(Instant.EPOCH.plusSeconds(1045))
            .setTimeRestraintType(RestraintType.FIXED)
            .setDepthRestraintType(RestraintType.UNRESTRAINED)
            .setPositionRestraintType(RestraintType.UNRESTRAINED)
            .build();

    var matchingPreferredLocationSolution =
        nonMatchingPreferredLocationSolution.toBuilder()
            .setData(
                nonMatchingPreferredLocationSolution.getData().get().toBuilder()
                    .setLocationRestraint(timeRestraint)
                    .build())
            .build();

    var eventHypothesesMatchingPreferred =
        eventHypothesisNoMatchingPreferred.toBuilder()
            .setData(
                data.toBuilder()
                    .setPreferredLocationSolution(matchingPreferredLocationSolution)
                    .setLocationSolutions(Set.of(matchingPreferredLocationSolution))
                    .build())
            .build();

    // Create a list of LocationRestraints as input that does not have the "free" LocationRestraint.
    var locationRestraints =
        List.of(
            EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION,
            LocationRestraint.builder()
                .setLongitudeRestraintDegrees(100.0)
                .setLatitudeRestraintDegrees(89.0)
                .setPositionRestraintType(RestraintType.FIXED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            timeRestraint);

    var processingDefinition = Mockito.mock(EventRelocationProcessingDefinition.class);
    Mockito.when(processingDefinition.locationRestraints()).thenReturn(locationRestraints);
    Mockito.when(processingDefinition.eventRelocator()).thenReturn(DummyRelocator.NAME);

    var eventRelocationDefinition = Mockito.mock(EventRelocationDefinition.class);

    var control =
        new EventRelocationControl(
            eventRelocationConfigurationResolver,
            Map.of(DummyRelocator.NAME, new DummyRelocator()));

    var eventHypothesisMap =
        Map.of(
            eventHypothesisNoMatchingPreferred, eventRelocationDefinition,
            eventHypothesesMatchingPreferred, eventRelocationDefinition);

    var eventHypotheses = control.relocate(eventHypothesisMap, null, processingDefinition);

    // Make sure we still have both EventHypotheses.
    Assertions.assertEquals(eventHypothesisMap.size(), eventHypotheses.size());

    // The EventHypothesis with the "free" preferred LocationSolution should have its preferred
    // LocationSolution replaced by one with the first restraint
    // in the LocationRestraint list, because it does not have a location solution that is "free"
    var relocatedNonMatchingEventHypothesisList =
        eventHypotheses.stream()
            .filter(
                eventHypothesis -> {
                  var ehData = eventHypothesis.getData().get();
                  var lsData =
                      getPreferredFromCollection(
                              ehData.getLocationSolutions(),
                              ehData.getPreferredLocationSolution().get())
                          .getData()
                          .get();
                  return lsData
                      .getLocationRestraint()
                      .equals(EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION);
                })
            .collect(Collectors.toList());

    Assertions.assertEquals(1, relocatedNonMatchingEventHypothesisList.size());

    // The EventHypothesis with the time-restrained LocationSolution should now have a
    // time-restrained preferred LocationSolution, since it contained
    // a time-restrained LocationSolution in its set of LocationSolutions.
    var relocatedMatchingEventHypothesisList =
        eventHypotheses.stream()
            .filter(
                eventHypothesis -> {
                  var ehData = eventHypothesis.getData().get();
                  var lsData =
                      getPreferredFromCollection(
                              ehData.getLocationSolutions(),
                              ehData.getPreferredLocationSolution().get())
                          .getData()
                          .get();
                  return lsData.getLocationRestraint().equals(timeRestraint);
                })
            .collect(Collectors.toList());

    Assertions.assertEquals(1, relocatedMatchingEventHypothesisList.size());
  }

  private LocationSolution getPreferredFromCollection(
      Collection<LocationSolution> collection, LocationSolution preferredEntityRef) {
    return collection.stream()
        .filter(locationSolution -> locationSolution.getId().equals(preferredEntityRef.getId()))
        .findFirst()
        .get();
  }

  private static class DummyRelocator implements EventRelocatorPlugin {

    static final String NAME = "dummyRelocator";

    @Override
    public Collection<LocationSolution> relocate(
        EventHypothesis eventHypothesis,
        EventRelocationDefinition eventRelocationDefinition,
        Map<PhaseType, List<EventRelocationPredictorDefinition>>
            eventRelocationDefinitionByPhaseType,
        EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

      var baseData = EventTestFixtures.LOCATION_SOLUTION_DATA;

      var data =
          baseData.toBuilder()
              .setLocation(
                  eventHypothesis.getData().get().getLocationSolutions().stream()
                      .findFirst()
                      .get()
                      .getData()
                      .get()
                      .getLocation())
              .build();

      return eventRelocationProcessingDefinition.locationRestraints().stream()
          .map(
              locationResraint ->
                  LocationSolution.builder()
                      .setId(UUID.nameUUIDFromBytes(locationResraint.toString().getBytes()))
                      .setData(
                          data.toBuilder()
                              .setLocationRestraint(locationResraint)
                              .setLocation(
                                  EventLocation.from(
                                      locationResraint
                                          .getLatitudeRestraintDegrees()
                                          .orElse(
                                              data.getLocation()
                                                  .getLatitudeDegrees()), // latitudeDegrees,
                                      locationResraint
                                          .getLongitudeRestraintDegrees()
                                          .orElse(
                                              data.getLocation()
                                                  .getLongitudeDegrees()), // longitudeDegrees,
                                      locationResraint
                                          .getDepthRestraintKm()
                                          .orElse(data.getLocation().getDepthKm()),
                                      locationResraint
                                          .getTimeRestraint()
                                          .orElse(data.getLocation().getTime())))
                              .build())
                      .build())
          .collect(Collectors.toList());
    }
  }
}
