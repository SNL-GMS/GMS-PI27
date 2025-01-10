package gms.shared.stationdefinition.coi.fk;

import com.google.common.base.Preconditions;

public record SlownessGrid(double maxSlowness, double numPoints) {

  public SlownessGrid {
    Preconditions.checkArgument(maxSlowness > 0, "Max slowness must be greater than zero.");
    Preconditions.checkArgument(numPoints > 0, "Number of points must be greater than zero.");
  }
}
