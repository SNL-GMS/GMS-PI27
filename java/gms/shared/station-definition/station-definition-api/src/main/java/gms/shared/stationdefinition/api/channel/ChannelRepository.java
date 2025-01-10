package gms.shared.stationdefinition.api.channel;

import gms.shared.stationdefinition.coi.channel.Channel;
import java.time.Instant;
import java.util.List;

/** Interface for the repository that stores and provides {@link Channel}s */
public interface ChannelRepository {

  /**
   * Finds {@link Channel}s having one of the provided names that were active at the provided time
   *
   * @param channelNames The names of the channels to find
   * @param effectiveAt The time at which the channels must be active
   * @return A list of {@link Channel}s with the provided names and effective times
   */
  List<Channel> findChannelsByNameAndTime(List<String> channelNames, Instant effectiveAt);

  /**
   * Finds {@link Channel}s having one of the provided names that were active between the provided
   * start and end times.
   *
   * @param channelNames The names of the channels to find
   * @param startTime The earliest allowable effective time of the channels
   * @param endTime The latest allowable effective time of the channels
   * @return A list of {@link Channel}s with the provided names and active between the provided
   *     times
   */
  List<Channel> findChannelsByNameAndTimeRange(
      List<String> channelNames, Instant startTime, Instant endTime);

  /**
   * Stores the provided list of {@link Channel}s
   *
   * @param channels the {@link Channel}
   */
  default void storeChannels(List<Channel> channels) {
    // no op
  }
}
