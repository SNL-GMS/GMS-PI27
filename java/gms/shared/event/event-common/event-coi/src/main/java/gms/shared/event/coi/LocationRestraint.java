package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.time.Instant;
import java.util.Optional;
import javax.annotation.Nullable;

/**
 * Define a LocationRestraint class for the processing results location solution. Use the Builder
 * class to create a new LocationRestraint object. Represent whether and how the location algorithm
 * was constrained when it was determined the {@link EventLocation}
 */
@AutoValue
@JsonSerialize(as = LocationRestraint.class)
@JsonDeserialize(builder = AutoValue_LocationRestraint.Builder.class)
public abstract class LocationRestraint {

  private static final LocationRestraint FREE =
      builder()
          .setDepthRestraintType(RestraintType.UNRESTRAINED)
          .setPositionRestraintType(RestraintType.UNRESTRAINED)
          .setTimeRestraintType(RestraintType.UNRESTRAINED)
          .build();

  private static final LocationRestraint SURFACE =
      builder()
          .setDepthRestraintType(RestraintType.FIXED)
          .setDepthRestraintReason(DepthRestraintReason.FIXED_AT_SURFACE)
          .setDepthRestraintKm(0.0)
          .setPositionRestraintType(RestraintType.UNRESTRAINED)
          .setTimeRestraintType(RestraintType.UNRESTRAINED)
          .build();

  public abstract RestraintType getDepthRestraintType();

  public abstract Optional<DepthRestraintReason> getDepthRestraintReason();

  public abstract Optional<Double> getDepthRestraintKm();

  public abstract RestraintType getPositionRestraintType();

  public abstract Optional<Double> getLatitudeRestraintDegrees();

  public abstract Optional<Double> getLongitudeRestraintDegrees();

  public abstract RestraintType getTimeRestraintType();

  public abstract Optional<Instant> getTimeRestraint();

  public static LocationRestraint free() {
    return FREE;
  }

  public static LocationRestraint surface() {
    return SURFACE;
  }

  public static Builder builder() {
    return new AutoValue_LocationRestraint.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {
    @JsonProperty
    public abstract Builder setDepthRestraintType(RestraintType depthRestraintType);

    @JsonProperty
    public abstract Builder setDepthRestraintReason(
        @Nullable DepthRestraintReason depthRestraintReason);

    public Builder noDepthRestraintReason() {
      return this.setDepthRestraintReason(null);
    }

    @JsonProperty
    public abstract Builder setDepthRestraintKm(@Nullable Double depthRestraintKm);

    public Builder noDepthRestraintKm() {
      return this.setDepthRestraintKm(null);
    }

    @JsonProperty
    public abstract Builder setPositionRestraintType(RestraintType positionRestraintType);

    @JsonProperty
    public abstract Builder setLatitudeRestraintDegrees(@Nullable Double latitudeRestraintDegrees);

    public Builder noLatitudeRestraintDegrees() {
      return this.setLatitudeRestraintDegrees(null);
    }

    @JsonProperty
    public abstract Builder setLongitudeRestraintDegrees(
        @Nullable Double longitudeRestraintDegrees);

    public Builder noLongitudeRestraintDegrees() {
      return this.setLongitudeRestraintDegrees(null);
    }

    @JsonProperty
    public abstract Builder setTimeRestraintType(RestraintType timeRestraintType);

    @JsonProperty
    public abstract Builder setTimeRestraint(@Nullable Instant timeRestraint);

    public Builder noTimeRestraint() {
      return this.setTimeRestraint(null);
    }

    protected abstract LocationRestraint autoBuild();

    public LocationRestraint build() {
      var locationRestraint = autoBuild();

      validateDepthRestraintConstraints(locationRestraint);
      validatePositionRestraintConstraints(locationRestraint);
      validateTimeRestraintConstraints(locationRestraint);

      return locationRestraint;
    }

    private static void validateDepthRestraintConstraints(LocationRestraint locationRestraint) {
      var depthRestraintType = locationRestraint.getDepthRestraintType();
      var depthRestraintReason = locationRestraint.getDepthRestraintReason();
      var depthRestraintKm = locationRestraint.getDepthRestraintKm();

      // Depth Restraint Reason
      checkState(
          RestraintType.UNRESTRAINED == depthRestraintType || depthRestraintReason.isPresent(),
          "Depth restraint reason should be populated when depth is restrained");

      checkState(
          RestraintType.UNRESTRAINED != depthRestraintType || depthRestraintReason.isEmpty(),
          "Depth restraint reason should not be populated when depth is unrestrained");

      // Depth Restraint (km)
      checkState(
          RestraintType.UNRESTRAINED == depthRestraintType || depthRestraintKm.isPresent(),
          "Depth restraint (km) should be populated when depth is restrained");

      checkState(
          RestraintType.UNRESTRAINED != depthRestraintType || depthRestraintKm.isEmpty(),
          "Depth restraint (km) should not be populated when depth is unrestrained");
    }

    private static void validatePositionRestraintConstraints(LocationRestraint locationRestraint) {
      var positionRestraintType = locationRestraint.getPositionRestraintType();
      var latitudeRestraintDegrees = locationRestraint.getLatitudeRestraintDegrees();
      var longitudeRestraintDegrees = locationRestraint.getLongitudeRestraintDegrees();

      // Latitude Restraint (°)
      checkState(
          RestraintType.UNRESTRAINED == positionRestraintType
              || latitudeRestraintDegrees.isPresent(),
          "Latitude restraint should be populated when position is restrained");

      checkState(
          RestraintType.UNRESTRAINED != positionRestraintType || latitudeRestraintDegrees.isEmpty(),
          "Latitude restraint should not be populated when position is unrestrained");

      // Longitude Restraint (°)
      checkState(
          RestraintType.UNRESTRAINED == positionRestraintType
              || longitudeRestraintDegrees.isPresent(),
          "Longitude restraint should be populated when position is restrained");

      checkState(
          RestraintType.UNRESTRAINED != positionRestraintType
              || longitudeRestraintDegrees.isEmpty(),
          "Longitude restraint should not be populated when position is unrestrained");
    }

    private static void validateTimeRestraintConstraints(LocationRestraint locationRestraint) {
      var timeRestraintType = locationRestraint.getTimeRestraintType();
      var timeRestraint = locationRestraint.getTimeRestraint();

      checkState(
          RestraintType.UNRESTRAINED == timeRestraintType || timeRestraint.isPresent(),
          "Time restraint should be populated when time is restrained");

      checkState(
          RestraintType.UNRESTRAINED != timeRestraintType || timeRestraint.isEmpty(),
          "Time restraint should not be populated when time is unrestrained");
    }
  }
}
