package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.util.Optional;

/**
 * Defines the Ellipsoid class - represents a 3D projection of the {@link LocationUncertainty}
 * covariance matrix
 */
@AutoValue
@JsonSerialize(as = Ellipsoid.class)
@JsonDeserialize(builder = AutoValue_Ellipsoid.Builder.class)
public abstract class Ellipsoid {

  public abstract ScalingFactorType getScalingFactorType();

  public abstract double getkWeight();

  public abstract double getConfidenceLevel();

  public abstract Optional<Double> getSemiMajorAxisLengthKm();

  public abstract Optional<Double> getSemiMajorAxisTrendDeg();

  public abstract Optional<Double> getSemiMajorAxisPlungeDeg();

  public abstract Optional<Double> getSemiIntermediateAxisLengthKm();

  public abstract Optional<Double> getSemiIntermediateAxisTrendDeg();

  public abstract Optional<Double> getSemiIntermediateAxisPlungeDeg();

  public abstract Optional<Double> getSemiMinorAxisLengthKm();

  public abstract Optional<Double> getSemiMinorAxisTrendDeg();

  public abstract Optional<Double> getSemiMinorAxisPlungeDeg();

  public abstract Optional<Duration> getTimeUncertainty();

  public static Builder builder() {
    return new AutoValue_Ellipsoid.Builder();
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

    public abstract Builder setSemiMajorAxisPlungeDeg(double semiMajorAxisPlungeDeg);

    public abstract Builder setSemiIntermediateAxisLengthKm(double semiIntermediateAxisLengthKm);

    public abstract Builder setSemiIntermediateAxisTrendDeg(double semiIntermediateAxisTrendDeg);

    public abstract Builder setSemiIntermediateAxisPlungeDeg(double semiIntermediateAxisPlungeDeg);

    public abstract Builder setSemiMinorAxisLengthKm(double semiMinorAxisLengthKm);

    public abstract Builder setSemiMinorAxisTrendDeg(double semiMinorAxisTrendDeg);

    public abstract Builder setSemiMinorAxisPlungeDeg(double semiMinorAxisPlungeDeg);

    public abstract Builder setTimeUncertainty(Duration timeUncertainty);

    protected abstract Ellipsoid autoBuild();

    public Ellipsoid build() {
      var ellipsoid = autoBuild();

      checkState(!Double.isNaN(ellipsoid.getkWeight()), "The validated kWeight is not a number");
      checkState(
          !Double.isNaN(ellipsoid.getConfidenceLevel()),
          "The validated confidenceLevel is not a number");

      validateMajorAxis(ellipsoid);
      validateIntermediateAxis(ellipsoid);
      validateMinorAxis(ellipsoid);

      var confidenceLevel = ellipsoid.getConfidenceLevel();
      checkState(
          confidenceLevel >= MIN_CONFIDENCE && confidenceLevel <= MAX_CONFIDENCE,
          "confidence level must be in range [%s, %s]",
          MIN_CONFIDENCE,
          MAX_CONFIDENCE);

      var scalingFactorType = ellipsoid.getScalingFactorType();
      var kWeight = ellipsoid.getkWeight();

      switch (scalingFactorType) {
        case CONFIDENCE -> checkState(
            Math.abs(kWeight) < DELTA, "If scaling factor type is CONFIDENCE, kWeight must be 0.0");
        case COVERAGE -> checkState(
            Double.isInfinite(kWeight) && kWeight > 0,
            "If scaling factor type is COVERAGE, kWeight must be infinity");
        case K_WEIGHTED -> checkState(
            kWeight >= 0.0, "If scaling factor type is K_WEIGHTED, kWeight must be >= 0.0");
      }

      ellipsoid
          .getTimeUncertainty()
          .ifPresent(tu -> checkState(!tu.isNegative(), "Time uncertainty must be non-negative"));

      return ellipsoid;
    }

    private static void validateMajorAxis(Ellipsoid ellipsoid) {
      ellipsoid
          .getSemiMajorAxisLengthKm()
          .ifPresent(
              smal ->
                  checkState(
                      !Double.isNaN(smal), "The validated semiMajorAxisLengthKm is not a number"));

      ellipsoid
          .getSemiMajorAxisTrendDeg()
          .ifPresent(
              smat ->
                  checkState(
                      !Double.isNaN(smat), "The validated semiMajorAxisTrendDeg is not a number"));

      ellipsoid
          .getSemiMajorAxisPlungeDeg()
          .ifPresent(
              smap ->
                  checkState(
                      !Double.isNaN(smap), "The validated semiMajorAxisPlungeDeg is not a number"));
    }

    private static void validateIntermediateAxis(Ellipsoid ellipsoid) {
      ellipsoid
          .getSemiIntermediateAxisLengthKm()
          .ifPresent(
              sial ->
                  checkState(
                      !Double.isNaN(sial),
                      "The validated semiIntermediateAxisLengthKm is not a number"));

      ellipsoid
          .getSemiIntermediateAxisTrendDeg()
          .ifPresent(
              siat ->
                  checkState(
                      !Double.isNaN(siat),
                      "The validated semiIntermediateAxisTrendDeg is not a number"));

      ellipsoid
          .getSemiIntermediateAxisPlungeDeg()
          .ifPresent(
              siap ->
                  checkState(
                      !Double.isNaN(siap),
                      "The validated semiIntermediateAxisPlungeDeg is not a number"));
    }

    private static void validateMinorAxis(Ellipsoid ellipsoid) {
      ellipsoid
          .getSemiMinorAxisLengthKm()
          .ifPresent(
              smal ->
                  checkState(
                      !Double.isNaN(smal), "The validated semiMinorAxisLengthKm is not a number"));

      ellipsoid
          .getSemiMinorAxisTrendDeg()
          .ifPresent(
              smat ->
                  checkState(
                      !Double.isNaN(smat), "The validated semiMinorAxisTrendDeg is not a number"));

      ellipsoid
          .getSemiMinorAxisPlungeDeg()
          .ifPresent(
              smap ->
                  checkState(
                      !Double.isNaN(smap), "The validated semiMinorAxisPlungeDeg is not a number"));
    }
  }
}
