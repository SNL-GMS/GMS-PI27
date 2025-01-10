package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.time.Instant;
import java.util.Comparator;
import java.util.Objects;

@AutoValue
public abstract class ChannelSegmentDescriptor implements Comparable<ChannelSegmentDescriptor> {
  public abstract Channel getChannel();

  public abstract Instant getStartTime();

  public abstract Instant getEndTime();

  public abstract Instant getCreationTime();

  @JsonCreator
  public static ChannelSegmentDescriptor from(
      @JsonProperty("channel") Channel channel,
      @JsonProperty("startTime") Instant startTime,
      @JsonProperty("endTime") Instant endTime,
      @JsonProperty("creationTime") Instant creationTime) {
    Objects.requireNonNull(channel);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Objects.requireNonNull(creationTime);
    return new AutoValue_ChannelSegmentDescriptor(channel, startTime, endTime, creationTime);
  }

  @Override
  public int compareTo(ChannelSegmentDescriptor o) {
    return Comparator.comparing(
            ChannelSegmentDescriptor::getChannel, (c1, c2) -> c1.getName().compareTo(c2.getName()))
        .thenComparing(ChannelSegmentDescriptor::getStartTime)
        .thenComparing(ChannelSegmentDescriptor::getEndTime)
        .thenComparing(ChannelSegmentDescriptor::getCreationTime)
        .compare(this, o);
  }
}
