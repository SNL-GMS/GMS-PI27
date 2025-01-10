package gms.shared.event.analysis;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.event.coi.ScalingFactorType;
import java.util.Objects;
import javax.annotation.Nullable;
import org.apache.commons.math3.util.Precision;

/**
 * Value class for storing the parameters necessary to calculate the location uncertainty {@link
 * Ellipse}s/{@link Ellipsoid}s. Each element in the LocationUncertaintyDefinition collection
 * represents a single error {@link Ellipse} or {@link Ellipsoid} the client requests the
 * EventRelocationControl to compute.
 */
public record LocationUncertaintyDefinition(
    @Nullable Double aprioriStandardError,
    boolean ellipsoid,
    double kWeight,
    double confidenceLevel,
    ScalingFactorType scalingFactorType) {

  private static final double MIN_ERROR = 0.0;
  private static final double MAX_ERROR = 1_000.0;
  private static final double MIN_WEIGHT = 0.0;
  private static final double MAX_WEIGHT = Double.POSITIVE_INFINITY;
  private static final double MIN_CONFIDENCE = 0.0;
  private static final double MAX_CONFIDENCE = 1.0;

  private static final String ERROR_ERROR_MSG =
      "aprioriStandardError must be in the range [0.0, 1_000.0]";
  private static final String WEIGHT_ERROR_MSG = "kWeight must be in the range [0.0, +inf]";
  private static final String CONFIDENCE_ERROR_MSG =
      "confidenceLevel must be in the range [0.0, 1.0]";
  private static final String WEIGHT_CONFIDENCE_ERROR_MSG =
      "kWeight must be 0.0 when scalingFactorType is CONFIDENCE";
  private static final String WEIGHT_COVERAGE_ERROR_MSG =
      "kWeight must be +inf when scalingFactorType is COVERAGE";
  private static final String WEIGHT_WEIGHTED_ERROR_MSG =
      "kWeight must be in the range (0.0, +inf) when scalingFactorType is K_WEIGHTED";
  private static final String WEIGHT_ZERO_ERROR_PRESENT =
      "aprioriStandardError should only be set if kWeight > 0";
  private static final String WEIGHT_NONZERO_ERROR_NOT_PRESENT =
      "aprioriStandardError must be set if kWeight > 0";

  /**
   * Value class for storing the parameters necessary to calculate the location uncertainty {@link
   * Ellipse}s/{@link Ellipsoid}s. Each element in the LocationUncertaintyDefinition collection
   * represents a single error {@link Ellipse} or {@link Ellipsoid} the client requests the
   * EventRelocationControl to compute.
   *
   * @param aprioriStandardError the a priori standard error scale factor; represents test estimated
   *     ratio between the true and actual data standard errors; in range [0.0, 1000.0]
   * @param ellipsoid indicates if an {@link Ellipsoid} (true) or {@link Ellipse} (false) is to be
   *     calculated
   * @param kWeight indicates how the {@link Ellipse}/{@link Ellipsoid} was computed as a weighted
   *     combination of a priori and a posteriori scaling factors; in range [0.0, +inf]; 0.0 when
   *     scalingFactorType is CONFIDENCE; +inf when scalingFactorType is COVERAGE; in (0.0, +inf)
   *     when scalingFactorType is K_WEIGHTED
   * @param confidenceLevel the confidence level used to scale the {@link Ellipse}/{@link
   *     Ellipsoid}; in range [0.0, 1.0]
   * @param scalingFactorType specifies the {@link ScalingFactorType}
   */
  public LocationUncertaintyDefinition {
    Preconditions.checkArgument(
        Range.closed(MIN_WEIGHT, MAX_WEIGHT).contains(kWeight), WEIGHT_ERROR_MSG);
    Preconditions.checkArgument(
        Range.closed(MIN_CONFIDENCE, MAX_CONFIDENCE).contains(confidenceLevel),
        CONFIDENCE_ERROR_MSG);

    switch (scalingFactorType) {
      case CONFIDENCE -> {
        Preconditions.checkArgument(
            Objects.isNull(aprioriStandardError), WEIGHT_ZERO_ERROR_PRESENT);
        Preconditions.checkArgument(
            Precision.equals(kWeight, MIN_WEIGHT), WEIGHT_CONFIDENCE_ERROR_MSG);
      }
      case COVERAGE -> {
        Preconditions.checkArgument(
            Precision.equals(kWeight, MAX_WEIGHT), WEIGHT_COVERAGE_ERROR_MSG);
        Preconditions.checkNotNull(aprioriStandardError, WEIGHT_NONZERO_ERROR_NOT_PRESENT);
        Preconditions.checkArgument(
            Range.closed(MIN_ERROR, MAX_ERROR).contains(aprioriStandardError), ERROR_ERROR_MSG);
      }
      case K_WEIGHTED -> {
        Preconditions.checkArgument(
            Range.open(MIN_WEIGHT, MAX_WEIGHT).contains(kWeight), WEIGHT_WEIGHTED_ERROR_MSG);
        Preconditions.checkNotNull(aprioriStandardError, WEIGHT_NONZERO_ERROR_NOT_PRESENT);
        Preconditions.checkArgument(
            Range.closed(MIN_ERROR, MAX_ERROR).contains(aprioriStandardError), ERROR_ERROR_MSG);
      }
      default -> throw new IllegalArgumentException(
          "Unknown ScalingFactorType: " + scalingFactorType);
    }
  }

  public static LocationUncertaintyDefinition.Builder builder() {
    return new AutoBuilder_LocationUncertaintyDefinition_Builder();
  }

  public static LocationUncertaintyDefinition.Builder builder(LocationUncertaintyDefinition lud) {
    return new AutoBuilder_LocationUncertaintyDefinition_Builder(lud);
  }

  public LocationUncertaintyDefinition.Builder toBuilder() {
    return new AutoBuilder_LocationUncertaintyDefinition_Builder(this);
  }

  @AutoBuilder
  public interface Builder {

    /**
     * The a priori standard error scale factor; represents test estimated ratio between the true
     * and actual data standard errors; in range [0.0, 1000.0]
     */
    Builder setAprioriStandardError(double aprioriStandardError);

    /** Indicates if an {@link Ellipsoid} (true) or {@link Ellipse} (false) is to be calculated */
    Builder setEllipsoid(boolean ellipsoid);

    /**
     * Indicates how the {@link Ellipse}(oid) was computed as a weighted combination of a priori and
     * a posteriori scaling factors; in range [0.0, +inf]; 0.0 when scalingFactorType is CONFIDENCE;
     * +inf when scalingFactorType is COVERAGE; in (0.0, +inf) when scalingFactorType is K_WEIGHTED
     */
    Builder setKWeight(double kWeight);

    /** The confidence level used to scale the {@link Ellipse}(oid); in range [0.0, 1.0] */
    Builder setConfidenceLevel(double confidenceLevel);

    /** Specifies the {@link ScalingFactorType} */
    Builder setScalingFactorType(ScalingFactorType scalingFactorType);

    LocationUncertaintyDefinition build();
  }
}
