package gms.shared.signalenhancement.coi.utils;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.station.Station;
import org.apache.commons.lang3.Validate;

/**
 * Helper record to contain various component parts of a {@link Channel}'s name
 *
 * @param stationName Name of the {@link Station} associated with the {@link Channel}
 * @param channelName Full name of the {@link Channel} these components were constructed from
 * @param channelGroupName Name of the {@link ChannelGroup} associated with the {@link Channel}
 * @param channelCode Code (e.g. SHZ, BZ, etc) associated with the {@link Channel}
 */
public record ChannelComponents(
    String stationName,
    String channelName,
    String channelGroupName,
    String shortChannelName,
    ChannelTypes channelCode) {

  private static final int NUM_COMPONENTS = 3;
  private static final int CHAN_CODE_INDEX = 2;

  /** Validation */
  public ChannelComponents {
    Validate.notEmpty(stationName);
    Validate.notEmpty(channelName);
    Validate.notEmpty(channelGroupName);
    Validate.notEmpty(shortChannelName);
    Preconditions.checkNotNull(channelCode);
  }

  /**
   * Factory method to construct from a {@link Channel}'s name
   *
   * @param channelName Full name of the {@link Channel} these components will be constructed from
   * @return The {@link ChannelComponents}, constructed from the {@link Channel}'s name
   */
  public static ChannelComponents fromChannelName(String channelName) {
    final var STATION_NAME = 0;
    final var CHANNEL_GROUP_NAME = 1;
    final var SHORT_CHANNEL_NAME = 2;
    var splitSlashCname = channelName.split("\\/");

    Preconditions.checkArgument(
        splitSlashCname.length > 0 && !splitSlashCname[0].isEmpty(),
        "Channel name %s before '/' cannot be empty",
        channelName);

    var strippedCname = splitSlashCname[0];

    var splitDotCname = strippedCname.split("\\.");

    Preconditions.checkArgument(
        splitDotCname.length == NUM_COMPONENTS,
        "Channel name %s must have %d components separated by '.', but was %d",
        channelName,
        NUM_COMPONENTS,
        splitDotCname.length);

    var chanCode = splitDotCname[CHAN_CODE_INDEX];
    var channelCodeOpt = ChannelTypesParser.parseChannelTypes(chanCode);

    Preconditions.checkArgument(
        channelCodeOpt.isPresent(),
        "ChannelTypesParser parsed channel code %s to empty. Future work to log more context"
            + " TBD.",
        chanCode);

    return new ChannelComponents(
        splitDotCname[STATION_NAME],
        channelName,
        splitDotCname[CHANNEL_GROUP_NAME],
        splitDotCname[SHORT_CHANNEL_NAME],
        channelCodeOpt.get());
  }
}
