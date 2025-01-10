package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component("bridgedChannelUtil")
public class BridgedChannelUtil {

  private final SensorDatabaseConnector sensorDatabaseConnector;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final BridgedResponseRepository responseRepository;
  private final ChannelAssembler channelAssembler;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;

  public BridgedChannelUtil(
      SensorDatabaseConnector sensorDatabaseConnector,
      WfdiscDatabaseConnector wfdiscDatabaseConnector,
      ChannelAssembler channelAssembler,
      StationDefinitionIdUtility stationDefinitionIdUtility,
      BridgedResponseRepository responseRepository) {
    this.sensorDatabaseConnector = sensorDatabaseConnector;
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.channelAssembler = channelAssembler;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.responseRepository = responseRepository;
  }

  public List<Channel> findChannelsGivenSiteAndSiteChan(
      StationDefinitionDataHolder stationDefinitionDataHolder, Instant startTime, Instant endTime) {

    Objects.requireNonNull(stationDefinitionDataHolder.getSiteDaos());
    Objects.requireNonNull(stationDefinitionDataHolder.getSiteChanDaos());

    var data =
        BridgedRepositoryUtils.getSensorAndWfdiscData(
            stationDefinitionDataHolder, sensorDatabaseConnector, wfdiscDatabaseConnector);

    List<Response> responses =
        responseRepository.findResponsesGivenSensorAndWfdisc(data, startTime, endTime);
    List<Channel> channels =
        channelAssembler.buildAllForTimeRange(
            startTime,
            endTime,
            data.getSiteDaos(),
            data.getSiteChanDaos(),
            data.getSensorDaos(),
            data.getWfdiscVersions(),
            responses,
            data.getStartEndBoolean());

    cacheResponseIds(channels);
    return channels;
  }

  private void cacheResponseIds(List<Channel> channels) {
    channels.forEach(
        channel ->
            channel
                .getResponse()
                .map(Response::getId)
                .ifPresent(
                    id ->
                        stationDefinitionIdUtility.storeResponseIdChannelNameMapping(
                            id, channel.getName())));
  }
}
