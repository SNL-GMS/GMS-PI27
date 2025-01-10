package gms.shared.signalenhancement.coi.filter;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.signalenhancement.coi.filter.FilterDefsForDistRangesByUsage.Builder;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

class FilterDefsForDistRangesByUsageTest {
  private static final FilterDefinition FD1 =
      FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL;
  private static final FilterDefinition FD2 =
      FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL;
  private static final FilterDefinitionIdForDistanceRange FD_ID_FOR_DR1 =
      new FilterDefinitionIdForDistanceRange(FD1.getUniqueIdentifier());
  private static final FilterDefinitionIdForDistanceRange FD_ID_FOR_DR2 =
      new FilterDefinitionIdForDistanceRange(FD2.getUniqueIdentifier());

  @ParameterizedTest
  @MethodSource("fdfdrByUsageSource")
  void testValidation(
      Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>
          filterDefIdsForDistanceRangesByUsage,
      Map<UUID, FilterDefinition> filterDefinitionsById,
      Class<? extends Throwable> expectedException) {

    if (expectedException == null) {
      Assertions.assertDoesNotThrow(
          () ->
              new FilterDefsForDistRangesByUsage(
                  filterDefIdsForDistanceRangesByUsage, filterDefinitionsById));
    } else {
      Assertions.assertThrows(
          expectedException,
          () ->
              new FilterDefsForDistRangesByUsage(
                  filterDefIdsForDistanceRangesByUsage, filterDefinitionsById));
    }
  }

  private static Stream<Arguments> fdfdrByUsageSource() {

    var fdfdrMapWithFdId1 = Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1));
    var fdfdrMapWithFdId2 = Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR2));

    var fdfdrMapWithFdIdsNoDuplicates =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(FD_ID_FOR_DR1),
            FilterDefinitionUsage.DETECTION,
            List.of(FD_ID_FOR_DR2));

    var fdfdrMapWithFdIdsDuplicates =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(FD_ID_FOR_DR1),
            FilterDefinitionUsage.DETECTION,
            List.of(FD_ID_FOR_DR2),
            FilterDefinitionUsage.ONSET,
            List.of(FD_ID_FOR_DR2));

    var fdIdMapWithFdId1 = Map.of(FD1.getUniqueIdentifier(), FD1);
    var fdIdMapWithFdId2 = Map.of(FD2.getUniqueIdentifier(), FD2);
    var fdIdMapWithFdIds =
        Map.of(
            FD1.getUniqueIdentifier(),
            Mockito.mock(FilterDefinition.class),
            FD2.getUniqueIdentifier(),
            Mockito.mock(FilterDefinition.class));

    return Stream.of(
        Arguments.arguments(fdfdrMapWithFdId1, fdIdMapWithFdId1, null),
        Arguments.arguments(fdfdrMapWithFdId2, fdIdMapWithFdId2, null),
        Arguments.arguments(fdfdrMapWithFdIdsNoDuplicates, fdIdMapWithFdIds, null),
        Arguments.arguments(fdfdrMapWithFdIdsDuplicates, fdIdMapWithFdIds, null),
        Arguments.arguments(Map.of(), Map.of(), null),
        Arguments.arguments(fdfdrMapWithFdId1, fdIdMapWithFdId2, IllegalArgumentException.class),
        Arguments.arguments(Map.of(), fdIdMapWithFdIds, IllegalArgumentException.class),
        Arguments.arguments(
            fdfdrMapWithFdIdsNoDuplicates, Map.of(), IllegalArgumentException.class),
        Arguments.arguments(
            fdfdrMapWithFdIdsNoDuplicates, fdIdMapWithFdId1, IllegalArgumentException.class),
        Arguments.arguments(fdfdrMapWithFdId1, fdIdMapWithFdIds, IllegalArgumentException.class));
  }

  @ParameterizedTest
  @MethodSource("fdfdrBuilderValidationSource")
  void testBuilderValidation(Builder fdfdrBuilder, FilterDefsForDistRangesByUsage expected) {
    assertDoesNotThrow(
        () -> {
          var fdfdrMap = fdfdrBuilder.build();
          assertEquals(expected, fdfdrMap);
        });
  }

  private static Stream<Arguments> fdfdrBuilderValidationSource() {

    var dr1 = new DistanceRangeDeg(0, 90);
    var mapWithFdfDrId1 =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(new FilterDefinitionForDistanceRange(FD1, Optional.of(dr1))));

    var fdIdFdR =
        new FilterDefinitionIdForDistanceRange(FD1.getUniqueIdentifier(), Optional.of(dr1));
    var filterDefsForDistRangesByUsageParameter1 =
        Map.of(FilterDefinitionUsage.FK, List.of(fdIdFdR));
    var filterDefsForDistRangesByUsageParameter2 = Map.of(FD1.getUniqueIdentifier(), FD1);
    // Note Builder merge tested in the unit test testBuilderCollector()
    return Stream.of(
        Arguments.arguments(new Builder(), new FilterDefsForDistRangesByUsage(Map.of(), Map.of())),
        Arguments.arguments(
            new Builder().withEntry(mapWithFdfDrId1.entrySet().stream().findAny().get()),
            new FilterDefsForDistRangesByUsage(
                filterDefsForDistRangesByUsageParameter1,
                filterDefsForDistRangesByUsageParameter2)));
  }

  @Test
  void testBuilderCollector() {

    var dr1 = new DistanceRangeDeg(0, 90);
    var dr2 = new DistanceRangeDeg(90, 180);

    // FD IDs for Distance Ranges
    var fdForDr1 = new FilterDefinitionForDistanceRange(FD1, Optional.of(dr1));
    var fdForDr2 = new FilterDefinitionForDistanceRange(FD2, Optional.of(dr2));

    // FD ID by Usage Maps to collect
    var fdByUsageMaps =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(fdForDr1),
            FilterDefinitionUsage.DETECTION,
            List.of(fdForDr2));

    var temp = new FilterDefinitionIdForDistanceRange(FD1.getUniqueIdentifier(), Optional.of(dr1));
    var temp2 = new FilterDefinitionIdForDistanceRange(FD2.getUniqueIdentifier(), Optional.of(dr2));
    var combinedFdByUsageMaps =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(temp),
            FilterDefinitionUsage.DETECTION,
            List.of(temp2));

    // // FD by ID Maps
    var combinedFdByIdMaps = Map.of(FD1.getUniqueIdentifier(), FD1, FD2.getUniqueIdentifier(), FD2);

    var expectedFilterDefsForDistRangesByUsage =
        new FilterDefsForDistRangesByUsage(combinedFdByUsageMaps, combinedFdByIdMaps);
    var seq =
        assertDoesNotThrow(
            () ->
                fdByUsageMaps.entrySet().stream()
                    .collect(FilterDefsForDistRangesByUsage.toFilterDefsForDistRangesByUsage()));

    var parallel =
        assertDoesNotThrow(
            () ->
                fdByUsageMaps.entrySet().stream()
                    .collect(FilterDefsForDistRangesByUsage.toFilterDefsForDistRangesByUsage()));

    assertEquals(expectedFilterDefsForDistRangesByUsage, seq);
    assertEquals(expectedFilterDefsForDistRangesByUsage, seq);
    assertEquals(seq, parallel);
  }
}
