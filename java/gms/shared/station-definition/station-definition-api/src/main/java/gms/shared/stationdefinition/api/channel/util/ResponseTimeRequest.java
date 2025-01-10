package gms.shared.stationdefinition.api.channel.util;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.api.util.Request;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

/** A {@link Request} for {@link Response}s by time from the station definition endpoint */
@AutoValue
@JsonSerialize(as = ResponseTimeRequest.class)
@JsonDeserialize(builder = AutoValue_ResponseTimeRequest.Builder.class)
public abstract class ResponseTimeRequest implements Request {

  @Override
  @JsonIgnore
  public ImmutableList<String> getNames() {
    return ImmutableList.copyOf(getResponseIds().stream().map(UUID::toString).toList());
  }

  public abstract ImmutableList<UUID> getResponseIds();

  public abstract Optional<Instant> getEffectiveTime();

  public static ResponseTimeRequest.Builder builder() {
    return new AutoValue_ResponseTimeRequest.Builder();
  }

  public abstract ResponseTimeRequest.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    ResponseTimeRequest.Builder setResponseIds(ImmutableList<UUID> responseIds);

    default ResponseTimeRequest.Builder setResponseIds(Collection<UUID> responseIds) {
      return setResponseIds(ImmutableList.copyOf(responseIds));
    }

    ImmutableList.Builder<UUID> responseIdsBuilder();

    default ResponseTimeRequest.Builder addResponseId(UUID responseId) {
      responseIdsBuilder().add(responseId);
      return this;
    }

    ResponseTimeRequest.Builder setEffectiveTime(Optional<Instant> effectiveTime);

    default ResponseTimeRequest.Builder setEffectiveTime(Instant effectiveTime) {
      return setEffectiveTime(Optional.ofNullable(effectiveTime));
    }

    ResponseTimeRequest build();
  }
}
