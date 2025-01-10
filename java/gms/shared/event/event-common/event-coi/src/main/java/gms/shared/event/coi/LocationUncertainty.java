package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableSet;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;

/** Defines the LocationUncertainty class */
@AutoValue
@JsonSerialize(as = LocationUncertainty.class)
@JsonDeserialize(builder = AutoValue_LocationUncertainty.Builder.class)
public abstract class LocationUncertainty {

  public abstract Optional<Double> getXx();

  public abstract Optional<Double> getXy();

  public abstract Optional<Double> getXz();

  public abstract Optional<Double> getXt();

  public abstract Optional<Double> getYy();

  public abstract Optional<Double> getYz();

  public abstract Optional<Double> getYt();

  public abstract Optional<Double> getZz();

  public abstract Optional<Double> getZt();

  public abstract Optional<Double> getTt();

  public abstract Optional<Double> getStdDevOneObservation();

  public abstract ImmutableSet<Ellipse> getEllipses();

  public abstract ImmutableSet<Ellipsoid> getEllipsoids();

  public static Builder builder() {
    return new AutoValue_LocationUncertainty.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setXx(double xx);

    public abstract Builder setXy(double xy);

    public abstract Builder setXz(double xz);

    public abstract Builder setXt(double xt);

    public abstract Builder setYy(double yy);

    public abstract Builder setYz(double yz);

    public abstract Builder setYt(double yt);

    public abstract Builder setZz(double zz);

    public abstract Builder setZt(double zt);

    public abstract Builder setTt(double tt);

    public abstract Builder setStdDevOneObservation(double stdDev);

    public Builder setEllipses(Collection<Ellipse> ellipses) {
      setEllipses(ImmutableSet.copyOf(ellipses));
      return this;
    }

    public abstract Builder setEllipses(ImmutableSet<Ellipse> ellipses);

    abstract ImmutableSet.Builder<Ellipse> ellipsesBuilder();

    public LocationUncertainty.Builder addEllipse(Ellipse ellipse) {
      ellipsesBuilder().add(ellipse);
      return this;
    }

    public Builder setEllipsoids(Collection<Ellipsoid> ellipsoids) {
      setEllipsoids(ImmutableSet.copyOf(ellipsoids));
      return this;
    }

    public abstract Builder setEllipsoids(ImmutableSet<Ellipsoid> ellipsoids);

    abstract ImmutableSet.Builder<Ellipsoid> ellipsoidsBuilder();

    public LocationUncertainty.Builder addEllipsoid(Ellipsoid ellipsoid) {
      ellipsoidsBuilder().add(ellipsoid);
      return this;
    }

    protected abstract LocationUncertainty autoBuild();

    public LocationUncertainty build() {
      var locationUncertainty = autoBuild();

      locationUncertainty
          .getXx()
          .ifPresent(xx -> checkState(!Double.isNaN(xx), "The validated xx is not a number"));

      locationUncertainty
          .getXy()
          .ifPresent(xy -> checkState(!Double.isNaN(xy), "The validated xy is not a number"));

      locationUncertainty
          .getXz()
          .ifPresent(xz -> checkState(!Double.isNaN(xz), "The validated xz is not a number"));

      locationUncertainty
          .getXt()
          .ifPresent(xt -> checkState(!Double.isNaN(xt), "The validated xt is not a number"));

      locationUncertainty
          .getYy()
          .ifPresent(yy -> checkState(!Double.isNaN(yy), "The validated yy is not a number"));

      locationUncertainty
          .getYz()
          .ifPresent(yz -> checkState(!Double.isNaN(yz), "The validated yz is not a number"));

      locationUncertainty
          .getYt()
          .ifPresent(yt -> checkState(!Double.isNaN(yt), "The validated yt is not a number"));

      locationUncertainty
          .getZz()
          .ifPresent(zz -> checkState(!Double.isNaN(zz), "The validated zz is not a number"));

      locationUncertainty
          .getZt()
          .ifPresent(zt -> checkState(!Double.isNaN(zt), "The validated zt is not a number"));

      locationUncertainty
          .getTt()
          .ifPresent(tt -> checkState(!Double.isNaN(tt), "The validated tt is not a number"));

      locationUncertainty
          .getStdDevOneObservation()
          .ifPresent(
              stdDev ->
                  checkState(
                      !Double.isNaN(stdDev), "The validated stdDevOneObservation is not a number"));

      var uniqueEllipsesConstraintSet =
          locationUncertainty.getEllipses().stream()
              .map(
                  ellipseConstraint ->
                      Pair.of(
                          ellipseConstraint.getConfidenceLevel(),
                          ellipseConstraint.getScalingFactorType()))
              .collect(Collectors.toSet());
      checkState(
          locationUncertainty.getEllipses().size() == uniqueEllipsesConstraintSet.size(),
          "Ellipses have a duplicate(s) with the same Confidence Level and Scaling Factor Type.");

      var uniqueEllipsoidsConstraintSet =
          locationUncertainty.getEllipsoids().stream()
              .map(
                  ellipsoidConstraint ->
                      Pair.of(
                          ellipsoidConstraint.getConfidenceLevel(),
                          ellipsoidConstraint.getScalingFactorType()))
              .collect(Collectors.toSet());
      checkState(
          locationUncertainty.getEllipsoids().size() == uniqueEllipsoidsConstraintSet.size(),
          "Ellipsoids have a duplicate(s) with the same Confidence Level and Scaling Factor Type.");

      return locationUncertainty;
    }
  }

  /**
   * Build the covariance matrix.
   *
   * @return the covariance matrix with shape [xx xy xz xt / xy yy yz yt / xz yz zz zt / xt yt zt
   *     tt]
   */
  @JsonIgnore
  public List<List<Optional<Double>>> getCovarianceMatrix() {
    return List.of(
        List.of(getXx(), getXy(), getXz(), getXt()),
        List.of(getXy(), getYy(), getYz(), getYt()),
        List.of(getXz(), getYz(), getZz(), getZt()),
        List.of(getXt(), getYt(), getZt(), getTt()));
  }
}
