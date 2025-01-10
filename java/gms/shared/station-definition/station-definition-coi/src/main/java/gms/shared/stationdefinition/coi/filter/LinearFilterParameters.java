package gms.shared.stationdefinition.coi.filter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.time.Duration;

@JsonTypeInfo(use = JsonTypeInfo.Id.DEDUCTION)
@JsonSubTypes({
  @JsonSubTypes.Type(value = FirFilterParameters.class),
  @JsonSubTypes.Type(value = IirFilterParameters.class)
})
public interface LinearFilterParameters {

  double getSampleRateHz();

  double getSampleRateToleranceHz();

  Duration getGroupDelaySec();
}
