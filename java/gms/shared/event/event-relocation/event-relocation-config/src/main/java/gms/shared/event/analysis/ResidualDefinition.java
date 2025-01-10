package gms.shared.event.analysis;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import java.util.Objects;
import javax.annotation.Nullable;

/**
 * Value class for storing the residual parameters for a {@link EventRelocationProcessingDefinition}
 */
public record ResidualDefinition(
    boolean allowBigResidual, @Nullable Double maxFraction, @Nullable Double bigResidualThreshold) {

  private static final double MIN_FRACTION = 0.0;
  private static final double MAX_FRACTION = 1.0;
  private static final double MIN_THRESHOLD = 0.0;
  private static final double MAX_THRESHOLD = 100_000.0;
  private static final String FRACTION_ERROR_MSG =
      "bigResidualThreshold must be in the range [0.0, 1.0]";
  private static final String THRESHOLD_ERROR_MSG =
      "bigResidualMaxThreshold must be in the range [0.0, 100_000.0]";
  private static final String ALLOW_BIG_RESIDUAL_TRUE_NULL_MAX_FRACTION_ERROR_MSG =
      "maxFraction must not be null if allowBigResidual is true";
  private static final String ALLOW_BIG_RESIDUAL_TRUE_NULL_BIG_RESIDUAL_THRESHOLD_ERROR_MSG =
      "bigResidualThreshold must not be null if allowBigResidual is true";
  private static final String ALLOW_BIG_RESIDUAL_FALSE_MAX_FRACTION_ERROR_MSG =
      "maxFraction must be null if allowBigResidual is false";
  private static final String ALLOW_BIG_RESIDUAL_FALSE_BIG_RESIDUAL_THRESHOLD_ERROR_MSG =
      "bigResidualThreshold must be null if allowBigResidual is false";

  /**
   * Value class for storing the residual parameters for a {@link
   * EventRelocationProcessingDefinition}
   *
   * @param allowBigResidual whether the {@link EventRelocatorPlugin} implementation uses defining
   *     {@link FeatureMeasurement} objects with big residual values
   * @param maxFraction constrains the maximum fraction of non-defining {@link FeatureMeasurement}
   *     objects; in the range [0.0, 1.0]; null when allowBigResidual is false
   * @param bigResidualThreshold threshold weighted residual value above which the {@link
   *     EventRelocatorPlugin} implementation flags a {@link FeatureMeasurement} as having a big
   *     residual; in the range [0.0, 100_000.0]; null when allowBigResidual is false
   */
  public ResidualDefinition {
    if (allowBigResidual) {
      Preconditions.checkNotNull(maxFraction, ALLOW_BIG_RESIDUAL_TRUE_NULL_MAX_FRACTION_ERROR_MSG);
      Preconditions.checkNotNull(
          bigResidualThreshold, ALLOW_BIG_RESIDUAL_TRUE_NULL_BIG_RESIDUAL_THRESHOLD_ERROR_MSG);

      Preconditions.checkArgument(
          Range.closed(MIN_FRACTION, MAX_FRACTION).contains(maxFraction), FRACTION_ERROR_MSG);
      Preconditions.checkArgument(
          Range.closed(MIN_THRESHOLD, MAX_THRESHOLD).contains(bigResidualThreshold),
          THRESHOLD_ERROR_MSG);
    } else {
      Preconditions.checkArgument(
          Objects.isNull(maxFraction), ALLOW_BIG_RESIDUAL_FALSE_MAX_FRACTION_ERROR_MSG);
      Preconditions.checkArgument(
          Objects.isNull(bigResidualThreshold),
          ALLOW_BIG_RESIDUAL_FALSE_BIG_RESIDUAL_THRESHOLD_ERROR_MSG);
    }
  }

  public static ResidualDefinition.Builder builder() {
    return new AutoBuilder_ResidualDefinition_Builder();
  }

  public static ResidualDefinition.Builder builder(ResidualDefinition rd) {
    return new AutoBuilder_ResidualDefinition_Builder(rd);
  }

  public ResidualDefinition.Builder toBuilder() {
    return new AutoBuilder_ResidualDefinition_Builder(this);
  }

  @AutoBuilder
  public interface Builder {

    /**
     * Whether the {@link EventRelocatorPlugin} implementation uses defining {@link
     * FeatureMeasurement} objects with big residual values
     */
    Builder setAllowBigResidual(boolean allowBigResidual);

    /**
     * Constrains the maximum fraction of non-defining {@link FeatureMeasurement} objects; in the
     * range [0.0, 1.0]; must be null when allowBigResidual is false
     */
    Builder setMaxFraction(@Nullable Double maxFraction);

    /**
     * Threshold weighted residual value above which the {@link EventRelocatorPlugin} implementation
     * flags a {@link FeatureMeasurement} as having a big residual; in the range [0.0, 100_000.0];
     * must be null when allowBigResidual is false
     */
    Builder setBigResidualThreshold(@Nullable Double bigResidualThreshold);

    ResidualDefinition build();
  }
}
