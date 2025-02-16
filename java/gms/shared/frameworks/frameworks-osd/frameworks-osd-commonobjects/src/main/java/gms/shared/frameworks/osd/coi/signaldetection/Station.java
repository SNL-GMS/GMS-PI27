package gms.shared.frameworks.osd.coi.signaldetection;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.google.auto.value.AutoValue;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup;
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.coi.stationreference.StationType;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.TreeSet;
import java.util.stream.Stream;
import org.apache.commons.lang3.Validate;

/**
 * @deprecated The current model of this COI has been migrated into the signal-detection-coi
 *     package.
 */
@AutoValue
@Deprecated(forRemoval = true)
public abstract class Station {

  public abstract String getName();

  public abstract StationType getType();

  public abstract String getDescription();

  public abstract Map<String, RelativePosition> getRelativePositionsByChannel();

  public abstract Location getLocation();

  public abstract NavigableSet<ChannelGroup> getChannelGroups();

  public abstract NavigableSet<Channel> getChannels();

  public Stream<Channel> channels() {
    return getChannels().stream();
  }

  @JsonCreator
  public static Station from(
      @JsonProperty("name") String name,
      @JsonProperty("type") StationType type,
      @JsonProperty("description") String description,
      @JsonProperty("relativePositionsByChannel")
          Map<String, RelativePosition> relativePositionsByChannel,
      @JsonProperty("location") Location location,
      @JsonProperty("channelGroups") List<ChannelGroup> channelGroups,
      @JsonProperty("channels") List<Channel> channels) {

    Validate.notEmpty(name, "Station must be provided a name");
    Validate.notEmpty(channels, "Station must have a non-empty list of channels");
    Validate.isTrue(
        description.length() <= 1024, "Descriptions can be no longer than 1024 characters");
    Validate.notEmpty(channelGroups, "Station must have a non-empty list of channel groups");
    Validate.notEmpty(
        relativePositionsByChannel,
        "Station being pass an empty or null map of relative positions for channels it manages");

    channels.forEach(
        channel ->
            Validate.isTrue(
                relativePositionsByChannel.containsKey(channel.getName()),
                "Station passed in a relative position for a channel it does not manage"));

    Validate.isTrue(
        channelGroups.stream()
            .map(ChannelGroup::getChannels)
            .flatMap(Collection::stream)
            .allMatch(channels::contains),
        "Station cannot have ChannelGroups which groups Channels that are not part of the"
            + " Station.");

    return new AutoValue_Station.Builder()
        .setName(name)
        .setType(type)
        .setDescription(description)
        .setRelativePositionsByChannel(relativePositionsByChannel)
        .setLocation(location)
        .setChannelGroups(channelGroups)
        .setChannels(channels)
        .build();
  }

  public static Builder builder() {
    return new AutoValue_Station.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Station.Builder setName(String name);

    public abstract Station.Builder setType(StationType name);

    public abstract Station.Builder setDescription(String name);

    public abstract Station.Builder setRelativePositionsByChannel(
        Map<String, RelativePosition> name);

    public abstract Station.Builder setLocation(Location name);

    public abstract Station.Builder setChannelGroups(NavigableSet<ChannelGroup> name);

    public Station.Builder setChannelGroups(Collection<ChannelGroup> channelGroups) {
      NavigableSet<ChannelGroup> orderedChannelGroups =
          new TreeSet<>(Comparator.comparing(ChannelGroup::getName));
      orderedChannelGroups.addAll(channelGroups);
      return setChannelGroups(orderedChannelGroups);
    }

    public abstract Station.Builder setChannels(NavigableSet<Channel> name);

    public Station.Builder setChannels(Collection<Channel> channels) {
      NavigableSet<Channel> orderedChannels = new TreeSet<>(Comparator.comparing(Channel::getName));
      orderedChannels.addAll(channels);
      return setChannels(orderedChannels);
    }

    public abstract Station build();
  }
}
