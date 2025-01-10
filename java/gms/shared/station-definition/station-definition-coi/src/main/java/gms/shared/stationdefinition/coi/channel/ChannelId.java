package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import org.apache.commons.lang3.Validate;

@AutoValue
@JsonSerialize(as = ChannelId.class)
@JsonDeserialize(builder = AutoValue_ChannelId.Builder.class)
public abstract class ChannelId {

  public static ChannelId createEntityReference(String name) {
    return ChannelId.builder().setName(name).build();
  }

  public static ChannelId createVersionReference(String name, Instant effectiveAt) {
    Objects.requireNonNull(effectiveAt);
    return ChannelId.builder().setName(name).setEffectiveAt(effectiveAt).build();
  }

  public Channel toChannelEntityReference() {
    return Channel.createEntityReference(this.getName());
  }

  public Channel toChannelVersionReference() {
    final Optional<Instant> effectiveAt = this.getEffectiveAt();
    Preconditions.checkArgument(
        effectiveAt.isPresent(), "EffectiveAt is missing from the channel's version reference.");
    return Channel.createVersionReference(this.getName(), effectiveAt.get());
  }

  public abstract String getName();

  public abstract Optional<Instant> getEffectiveAt();

  public static ChannelId.Builder builder() {
    return new AutoValue_ChannelId.Builder();
  }

  public abstract ChannelId.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    ChannelId.Builder setName(String name);

    String getName();

    default ChannelId.Builder setEffectiveAt(Instant effectiveAt) {
      return setEffectiveAt(Optional.ofNullable(effectiveAt));
    }

    ChannelId.Builder setEffectiveAt(Optional<Instant> effectiveAt);

    ChannelId autoBuild();

    default ChannelId build() {
      ChannelId channel = autoBuild();
      Validate.notEmpty(channel.getName(), "Channel must be provided a name");
      return channel;
    }
  }
}
