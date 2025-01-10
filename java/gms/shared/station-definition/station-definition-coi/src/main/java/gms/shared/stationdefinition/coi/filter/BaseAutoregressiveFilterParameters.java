package gms.shared.stationdefinition.coi.filter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.DEDUCTION,
    defaultImpl = AdaptiveAutoregressiveFilterParameters.class)
@JsonSubTypes({
  @JsonSubTypes.Type(value = AutoregressiveFilterParameters.class),
  @JsonSubTypes.Type(value = AdaptiveAutoregressiveFilterParameters.class)
})
public interface BaseAutoregressiveFilterParameters {

  double getSampleRateHz();

  double getSampleRateToleranceHz();
}
