package gms.shared.stationdefinition.api.channel;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import java.time.Instant;
import java.util.List;

/** Accessor interface for retrieving {@link Channel}s */
public interface ChannelAccessor extends ChannelRepository {

  /**
   * Retrieves {@link Channel}s having the provided names and effective time, and applies the
   * provided faceting definition to the retrieved {@link Channel}s
   *
   * @param channelNames the names of the channels to retrieve
   * @param effectiveAt the effective time for the channels
   * @param facetingDefinition the faceting definition defining how the channels should be populated
   * @return a list of {@link Channel}s
   */
  List<Channel> findChannelsByNameAndTime(
      List<String> channelNames, Instant effectiveAt, FacetingDefinition facetingDefinition);
}
