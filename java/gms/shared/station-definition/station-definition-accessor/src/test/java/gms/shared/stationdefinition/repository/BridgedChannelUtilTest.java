package gms.shared.stationdefinition.repository;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE_1;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedChannelUtilTest {

  private final List<SiteChanDao> siteChanDaos = CSSDaoTestFixtures.getTestSiteChanDaos();
  private final List<SiteDao> siteDaos = CSSDaoTestFixtures.getTestSiteDaos();
  private final List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
  private final List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();
  private StartAndEndForSiteAndSiteChan startAndEndBooleans = new StartAndEndForSiteAndSiteChan();

  @Mock private SensorDatabaseConnector sensorDatabaseConnector;

  @Mock private WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock private ChannelAssembler channelAssembler;

  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;

  @Mock private BridgedResponseRepository responseRepository;

  private BridgedChannelUtil bridgedChannelUtil;
  private List<String> channelNames;

  @BeforeEach
  void setUp() {
    bridgedChannelUtil =
        new BridgedChannelUtil(
            sensorDatabaseConnector,
            wfdiscDatabaseConnector,
            channelAssembler,
            stationDefinitionIdUtility,
            responseRepository);

    channelNames =
        List.of(
            "REF.STA.NO1",
            "REF.STA.NO2",
            "REF.STA.NO3",
            "REF.STA.NO4",
            "REF.STA.NO5",
            "REF.STA.NO6");
  }

  @Test
  void testFindChannelsGivenSiteAndSiteChan() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plus(Duration.ofSeconds(5));

    var stationDefinitionDataHolder =
        new StationDefinitionDataHolder(
            siteDaos, siteChanDaos, null, null, null, startAndEndBooleans);
    var stationDefintionDataHolder2 =
        new StationDefinitionDataHolder(
            siteDaos, siteChanDaos, sensorDaos, null, wfdiscDaos, startAndEndBooleans);
    var responses = List.of(RESPONSE_1);
    var channels =
        List.of(
            CHANNEL.toBuilder().setName(channelNames.get(0)).build(),
            CHANNEL.toBuilder().setName(channelNames.get(1)).build(),
            CHANNEL.toBuilder().setName(channelNames.get(2)).build(),
            CHANNEL.toBuilder().setName(channelNames.get(3)).build(),
            CHANNEL.toBuilder().setName(channelNames.get(4)).build(),
            CHANNEL.toBuilder().setName(channelNames.get(5)).build());
    List<SiteChanKey> listOfSiteChanKeys =
        siteChanDaos.stream().map(SiteChanDao::getId).collect(Collectors.toList());

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(eq(listOfSiteChanKeys), any(), any()))
        .thenReturn(sensorDaos);
    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(
            eq(listOfSiteChanKeys), any(), any()))
        .thenReturn(wfdiscDaos);

    when(responseRepository.findResponsesGivenSensorAndWfdisc(any(), eq(startTime), eq(endTime)))
        .thenReturn(responses);
    when(channelAssembler.buildAllForTimeRange(
            eq(startTime),
            eq(endTime),
            eq(stationDefintionDataHolder2.getSiteDaos()),
            eq(stationDefintionDataHolder2.getSiteChanDaos()),
            eq(stationDefintionDataHolder2.getSensorDaos()),
            any(),
            eq(responses),
            any()))
        .thenReturn(channels);

    final List<Channel> result =
        bridgedChannelUtil.findChannelsGivenSiteAndSiteChan(
            stationDefinitionDataHolder, startTime, endTime);

    assertNotNull(result);
    assertEquals(channels.size(), result.size());
    verify(channelAssembler, times(1))
        .buildAllForTimeRange(
            eq(startTime),
            eq(endTime),
            Mockito.argThat(t -> t.containsAll(stationDefintionDataHolder2.getSiteDaos())),
            Mockito.argThat(t -> t.containsAll(stationDefintionDataHolder2.getSiteChanDaos())),
            Mockito.argThat(t -> t.containsAll(stationDefintionDataHolder2.getSensorDaos())),
            any(),
            any(),
            any());
  }
}
