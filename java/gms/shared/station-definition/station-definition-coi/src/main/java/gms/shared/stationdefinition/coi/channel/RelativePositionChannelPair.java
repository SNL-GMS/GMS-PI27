package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;

@AutoValue
public abstract class RelativePositionChannelPair {

  public abstract RelativePosition getRelativePosition();

  public abstract Channel getChannel();

  @JsonCreator
  public static RelativePositionChannelPair create(
      @JsonProperty("relativePosition") RelativePosition relativePosition,
      @JsonProperty("channel") Channel channel) {

    return new AutoValue_RelativePositionChannelPair(relativePosition, channel);
  }
}
