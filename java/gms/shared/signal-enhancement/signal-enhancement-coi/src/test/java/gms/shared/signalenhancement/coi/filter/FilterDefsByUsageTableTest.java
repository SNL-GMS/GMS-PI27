package gms.shared.signalenhancement.coi.filter;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import com.google.common.collect.Tables;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable.Builder;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable.TableCell;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.signalenhancement.coi.utils.ChannelComponents;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

class FilterDefsByUsageTableTest {
  private static final FilterDefinition FD1 =
      FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL;
  private static final FilterDefinition FD2 =
      FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL;
  private static final FilterDefinitionIdForDistanceRange FD_ID_FOR_DR1 =
      new FilterDefinitionIdForDistanceRange(FD1.getUniqueIdentifier());
  private static final FilterDefinitionIdForDistanceRange FD_ID_FOR_DR2 =
      new FilterDefinitionIdForDistanceRange(FD2.getUniqueIdentifier());

  @ParameterizedTest
  @MethodSource("tableValidationSource")
  void testValidation(
      Table<String, PhaseType, Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
          filterDefinitionIdsByUsage,
      Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>> globalDefaults,
      Map<UUID, FilterDefinition> filterDefinitionsById,
      Class<? extends Throwable> expectedException) {

    if (expectedException != null) {
      assertThrows(
          expectedException,
          () ->
              new FilterDefsByUsageTable(
                  filterDefinitionIdsByUsage, globalDefaults, filterDefinitionsById));
    } else {
      assertDoesNotThrow(
          () ->
              new FilterDefsByUsageTable(
                  filterDefinitionIdsByUsage, globalDefaults, filterDefinitionsById));
    }
  }

  private static Stream<Arguments> tableValidationSource() {
    Supplier<
            ImmutableTable.Builder<
                String,
                PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>>
        tableBuilderSupplier =
            () ->
                ImmutableTable
                    .<String, PhaseType,
                        Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                        builder();

    var tableWithFdId1 =
        tableBuilderSupplier
            .get()
            .put(
                Tables.immutableCell(
                    "TEST", PhaseType.P, Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1))))
            .build();
    var tableWithFdId2 =
        tableBuilderSupplier
            .get()
            .put(
                Tables.immutableCell(
                    "TEST", PhaseType.P, Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR2))))
            .build();
    var tableWithFdIdsNoDuplicates =
        tableBuilderSupplier
            .get()
            .put(
                Tables.immutableCell(
                    "TEST",
                    PhaseType.P,
                    Map.of(
                        FilterDefinitionUsage.FK,
                        List.of(FD_ID_FOR_DR1),
                        FilterDefinitionUsage.DETECTION,
                        List.of(FD_ID_FOR_DR2))))
            .build();
    var tableWithFdIdsDuplicates =
        tableBuilderSupplier
            .get()
            .put(
                Tables.immutableCell(
                    "TEST",
                    PhaseType.P,
                    Map.of(
                        FilterDefinitionUsage.FK,
                        List.of(FD_ID_FOR_DR1),
                        FilterDefinitionUsage.DETECTION,
                        List.of(FD_ID_FOR_DR2),
                        FilterDefinitionUsage.ONSET,
                        List.of(FD_ID_FOR_DR2))))
            .build();
    var mapWithFdId1 = Map.of(FD1.getUniqueIdentifier(), FD1);
    var mapWithFdId2 = Map.of(FD2.getUniqueIdentifier(), FD2);
    var mapWithFdIds =
        Map.of(
            FD1.getUniqueIdentifier(),
            Mockito.mock(FilterDefinition.class),
            FD2.getUniqueIdentifier(),
            Mockito.mock(FilterDefinition.class));

    var globalDefaultsMap = Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1));

    var globalDefaultsMap2 = Map.of(FilterDefinitionUsage.DETECTION, List.of(FD_ID_FOR_DR2));

    var globalDefaultsMapAll =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(FD_ID_FOR_DR1),
            FilterDefinitionUsage.DETECTION,
            List.of(FD_ID_FOR_DR2));

    return Stream.of(
        // Happy path tests below
        Arguments.arguments(tableWithFdId1, globalDefaultsMap, mapWithFdId1, null),
        Arguments.arguments(tableWithFdId2, globalDefaultsMap2, mapWithFdId2, null),
        Arguments.arguments(tableWithFdIdsNoDuplicates, globalDefaultsMapAll, mapWithFdIds, null),
        Arguments.arguments(tableWithFdIdsDuplicates, globalDefaultsMapAll, mapWithFdIds, null),
        Arguments.arguments(
            ImmutableTable.builder().build(),
            globalDefaultsMap,
            Map.of(FD1.getUniqueIdentifier(), FD1),
            null),
        // Failure tests below
        // table and FD map do not share FD Ids
        Arguments.arguments(
            tableWithFdId1, globalDefaultsMap, mapWithFdId2, IllegalArgumentException.class),
        // Global default missing FD ID from FD Map
        Arguments.arguments(
            ImmutableTable.builder().build(),
            globalDefaultsMap,
            mapWithFdIds,
            IllegalArgumentException.class),
        // FD Map is completly missing
        Arguments.arguments(
            tableWithFdIdsNoDuplicates,
            globalDefaultsMap,
            Map.of(),
            IllegalArgumentException.class),
        // Non empty FD Map is missing values from global defaults and table
        Arguments.arguments(
            tableWithFdIdsNoDuplicates,
            globalDefaultsMap,
            mapWithFdId1,
            IllegalArgumentException.class),
        // globals map is empty
        Arguments.arguments(tableWithFdId1, Map.of(), mapWithFdIds, IllegalArgumentException.class),
        // global map is null
        Arguments.arguments(tableWithFdId1, null, mapWithFdIds, NullPointerException.class));
  }

  @ParameterizedTest
  @MethodSource("tableBuilderValidationSource")
  void testBuilderValidation(Builder tableBuilder, FilterDefsByUsageTable expected) {
    assertDoesNotThrow(
        () -> {
          var table = tableBuilder.build();
          assertEquals(expected, table);
        });
  }

  private static Stream<Arguments> tableBuilderValidationSource() {

    var mapWithFdId1 = Map.of(FD1.getUniqueIdentifier(), FD1);
    var mapWithFdId2 = Map.of(FD2.getUniqueIdentifier(), FD2);
    var mapWithBothFds = Map.of(FD1.getUniqueIdentifier(), FD1, FD2.getUniqueIdentifier(), FD2);
    var globalDefaultsMap = Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1));
    var globalDefaults =
        new FilterDefsForDistRangesByUsage(
            Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1)),
            Map.of(FD1.getUniqueIdentifier(), FD1));

    var globalDefaultsMap2 = Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR2));
    var globalDefaults2 =
        new FilterDefsForDistRangesByUsage(
            Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR2)),
            Map.of(FD2.getUniqueIdentifier(), FD2));
    var cell1 =
        Tables.immutableCell(
            "TEST", PhaseType.P, Map.of(FilterDefinitionUsage.FK, List.of(FD_ID_FOR_DR1)));
    var tableCell1 = new TableCell(cell1, mapWithFdId1);

    var cell2 =
        Tables.immutableCell(
            "TEST",
            PhaseType.P3KP,
            Map.of(FilterDefinitionUsage.DETECTION, List.of(FD_ID_FOR_DR2)));

    var tableCell2 = new TableCell(cell2, mapWithFdId2);

    var expectedTable2 =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                builder()
            .put(cell1)
            .build();

    var expectedTable3 =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                builder()
            .put(cell1)
            .put(cell2)
            .build();

    var exp1 = new FilterDefsByUsageTable(expectedTable2, globalDefaultsMap, mapWithFdId1);
    var exp2 = new FilterDefsByUsageTable(expectedTable3, globalDefaultsMap, mapWithBothFds);
    var exp3 = new FilterDefsByUsageTable(expectedTable2, globalDefaultsMap2, mapWithBothFds);

    return Stream.of(
        Arguments.arguments(
            new Builder().withGlobalDefaults(globalDefaults),
            new FilterDefsByUsageTable(
                ImmutableTable
                    .<String, PhaseType,
                        Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                        builder()
                    .build(),
                globalDefaults.filterDefIdsForDistanceRangesByUsage(),
                Map.of(FD1.getUniqueIdentifier(), FD1))),
        Arguments.arguments(
            new Builder().withCell(tableCell1).withGlobalDefaults(globalDefaults), exp1),
        Arguments.arguments(
            new Builder()
                .withCell(tableCell1)
                .withGlobalDefaults(globalDefaults)
                .combine(new Builder().withCell(tableCell2).withGlobalDefaults(globalDefaults)),
            exp2),
        Arguments.arguments(
            new Builder()
                .withCell(tableCell1)
                .withGlobalDefaults(globalDefaults)
                .withGlobalDefaults(globalDefaults2),
            exp3));
  }

  @Test
  void testBuilderCollector() {

    // Channel Components
    var cc1 = ChannelComponents.fromChannelName("STA.STA1.BHZ");
    var cc2 = ChannelComponents.fromChannelName("STA.STA2.BHZ");

    // DistanceRanges
    var dr1 = new DistanceRangeDeg(0, 90);
    var dr2 = new DistanceRangeDeg(90, 180);

    // FD IDs for Distance Ranges
    var fdForDr1 = new FilterDefinitionIdForDistanceRange(FD1.getUniqueIdentifier(), dr1);
    var fdForDr2 = new FilterDefinitionIdForDistanceRange(FD2.getUniqueIdentifier(), dr2);

    // FD ID by Usage Maps
    var fdByUsageMap1 = Map.of(FilterDefinitionUsage.FK, List.of(fdForDr1));
    var fdByUsageMap2 = Map.of(FilterDefinitionUsage.DETECTION, List.of(fdForDr2));

    // FD by ID Maps
    var fdByIdMap1 = Map.of(FD1.getUniqueIdentifier(), FD1);
    var fdByIdMap2 = Map.of(FD2.getUniqueIdentifier(), FD2);

    var fdForDrByUsage1 = new FilterDefsForDistRangesByUsage(fdByUsageMap1, fdByIdMap1);
    var fdForDrByUsage2 = new FilterDefsForDistRangesByUsage(fdByUsageMap2, fdByIdMap2);

    var globalDefaultsMap =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(FD_ID_FOR_DR1),
            FilterDefinitionUsage.DETECTION,
            List.of(FD_ID_FOR_DR2));

    var globalDefaultFd =
        new FilterDefsForDistRangesByUsage(
            globalDefaultsMap,
            Map.of(FD1.getUniqueIdentifier(), FD1, FD2.getUniqueIdentifier(), FD2));

    // Table cells
    var tc1 = new TableCell(cc1, PhaseType.P, fdForDrByUsage1);
    var tc2 = new TableCell(cc1, PhaseType.S, fdForDrByUsage2);
    var tc3 = new TableCell(cc2, PhaseType.P, fdForDrByUsage2);

    var cells = List.of(tc1, tc2, tc3);

    var expectedTable =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                builder()
            .put(cc1.channelName(), PhaseType.P, fdByUsageMap1)
            .put(cc1.channelName(), PhaseType.S, fdByUsageMap2)
            .put(cc2.channelName(), PhaseType.P, fdByUsageMap2)
            .build();
    var expectedFdByIdMap = Map.of(FD1.getUniqueIdentifier(), FD1, FD2.getUniqueIdentifier(), FD2);

    var seq =
        assertDoesNotThrow(
            () ->
                cells.stream()
                    .collect(FilterDefsByUsageTable.Builder.toBuilder())
                    .withGlobalDefaults(globalDefaultFd)
                    .build());
    var parallel =
        assertDoesNotThrow(
            () ->
                cells.parallelStream()
                    .collect(FilterDefsByUsageTable.Builder.toBuilder())
                    .withGlobalDefaults(globalDefaultFd)
                    .build());

    assertEquals(expectedTable, seq.filterDefinitionIdsByUsage());
    assertEquals(expectedFdByIdMap, seq.filterDefinitionsById());
    assertEquals(seq, parallel);
  }
}
