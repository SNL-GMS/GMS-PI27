package gms.shared.frameworks.configuration.constraints;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.Operator;
import gms.shared.frameworks.configuration.Operator.Type;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class NumericScalarConstraintTest {

  @Test
  void testSerialization() throws Exception {
    Operator operator = Operator.from(Type.EQ, false);
    var constraint = NumericScalarConstraint.from("sta", operator, 5.0, 100);
    JsonTestUtilities.assertSerializes(constraint, Constraint.class);
  }

  @Test
  void testFromValidatesArguments() {
    Operator inOp = Operator.from(Type.IN, false);

    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class,
            () -> NumericScalarConstraint.from("snr", inOp, 5.0, 1));
    assertTrue(e.getMessage().contains("Operator Type: IN is not supported"));
  }

  @Test
  void testIsSatisfied() {
    final double value = 5.0;
    final Operator operator = Operator.from(Type.EQ, false);
    final NumericScalarConstraint scalar = NumericScalarConstraint.from("snr", operator, value, 1);

    assertAll(
        () -> assertTrue(scalar.test(value)),
        () -> assertFalse(scalar.test(value + 1.0)),
        () -> assertFalse(scalar.test(value - 1.0e-15)));
  }

  @Test
  void testIsSatisfiedValidatesParameter() {
    NumericScalarConstraint numConstraint =
        NumericScalarConstraint.from("snr", Operator.from(Type.EQ, false), 5.0, 1);
    NullPointerException e =
        assertThrows(NullPointerException.class, () -> numConstraint.test(null));

    assertTrue(e.getMessage().contains("selector can't be null"));
  }
}
