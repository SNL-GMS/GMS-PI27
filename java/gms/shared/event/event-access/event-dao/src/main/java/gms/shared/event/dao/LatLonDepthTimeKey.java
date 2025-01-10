package gms.shared.event.dao;

import static com.google.common.base.Preconditions.checkArgument;

import com.google.common.math.DoubleMath;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** Represents the primary key into the origin record from the `origin` legacy table. */
@Embeddable
public class LatLonDepthTimeKey implements Serializable {
  public static final double NA_VALUE = -999.0;
  public static final double NA_EPSILON = .01;
  private static final double MAX_LATITUDE = 90.0;
  private static final double MIN_LATITUDE = -90.0;
  private static final double MAX_LONGITUDE = 180.0;
  private static final double MIN_LONGITUDE = -180.0;
  private static final double MAX_DEPTH = 1000.0;
  private static final double MIN_DEPTH = -100.0;
  private static final double MIN_TIME = -9_999_999_999.999;
  private double latitude;
  private double longitude;
  private double depth;
  private double time;

  public LatLonDepthTimeKey() {}

  private LatLonDepthTimeKey(Builder builder) {
    this.latitude = builder.latitude;
    this.longitude = builder.longitude;
    this.depth = builder.depth;
    this.time = builder.time;
  }

  @Column(name = "lat")
  public double getLatitude() {
    return latitude;
  }

  public void setLatitude(double latitude) {
    this.latitude = latitude;
  }

  @Column(name = "lon")
  public double getLongitude() {
    return longitude;
  }

  public void setLongitude(double longitude) {
    this.longitude = longitude;
  }

  @Column(name = "depth")
  public double getDepth() {
    return depth;
  }

  public void setDepth(double depth) {
    this.depth = depth;
  }

  @Column(name = "time")
  public double getTime() {
    return time;
  }

  public void setTime(double time) {
    this.time = time;
  }

  public static class Builder {

    private double latitude;
    private double longitude;
    private double depth;
    private double time;

    public Builder withLatitude(double latitude) {
      this.latitude = latitude;
      return this;
    }

    public Builder withLongitude(double longitude) {
      this.longitude = longitude;
      return this;
    }

    public Builder withDepth(double depth) {
      this.depth = depth;
      return this;
    }

    public Builder withTime(double time) {
      this.time = time;
      return this;
    }

    public LatLonDepthTimeKey build() {
      // -999.0 indicates NA value
      if (!DoubleMath.fuzzyEquals(latitude, NA_VALUE, NA_EPSILON)) {
        checkArgument(
            (MIN_LATITUDE <= latitude) && (latitude <= MAX_LATITUDE),
            "Latitude is %s %s",
            latitude,
            DaoHelperUtility.createRangeStringDouble(MIN_LATITUDE, MAX_LATITUDE, '[', ']'));
      }

      // -999.0 indicates NA value
      if (!DoubleMath.fuzzyEquals(longitude, NA_VALUE, NA_EPSILON)) {
        checkArgument(
            (MIN_LONGITUDE <= longitude) && (longitude <= MAX_LONGITUDE),
            "Longitude is %s %s",
            longitude,
            DaoHelperUtility.createRangeStringDouble(MIN_LONGITUDE, MAX_LONGITUDE, '[', ']'));
      }

      // -999.0 indicates NA value
      if (!DoubleMath.fuzzyEquals(depth, NA_VALUE, NA_EPSILON)) {
        checkArgument(
            (MIN_DEPTH <= depth) && (depth < MAX_DEPTH),
            "Depth is %s %s",
            depth,
            DaoHelperUtility.createRangeStringDouble(MIN_DEPTH, MAX_DEPTH, '(', ']'));
      }

      // NA not allowed
      checkArgument(MIN_TIME < time, "Time is %s.  It must be greater than %s.", time, MIN_TIME);

      return new LatLonDepthTimeKey(this);
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    LatLonDepthTimeKey that = (LatLonDepthTimeKey) o;
    return Double.compare(that.latitude, latitude) == 0
        && Double.compare(that.longitude, longitude) == 0
        && Double.compare(that.depth, depth) == 0
        && Double.compare(that.time, time) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(latitude, longitude, depth, time);
  }

  @Override
  public String toString() {
    return "LatLonDepthTimeKey{"
        + "lat="
        + latitude
        + ", lon="
        + longitude
        + ", depth="
        + depth
        + ", time="
        + time
        + '}';
  }
}
