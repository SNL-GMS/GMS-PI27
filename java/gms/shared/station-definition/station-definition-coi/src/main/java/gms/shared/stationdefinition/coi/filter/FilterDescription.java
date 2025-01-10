package gms.shared.stationdefinition.coi.filter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import java.util.Optional;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.EXISTING_PROPERTY,
    property = "filterType",
    visible = true)
@JsonSubTypes({
  @JsonSubTypes.Type(value = AutoregressiveFilterDescription.class, name = "AUTOREGRESSIVE"),
  @JsonSubTypes.Type(value = CascadeFilterDescription.class, name = "CASCADE"),
  @JsonSubTypes.Type(value = PhaseMatchFilterDescription.class, name = "PHASE_MATCH"),
  @JsonSubTypes.Type(value = LinearFilterDescription.class, name = "LINEAR")
})
public interface FilterDescription {

  Optional<String> getComments();

  Optional<FrequencyAmplitudePhase> getResponse();

  boolean isCausal();

  FilterType getFilterType();
}
