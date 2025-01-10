package gms.shared.stationdefinition.configuration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.PhaseType;
import java.util.Map;

@AutoValue
public abstract class PhaseTypesByBeamDescriptions {

  public abstract Map<String, PhaseType> getPhaseTypesByBeamDescriptions();

  @JsonCreator
  public static PhaseTypesByBeamDescriptions from(
      @JsonProperty("phaseTypesByBeamDescriptions")
          Map<String, PhaseType> phaseTypesByBeamDescriptions) {

    return new AutoValue_PhaseTypesByBeamDescriptions(phaseTypesByBeamDescriptions);
  }
}
