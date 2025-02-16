package gms.shared.event.coi;

import static gms.shared.event.coi.EventTestFixtures.LOCATION_SOLUTION_DATA_NO_MCS;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LocationSolutionTest {

  @Mock LocationSolution.Data data;

  @Test
  void testSerializationFullyHydrated() {
    var locationSolution =
        LocationSolution.builder()
            .setId(UUID.fromString("10000000-100-0000-1000-100000000100"))
            .setData(LOCATION_SOLUTION_DATA_NO_MCS)
            .build();
    JsonTestUtilities.assertSerializes(locationSolution, LocationSolution.class);
  }

  @Test
  void testSerializationFaceted() {
    var locationSolution =
        LocationSolution.createEntityReference(
            UUID.fromString("10000000-100-0000-1000-100000000101"));
    JsonTestUtilities.assertSerializes(locationSolution, LocationSolution.class);
  }

  @Test
  void testCreateEntityReference() {
    var id = UUID.fromString("10000000-100-0000-1000-100000000102");
    var locationSolution = LocationSolution.createEntityReference(id);
    assertEquals(id, locationSolution.getId());
    assertFalse(locationSolution.getData().isPresent());
  }

  @Test
  void testToEntityReference() {
    var eventLocation = EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH);
    given(data.getLocation()).willReturn(eventLocation);
    var locationSolution =
        LocationSolution.builder()
            .setId(UUID.fromString("10000000-100-0000-1000-100000000103"))
            .setData(data)
            .build();

    var entityRef = locationSolution.toEntityReference();

    assertTrue(locationSolution.getData().isPresent());
    assertEquals(locationSolution.getId(), entityRef.getId());
    assertFalse(entityRef.getData().isPresent());
    assertEquals(eventLocation, locationSolution.getData().get().getLocation());
  }

  @ParameterizedTest
  @MethodSource("locationSolutionDataBuildSource")
  void testEventHypothesisDataBuild(
      boolean shouldThrow, Class<Throwable> exception, LocationSolution.Data.Builder dataBuilder) {

    if (shouldThrow) {
      assertThrows(exception, dataBuilder::build);
    } else {
      assertDoesNotThrow(dataBuilder::build);
    }
  }

  private static Stream<Arguments> locationSolutionDataBuildSource() {
    var eventLocation = mock(EventLocation.class);
    var locationRestraint = mock(LocationRestraint.class);
    var featurePrediction = mock(FeaturePrediction.class);
    var featurePredictionContainer = mock(FeaturePredictionContainer.class);
    var featurePredictionContainerEmpty = mock(FeaturePredictionContainer.class);
    var locationBehavior = mock(LocationBehavior.class);
    given(featurePredictionContainer.contains(featurePrediction)).willReturn(true);
    given(locationBehavior.getPrediction()).willReturn(Optional.of(featurePrediction));

    var locationSolutionDataBase =
        LocationSolution.Data.builder()
            .setLocation(eventLocation)
            .setLocationRestraint(locationRestraint)
            .setFeaturePredictions(featurePredictionContainer)
            .build();

    return Stream.of(
        Arguments.arguments(
            false,
            null,
            locationSolutionDataBase.toBuilder().setFeaturePredictions(featurePredictionContainer)),
        Arguments.arguments(
            true,
            IllegalStateException.class,
            locationSolutionDataBase.toBuilder()
                .setLocationBehaviors(List.of(locationBehavior))
                .setFeaturePredictions(featurePredictionContainerEmpty)),
        Arguments.arguments(
            false,
            null,
            locationSolutionDataBase.toBuilder()
                .setFeaturePredictions(featurePredictionContainer)
                .setLocationBehaviors(List.of(locationBehavior))));
  }
}
