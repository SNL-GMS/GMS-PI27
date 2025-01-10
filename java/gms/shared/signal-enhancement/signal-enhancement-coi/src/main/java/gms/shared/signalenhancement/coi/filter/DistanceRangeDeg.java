package gms.shared.signalenhancement.coi.filter;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;

/**
 * Represents the distance in degrees from source to destination
 *
 * @param minDistanceDeg the minimum distance in degrees (inclusive)
 * @param maxDistanceDeg the maximum distance in degrees (inclusive)
 */
public record DistanceRangeDeg(double minDistanceDeg, double maxDistanceDeg) {

  private static final double MIN_DISTANCE = 0;
  private static final double MAX_DISTANCE = 180;

  public DistanceRangeDeg {

    Preconditions.checkArgument(
        minDistanceDeg >= MIN_DISTANCE && minDistanceDeg < MAX_DISTANCE,
        "minDistanceDeg must be between [0,180)");
    Preconditions.checkArgument(
        maxDistanceDeg > MIN_DISTANCE && maxDistanceDeg <= MAX_DISTANCE,
        "maxDistanceDeg must be between (0,180]");
    Preconditions.checkArgument(
        minDistanceDeg < maxDistanceDeg, "minDistanceDeg must be <= maxDistanceDeg");
  }

  /**
   * Will return the Range being used from min distance to max distance in degrees
   *
   * @return the inclusive Range being used
   */
  public Range<Double> asRange() {
    return Range.closedOpen(this.minDistanceDeg, this.maxDistanceDeg);
  }
}
