package gms.shared.stationdefinition.converter.util;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.ArrayList;
import java.util.List;
import java.util.NavigableSet;
import org.apache.commons.lang3.Validate;

/** Station definition utility for filtering COI objects */
public final class StationDefinitionCoiFilter {

  private static final String WILD_CARD = "*";
  private static final int CHANNEL_GROUP_INDEX = 1;
  private static final int CHANNEL_INDEX = 2;

  private StationDefinitionCoiFilter() {}

  /**
   * Filter a station's raw channels using the input channel group and channel names
   *
   * @param rawChannels stations's raw channels
   * @param inputChannelGroups configuration channel groups
   * @param inputChannels configuration channels
   * @param beamformingChannels output beamforming channels
   */
  public static List<Channel> filterStationRawChannels(
      NavigableSet<Channel> rawChannels,
      List<String> inputChannelGroups,
      List<String> inputChannels) {

    Validate.notEmpty(inputChannels);
    Validate.notEmpty(inputChannelGroups);

    List<Channel> filteredChannels = new ArrayList<>();

    // first check if we don't have wildcards for the input channel groups
    if (inputChannelGroups.get(0).equals(WILD_CARD)) {
      // CASE 1: channel group wildcard -> filter channels
      filterChannels(rawChannels, inputChannels, filteredChannels);
    } else {
      // CASE 2: no wildcards -> filter channel groups & channels
      filterChannelGroupsAndChannels(
          rawChannels, inputChannelGroups, inputChannels, filteredChannels);
    }

    return filteredChannels;
  }

  /**
   * Filter the raw channels using list of input channel strings
   *
   * @param rawChannels list of raw {@link Channel}s from {@link Station}
   * @param inputChannels list of input channel strings
   * @param filteredChannels output filtered {@link Channel}s
   */
  private static void filterChannels(
      NavigableSet<Channel> rawChannels,
      List<String> inputChannels,
      List<Channel> filteredChannels) {

    filteredChannels.addAll(
        rawChannels.stream()
            .filter(chan -> inputChannels.contains(getChannelName(chan.getName())))
            .map(Channel::createVersionReference)
            .toList());
  }

  /**
   * Filter the raw channels using lists of input channel groups and channels
   *
   * @param rawChannels list of raw {@link Channel}s from {@link Station}
   * @param inputChannelGroups of of input channel group strings
   * @param inputChannels list of input channel strings
   * @param filteredChannels output filtered {@link Channel}s
   */
  private static void filterChannelGroupsAndChannels(
      NavigableSet<Channel> rawChannels,
      List<String> inputChannelGroups,
      List<String> inputChannels,
      List<Channel> filteredChannels) {

    filteredChannels.addAll(
        rawChannels.stream()
            .filter(
                chan ->
                    inputChannelGroups.contains(getChannelGroupName(chan.getName()))
                        && inputChannels.contains(getChannelName(chan.getName())))
            .toList());
  }

  /**
   * Method for extracting channel group name
   *
   * @param channelName full input channel name
   * @return channel group name
   */
  private static String getChannelGroupName(String channelName) {
    String[] channel = channelName.split("\\.");
    return channel[CHANNEL_GROUP_INDEX];
  }

  /**
   * Method for extracting channel name
   *
   * @param channelName full input channel name
   * @return channel name
   */
  private static String getChannelName(String channelName) {
    String[] channel = channelName.split("\\.");
    return channel[CHANNEL_INDEX];
  }
}
