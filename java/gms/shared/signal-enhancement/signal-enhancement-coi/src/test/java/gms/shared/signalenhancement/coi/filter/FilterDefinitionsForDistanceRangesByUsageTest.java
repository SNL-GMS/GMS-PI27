package gms.shared.signalenhancement.coi.filter;

import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FilterDefinitionsForDistanceRangesByUsageTest {

  @ParameterizedTest
  @MethodSource("tableValidationSource")
  void testValidation(
      Map<FilterDefinitionUsage, List<FilterDefinitionForDistanceRange>> filterDefinitionIdsByUsage,
      Class<? extends Throwable> expectedException) {

    if (expectedException == null) {
      Assertions.assertDoesNotThrow(
          () -> new FilterDefinitionsForDistanceRangesByUsage(filterDefinitionIdsByUsage));
    } else {
      Assertions.assertThrows(
          expectedException,
          () -> new FilterDefinitionsForDistanceRangesByUsage(filterDefinitionIdsByUsage));
    }
  }

  private static Stream<Arguments> tableValidationSource() {

    var fd0to50 = createDefaultFilterDefinitionForDistanceRange(new DistanceRangeDeg(0, 50));
    var fd50to100 = createDefaultFilterDefinitionForDistanceRange(new DistanceRangeDeg(50, 100));
    var fd100to180 = createDefaultFilterDefinitionForDistanceRange(new DistanceRangeDeg(100, 180));
    var fd60to110 = createDefaultFilterDefinitionForDistanceRange(new DistanceRangeDeg(60, 110));

    var fdUnconstrained =
        new FilterDefinitionForDistanceRange(
            FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    var happyPathconstrainedSingle = Map.of(FilterDefinitionUsage.FK, List.of(fd0to50));
    var happyPathUnconstrained = Map.of(FilterDefinitionUsage.FK, List.of(fdUnconstrained));
    var happyPathConstrainedNoOverlaps =
        Map.of(FilterDefinitionUsage.FK, List.of(fd0to50, fd50to100, fd100to180));
    var happyPathConstrainedNoOverlapsDifferentKeys =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(fd0to50, fd100to180),
            FilterDefinitionUsage.DETECTION,
            List.of(fd50to100));
    var shouldFailUnconstrainedMultiple =
        Map.of(FilterDefinitionUsage.FK, List.of(fdUnconstrained, fdUnconstrained));
    var shouldFailConstrainedUnconstrained =
        Map.of(FilterDefinitionUsage.FK, List.of(fd0to50, fdUnconstrained));
    var shouldFailOverlapped =
        Map.of(FilterDefinitionUsage.FK, List.of(fd60to110, fd50to100, fd100to180));

    return Stream.of(
        Arguments.arguments(happyPathconstrainedSingle, null),
        Arguments.arguments(happyPathUnconstrained, null),
        Arguments.arguments(happyPathConstrainedNoOverlaps, null),
        Arguments.arguments(happyPathConstrainedNoOverlapsDifferentKeys, null),
        Arguments.arguments(shouldFailUnconstrainedMultiple, IllegalArgumentException.class),
        Arguments.arguments(shouldFailConstrainedUnconstrained, IllegalArgumentException.class),
        Arguments.arguments(shouldFailOverlapped, IllegalArgumentException.class),
        Arguments.arguments(Map.of(), IllegalArgumentException.class),
        Arguments.arguments(
            Map.of(FilterDefinitionUsage.FK, List.of()), IllegalArgumentException.class),
        Arguments.arguments(null, NullPointerException.class));
  }

  private static FilterDefinitionForDistanceRange createDefaultFilterDefinitionForDistanceRange(
      DistanceRangeDeg distanceRage) {
    return new FilterDefinitionForDistanceRange(
        FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL, distanceRage);
  }
}
