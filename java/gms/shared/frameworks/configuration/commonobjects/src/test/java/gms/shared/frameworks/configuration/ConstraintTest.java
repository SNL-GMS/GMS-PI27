package gms.shared.frameworks.configuration;

import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.Operator.Type;
import gms.shared.frameworks.configuration.constraints.BooleanConstraint;
import gms.shared.frameworks.configuration.constraints.DefaultConstraint;
import gms.shared.frameworks.configuration.constraints.DoubleRange;
import gms.shared.frameworks.configuration.constraints.NumericRangeConstraint;
import gms.shared.frameworks.configuration.constraints.NumericScalarConstraint;
import gms.shared.frameworks.configuration.constraints.PhaseConstraint;
import gms.shared.frameworks.configuration.constraints.StringConstraint;
import gms.shared.frameworks.configuration.constraints.TimeOfDayRange;
import gms.shared.frameworks.configuration.constraints.TimeOfDayRangeConstraint;
import gms.shared.frameworks.configuration.constraints.TimeOfYearRange;
import gms.shared.frameworks.configuration.constraints.TimeOfYearRangeConstraint;
import gms.shared.frameworks.configuration.constraints.WildcardConstraint;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ConstraintTest {

  /** Verifies each ConstraintType can be deserialized */
  @Test
  void testSerialization() {

    // Make sure each ConstraintType is in the map
    final EnumMap<ConstraintType, Constraint> constraintsByType = createConstraintsByTypeMap();
    assertTrue(Arrays.stream(ConstraintType.values()).allMatch(constraintsByType::containsKey));

    // Make sure each Constraint in the map can be round-trip serialized and deserialized
    constraintsByType
        .values()
        .forEach(c -> JsonTestUtilities.assertSerializes(c, Constraint.class));
  }

  private EnumMap<ConstraintType, Constraint> createConstraintsByTypeMap() {
    final EnumMap<ConstraintType, Constraint> byType = new EnumMap<>(ConstraintType.class);

    byType.put(ConstraintType.BOOLEAN, BooleanConstraint.from("A", false, 100));

    byType.put(ConstraintType.DEFAULT, DefaultConstraint.from());

    byType.put(
        ConstraintType.NUMERIC_RANGE,
        NumericRangeConstraint.from(
            "A", Operator.from(Type.IN, false), DoubleRange.from(1D, 2D), 100));

    byType.put(
        ConstraintType.NUMERIC_SCALAR,
        NumericScalarConstraint.from("A", Operator.from(Type.EQ, false), 10, 100));

    byType.put(
        ConstraintType.PHASE,
        PhaseConstraint.from("A", Operator.from(Type.IN, false), Set.of(PhaseType.Lg), 100));

    byType.put(
        ConstraintType.STRING,
        StringConstraint.from("A", Operator.from(Type.IN, false), Set.of("P", "Lg", "S"), 100));

    byType.put(
        ConstraintType.TIME_OF_DAY_RANGE,
        TimeOfDayRangeConstraint.from(
            "A",
            Operator.from(Type.IN, false),
            TimeOfDayRange.from(LocalTime.MIN, LocalTime.MAX),
            100));

    byType.put(
        ConstraintType.TIME_OF_YEAR_RANGE,
        TimeOfYearRangeConstraint.from(
            "A",
            Operator.from(Type.IN, false),
            TimeOfYearRange.from(LocalDateTime.MIN, LocalDateTime.MAX),
            100));

    byType.put(ConstraintType.WILDCARD, WildcardConstraint.from("A"));

    return byType;
  }
}
