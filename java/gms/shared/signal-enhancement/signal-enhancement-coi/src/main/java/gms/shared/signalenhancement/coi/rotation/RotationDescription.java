package gms.shared.signalenhancement.coi.rotation;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;

/**
 * Value class storing the components of a Rotation Description, consisting of a {@link PhaseType},
 * a {@link SamplingType}, and whether or not the rotation is two-dimensional.
 */
public record RotationDescription(
    PhaseType phaseType, SamplingType samplingType, boolean twoDimensional) {

  /**
   * Value class storing the components of a Rotation Description, consisting of a {@link
   * PhaseType}, a {@link SamplingType}, and whether or not the rotation is two-dimensional.
   *
   * @param phaseType the non-null {@link PhaseType}
   * @param samplingType the non-null {@link SamplingType}
   * @param twoDimensional true if the rotation is two-dimensional; false otherwise
   */
  public RotationDescription {
    Preconditions.checkNotNull(phaseType, "PhaseType must be populated");
    Preconditions.checkNotNull(samplingType, "SamplingType must be populated");
  }

  public static Builder builder() {
    return new AutoBuilder_RotationDescription_Builder();
  }

  @AutoBuilder
  public interface Builder {
    Builder phaseType(PhaseType phaseType);

    Builder samplingType(SamplingType samplingType);

    Builder twoDimensional(boolean twoDimensional);

    RotationDescription build();
  }
}
