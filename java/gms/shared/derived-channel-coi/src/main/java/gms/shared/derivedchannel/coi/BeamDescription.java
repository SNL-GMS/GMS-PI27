package gms.shared.derivedchannel.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.BeamSummation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import java.util.Optional;
import javax.annotation.Nullable;

/** Beam description contains parameters describing beam attributes */
@AutoValue
@JsonSerialize(as = BeamDescription.class)
@JsonDeserialize(builder = AutoValue_BeamDescription.Builder.class)
public abstract class BeamDescription {

  public static BeamDescription.Builder builder() {
    return new AutoValue_BeamDescription.Builder();
  }

  public abstract BeamDescription.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    BeamDescription autobuild();

    Builder setBeamSummation(BeamSummation beamSummation);

    Builder setTwoDimensional(boolean isTwoDimensional);

    Builder setPhase(PhaseType phaseType);

    Builder setSamplingType(SamplingType samplingType);

    Builder setBeamType(BeamType beamType);

    Builder setPreFilterDefinition(@Nullable FilterDefinition filterDefinition);

    default Builder noPreFilterDefinition() {
      return this.setPreFilterDefinition(null);
    }

    default BeamDescription build() {
      return autobuild();
    }
  }

  public abstract BeamSummation getBeamSummation();

  public abstract boolean isTwoDimensional();

  public abstract PhaseType getPhase();

  public abstract SamplingType getSamplingType();

  public abstract BeamType getBeamType();

  public abstract Optional<FilterDefinition> getPreFilterDefinition();
}
