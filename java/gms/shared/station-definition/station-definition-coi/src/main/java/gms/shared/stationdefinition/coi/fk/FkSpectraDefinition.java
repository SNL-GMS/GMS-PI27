package gms.shared.stationdefinition.coi.fk;

import com.google.common.base.Preconditions;

/** Contains parameters that are used in the creation of FkSpectra channels */
public record FkSpectraDefinition(
    FkSpectraParameters fkParameters, OrientationAngles orientationAngles) {

  public FkSpectraDefinition {
    Preconditions.checkNotNull(fkParameters);
    Preconditions.checkNotNull(orientationAngles);
  }
}
