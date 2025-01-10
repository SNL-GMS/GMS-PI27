package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.util.Optional;

/**
 * Defines the Ellipse class - represents a 2D projection of the {@link LocationUncertainty}
 * covariance matrix
 */
@AutoValue
@JsonSerialize(as = Ellipse.class)
@JsonDeserialize(builder = AutoValue_Ellipse.Builder.class)
public abstract class Ellipse {

  public abstract ScalingFactorType getScalingFactorType();

  public abstract double getkWeight();

  public abstract double getConfidenceLevel();

  public abstract Optional<Double> getSemiMajorAxisLengthKm();

  public abstract Optional<Double> getSemiMajorAxisTrendDeg();

  public abstract Optional<Double> getSemiMinorAxisLengthKm();

  public abstract Optional<Double> getDepthUncertaintyKm();

  public abstract Optional<Duration> getTimeUncertainty();

  public static Builder builder() {
    return new AutoValue_Ellipse.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private static final double DELTA = 0.0001;
    private static final double MIN_CONFIDENCE = 0.5;
    private static final double MAX_CONFIDENCE = 1.0;

    public abstract Builder setScalingFactorType(ScalingFactorType scalingFactorType);

    public abstract Builder setkWeight(double kWeight);

    public abstract Builder setConfidenceLevel(double confidenceLevel);

    public abstract Builder setSemiMajorAxisLengthKm(double semiMajorAxisLengthKm);

    public abstract Builder setSemiMajorAxisTrendDeg(double semiMajorAxisTrendDeg);

    public abstract Builder setSemiMinorAxisLengthKm(double semiMinorAxisLengthKm);

    public abstract Builder setDepthUncertaintyKm(double depthUncertaintyKm);

    public abstract Builder setTimeUncertainty(Duration timeUncertainty);

    protected abstract Ellipse autoBuild();

    public Ellipse build() {
      var ellipse = autoBuild();

      checkState(!Double.isNaN(ellipse.getkWeight()), "The validated kWeight is not a number");
      checkState(
          !Double.isNaN(ellipse.getConfidenceLevel()),
          "The validated confidenceLevel is not a number");

      ellipse
          .getSemiMajorAxisLengthKm()
          .ifPresent(
              smal ->
                  checkState(
                      !Double.isNaN(smal), "The validated semiMajorAxisLengthKm is not a number"));

      ellipse
          .getSemiMajorAxisTrendDeg()
          .ifPresent(
              smat ->
                  checkState(
                      !Double.isNaN(smat), "The validated semiMajorAxisTrendDeg is not a number"));

      ellipse
          .getSemiMinorAxisLengthKm()
          .ifPresent(
              smal ->
                  checkState(
                      !Double.isNaN(smal), "The validated semiMinorAxisLengthKm is not a number"));

      ellipse
          .getDepthUncertaintyKm()
          .ifPresent(
              d -> checkState(!d.isNaN(), "The validated depthUncertaintyKm is not a number"));

      var confidenceLevel = ellipse.getConfidenceLevel();
      checkState(
          confidenceLevel >= MIN_CONFIDENCE && confidenceLevel <= MAX_CONFIDENCE,
          "confidence level must be in range [%s, %s]",
          MIN_CONFIDENCE,
          MAX_CONFIDENCE);

      var scalingFactorType = ellipse.getScalingFactorType();
      var kWeight = ellipse.getkWeight();

      switch (scalingFactorType) {
        case CONFIDENCE -> checkState(
            Math.abs(kWeight) < DELTA, "If scaling factor type is CONFIDENCE, kWeight must be 0.0");
        case COVERAGE -> checkState(
            Double.isInfinite(kWeight) && kWeight > 0,
            "If scaling factor type is COVERAGE, kWeight must be infinity");
        case K_WEIGHTED -> checkState(
            kWeight >= 0.0, "If scaling factor type is K_WEIGHTED, kWeight must be >= 0.0");
      }

      ellipse
          .getTimeUncertainty()
          .ifPresent(tu -> checkState(!tu.isNegative(), "Time uncertainty must be non-negative"));

      return ellipse;
    }
  }
}
