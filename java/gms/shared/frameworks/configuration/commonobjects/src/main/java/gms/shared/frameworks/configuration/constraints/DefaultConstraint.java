package gms.shared.frameworks.configuration.constraints;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.auto.value.AutoValue;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.ConstraintType;
import gms.shared.frameworks.configuration.Operator;
import gms.shared.frameworks.configuration.Operator.Type;

/**
 * {@link Constraint} used to indicate when a {@link ConfigurationOption} provides default values.
 * Is satisfied by any selector value.
 */
@AutoValue
@JsonIgnoreProperties({"operator", "value", "criterion", "priority"})
public abstract class DefaultConstraint implements Constraint<String, Object> {

  // TODO: this is essentially a constraint that labels a ConfigurationOption as $default.  Could
  // replace with a LabelConstraint class if other labels become useful.

  /** Criterion used by all {@link DefaultConstraint}s */
  public static final String CRITERION = "$default";

  private static DefaultConstraint defaultConstraint = singleInstance();

  /**
   * Obtains a {@link DefaultConstraint}
   *
   * @return {@link DefaultConstraint}, not null
   */
  @JsonCreator
  public static DefaultConstraint from() {
    return defaultConstraint;
  }

  private static DefaultConstraint singleInstance() {
    return new AutoValue_DefaultConstraint(
        ConstraintType.DEFAULT, CRITERION, Operator.from(Type.EQ, false), 0, "-");
  }

  /**
   * {@link DefaultConstraint} is satisfied by any selector value
   *
   * @param queryVal selector query value
   * @return true
   */
  @Override
  public boolean test(Object queryVal) {
    return true;
  }
}
