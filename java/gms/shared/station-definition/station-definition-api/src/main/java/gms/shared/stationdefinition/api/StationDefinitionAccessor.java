package gms.shared.stationdefinition.api;

import gms.shared.stationdefinition.api.channel.ChannelAccessor;
import gms.shared.stationdefinition.api.channel.ChannelGroupAccessor;
import gms.shared.stationdefinition.api.channel.FrequencyAmplitudePhaseRepository;
import gms.shared.stationdefinition.api.channel.ResponseAccessor;
import gms.shared.stationdefinition.api.station.StationAccessor;
import gms.shared.stationdefinition.api.station.StationGroupAccessor;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Interface for defining a data access utility responsible for providing an expanded query
 * interface to and caching {@link StationDefinition}s
 */
public interface StationDefinitionAccessor
    extends StationGroupAccessor,
        StationAccessor,
        ChannelGroupAccessor,
        ChannelAccessor,
        ResponseAccessor,
        FrequencyAmplitudePhaseRepository {

  Logger ILOGGER = LoggerFactory.getLogger(StationDefinitionAccessor.class);

  /**
   * Default action for caching - do not cache
   *
   * @param stationGroupNames the station group names to cache
   * @param startTime the start time of the time range
   * @param endTime the end time of the time range
   */
  default void cache(List<String> stationGroupNames, Instant startTime, Instant endTime) {
    // no op
    ILOGGER.info("default cache -> do nothing.");
  }
}
