package gms.shared.frameworks.configuration.constraints;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import com.google.common.math.DoubleMath;
import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.ConstraintType;
import gms.shared.frameworks.configuration.Operator;
import gms.shared.frameworks.configuration.Operator.Type;
import java.util.Objects;

/**
 * {@link Constraint} with a double value and satisfied by exact equality with a double selector.
 * See {@link NumericRangeConstraint} for a constraint capable of performing a fuzzy equality check.
 */
@AutoValue
public abstract class NumericScalarConstraint implements Constraint<Number, Number> {

  private static final double TOLERANCE = 1.0e-16;

  /**
   * Obtains a new {@link NumericScalarConstraint} with the provided criterion, operator, value, and
   * priority
   *
   * @param criterion String criterion, not null
   * @param operator {@link Operator}, must have type {@link Type#EQ}, not null
   * @param value double constraint value
   * @param priority priority, larger numbers take precedence over smaller numbers
   * @return {@link NumericScalarConstraint}, not null
   * @throws NullPointerException if criterion or operator are null
   * @throws IllegalArgumentException if operator does not have type {@link Type#EQ}
   */
  @JsonCreator
  public static NumericScalarConstraint from(
      @JsonProperty("criterion") String criterion,
      @JsonProperty("operator") Operator operator,
      @JsonProperty("value") double value,
      @JsonProperty("priority") long priority) {

    Operator.assertValidOperatorType(operator, Type.EQ);

    return new AutoValue_NumericScalarConstraint(
        ConstraintType.NUMERIC_SCALAR, criterion, operator, priority, value);
  }

  /**
   * Determines whether the provided Double selector satisfies this {@link
   * NumericScalarConstraint#getOperator()} and {@link NumericScalarConstraint#getValue()}. If the
   * Operator is not negated the Constraint is satisfied when the selector is exactly equal to the
   * Constraint's value. If the Operator is negated the Constraint is satisfied when selector is not
   * exactly equal to the Constraint's value.
   *
   * @param selector double value, not null
   * @return true if selector satisfies this constraint and false otherwise
   * @throws NullPointerException if selector is null
   */
  @Override
  public boolean test(Number selector) {
    Objects.requireNonNull(selector, "selector can't be null");

    Double val = selector.doubleValue();
    // Factory operation guarantees operator type is Type.EQ
    if (getOperator().getType() == Type.EQ) {
      return getOperator().truth(DoubleMath.fuzzyEquals(val, (double) getValue(), TOLERANCE));
    } else {
      return false;
    }
  }
}
