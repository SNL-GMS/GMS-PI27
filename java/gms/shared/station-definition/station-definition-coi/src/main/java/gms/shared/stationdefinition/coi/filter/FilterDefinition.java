package gms.shared.stationdefinition.coi.filter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@AutoValue
@JsonSerialize(as = FilterDefinition.class)
public abstract class FilterDefinition {
  public abstract String getName();

  public abstract Optional<String> getComments();

  public abstract FilterDescription getFilterDescription();

  @JsonCreator
  public static FilterDefinition from(
      @JsonProperty("name") String name,
      @JsonProperty("comments") Optional<String> comments,
      @JsonProperty("filterDescription") FilterDescription filterDescription) {

    return new AutoValue_FilterDefinition(name, comments, filterDescription);
  }

  @JsonIgnore
  public UUID getUniqueIdentifier() {
    Optional<Double> sampleRate;
    var filterDesc = getFilterDescription();
    if (getFilterDescription() instanceof LinearFilterDescription) {
      sampleRate =
          ((LinearFilterDescription) filterDesc)
              .getParameters()
              .map(LinearFilterParameters::getSampleRateHz);
    } else if (getFilterDescription() instanceof CascadeFilterDescription) {
      sampleRate =
          ((CascadeFilterDescription) filterDesc)
              .getParameters()
              .map(CascadeFilterParameters::getSampleRateHz);
    } else if (getFilterDescription() instanceof PhaseMatchFilterDescription) {
      // PhaseMatchFilterDescription has no frequencies.  Empty optional will force the use of
      // filter description name as UUID seed
      sampleRate = Optional.empty();
    } else {
      sampleRate =
          ((AutoregressiveFilterDescription) filterDesc)
              .getParameters()
              .map(BaseAutoregressiveFilterParameters::getSampleRateHz);
    }
    return sampleRate
        .map(
            sr ->
                UUID.nameUUIDFromBytes(
                    String.format(Locale.ROOT, "%s::%f", getName(), sr)
                        .getBytes(StandardCharsets.UTF_8)))
        .orElseGet(() -> UUID.nameUUIDFromBytes(getName().getBytes(StandardCharsets.UTF_8)));
  }
}
