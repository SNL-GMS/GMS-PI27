package gms.shared.frameworks.configuration;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.frameworks.configuration.Operator.Type;
import gms.shared.frameworks.configuration.constraints.NumericScalarConstraint;
import gms.shared.frameworks.configuration.constraints.StringConstraint;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ConfigurationOptionTest {

  @Test
  void testSerialization() throws Exception {
    final Constraint constraint =
        NumericScalarConstraint.from("sta", Operator.from(Type.EQ, false), 5.0, 100);
    final ConfigurationOption configurationOption =
        ConfigurationOption.from("SNR-10", List.of(constraint), Map.of("a", 10));

    JsonTestUtilities.assertSerializes(configurationOption, ConfigurationOption.class);
  }

  @Test
  void testFromVerifiesConstraintsHaveUniqueCriterions() {

    final Constraint constraintA =
        NumericScalarConstraint.from("sta", Operator.from(Type.EQ, false), 5.0, 100);
    final Constraint constraintB =
        NumericScalarConstraint.from("sta", Operator.from(Type.EQ, false), 10.0, 100);

    List<Constraint> constraintList = List.of(constraintA, constraintB);
    assertAll(
        // Validate parameters before usage
        () ->
            assertEquals(
                "constraints can't be null",
                assertThrows(
                        NullPointerException.class,
                        () -> ConfigurationOption.from("A", null, Collections.EMPTY_MAP))
                    .getMessage()),
        // Validate unique constraint criterions
        () ->
            assertEquals(
                "ConfigurationOption's Constraints must all have unique criterions but these"
                    + " criterions appear in multiple Constraints: [sta]",
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                            ConfigurationOption.from(
                                "SNR-10", constraintList, Collections.EMPTY_MAP))
                    .getMessage()));
  }

  @Test
  void testFromWithNullParameterValue() {
    final Constraint constraint =
        StringConstraint.from("sta", Operator.from(Type.EQ, false), Set.of("string"), 100);

    final Map<String, Object> parameters = new HashMap<>();
    parameters.put("a", null);
    assertDoesNotThrow(() -> ConfigurationOption.from("SNR-10", List.of(constraint), parameters));
  }
}
