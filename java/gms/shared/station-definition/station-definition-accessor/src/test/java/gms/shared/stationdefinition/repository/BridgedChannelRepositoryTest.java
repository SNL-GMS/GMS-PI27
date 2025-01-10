package gms.shared.stationdefinition.repository;

import static gms.shared.derivedchannel.coi.BeamTestFixtures.BEAM_DEFINITION;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_STA_1_DAO_TIME_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.createSiteDao;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.createWfdiscDao;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.getTestSiteAndSurroundingDates;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHANID_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.END_TIME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.OFFDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA1_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFDISC_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_1;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.EVENT_BEAM_CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.FILTERED_EVENT_BEAM_CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.FILTERED_FK_BEAM_CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.FILTERED_RAW_CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.FILTER_DEFINITION;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.FK_BEAM_CHANNEL;
import static gms.shared.stationdefinition.utils.ChannelFactoryTestFixtures.RAW_CHANNEL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.TreeRangeMap;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamTestFixtures;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.cache.DerivedChannelVersionCache;
import gms.shared.stationdefinition.cache.util.DerivedChannelIdComponents;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.configuration.PhaseTypesByBeamDescriptions;
import gms.shared.stationdefinition.configuration.StationDefinitionBridgeConfiguration;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.MethodName.class)
@ExtendWith(OutputCaptureExtension.class)
class BridgedChannelRepositoryTest {

  private final List<SensorDao> sensorDaos = CSSDaoTestFixtures.getTestSensorDaos();
  private final List<WfdiscDao> wfdiscDaos = CSSDaoTestFixtures.getTestWfdiscDaos();
  private static final String REF = "REF";

  @Mock private BeamDatabaseConnector beamDatabaseConnector;

  @Mock private SiteDatabaseConnector siteDatabaseConnector;

  @Mock private SiteChanDatabaseConnector siteChanDatabaseConnector;

  @Mock private SensorDatabaseConnector sensorDatabaseConnector;

  @Mock private InstrumentDatabaseConnector instrumentDatabaseConnector;

  @Mock private WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock private ChannelAssembler channelAssembler;

  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;

  @Mock private DerivedChannelVersionCache versionCache;

  @Mock private BridgedResponseRepository responseRepository;

  @Mock private BridgedStationRepository stationRepository;

  @Mock private BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  @Mock private StationDefinitionBridgeConfiguration stationDefinitionBridgeConfiguration;

  private BridgedChannelRepository repository;
  private List<String> channelNames;

  private StartAndEndForSiteAndSiteChan startAndEndBooleans = new StartAndEndForSiteAndSiteChan();

  @BeforeEach
  void setUp() {
    repository =
        new BridgedChannelRepository(
            beamDatabaseConnector,
            siteDatabaseConnector,
            siteChanDatabaseConnector,
            sensorDatabaseConnector,
            wfdiscDatabaseConnector,
            channelAssembler,
            stationDefinitionIdUtility,
            versionCache,
            responseRepository,
            stationRepository,
            bridgedFilterDefinitionRepository,
            stationDefinitionBridgeConfiguration);

    channelNames =
        List.of(
            "REF.STA.NO1",
            "REF.STA.NO2",
            "REF.STA.NO3",
            "REF.STA.NO4",
            "REF.STA.NO5",
            "REF.STA.NO6");
  }

  private void verifyNoMoreMockInteractions() {
    verifyNoMoreInteractions(
        siteChanDatabaseConnector,
        siteDatabaseConnector,
        sensorDatabaseConnector,
        instrumentDatabaseConnector,
        wfdiscDatabaseConnector,
        channelAssembler);
  }

  @Test
  void testFindChannelsByNameAndTime() {
    Instant startTime = Instant.now();

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTime();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);

    when(channelAssembler.buildAllForTime(
            any(),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(
            List.of(
                CHANNEL.toBuilder().setName(channelNames.get(0)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(1)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(2)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(3)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(4)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(5)).build()));
    final List<Channel> result = repository.findChannelsByNameAndTime(channelNames, startTime);

    assertNotNull(result);
    assertEquals(channelNames.size(), result.size());
    verify(siteDatabaseConnector, times(1))
        .findSitesAndSurroundingDatesByStaCodeAndTimeRange(any(), any(), any());
    verify(siteChanDatabaseConnector, times(1))
        .findSiteChansAndSurroundingDatesByKeysAndTime(any(), any());
    verify(wfdiscDatabaseConnector, times(1)).findWfdiscsByNameAndTimeRange(any(), any(), any());
    verify(sensorDatabaseConnector, times(1)).findSensorsByKeyAndTimeRange(any(), any(), any());
    verify(channelAssembler, times(1))
        .buildAllForTime(
            eq(startTime),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any());
    verifyNoMoreMockInteractions();
  }

  @Test
  void testFindChannelsByNameAndTimeRange() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plus(Duration.ofSeconds(5));

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTimeRange();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);
    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);
    when(channelAssembler.buildAllForTimeRange(
            eq(startTime),
            eq(endTime),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(
            List.of(
                CHANNEL.toBuilder().setName(channelNames.get(0)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(1)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(2)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(3)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(4)).build(),
                CHANNEL.toBuilder().setName(channelNames.get(5)).build()));
    final List<Channel> result =
        repository.findChannelsByNameAndTimeRange(channelNames, startTime, endTime);

    assertNotNull(result);
    assertEquals(channelNames.size(), result.size());
    verify(siteDatabaseConnector, times(1))
        .findSitesAndSurroundingDatesByStaCodeAndTimeRange(any(), any(), any());
    verify(siteChanDatabaseConnector, times(1))
        .findSiteChansAndSurroundingDatesByKeysAndTimeRange(any(), eq(startTime), eq(endTime));
    verify(wfdiscDatabaseConnector, times(1)).findWfdiscsByNameAndTimeRange(any(), any(), any());
    verify(sensorDatabaseConnector, times(1)).findSensorsByKeyAndTimeRange(any(), any(), any());
    verify(channelAssembler, times(1))
        .buildAllForTimeRange(
            eq(startTime),
            eq(endTime),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any());
    verifyNoMoreMockInteractions();
  }

  @Test
  void testChannelEffectiveTimeBeforeChannelEndTimeThrowsIllegalState() {
    List<Long> wfids = Collections.singletonList(1L);
    var associatedRecordId = 1L;
    var associatedRecordType = TagName.ARID;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    assertThrows(
        IllegalStateException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids,
                associatedRecordType,
                associatedRecordId,
                channelEndTime,
                channelEffectiveTime));
  }

  @Test
  void testAssociatedRecordTypePresentThrowsIllegalState() {
    List<Long> wfids = Collections.singletonList(1L);
    var associatedRecordType = TagName.ARID;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    assertThrows(
        IllegalStateException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids, associatedRecordType, null, channelEffectiveTime, channelEndTime));
  }

  @Test
  void testAssociatedRecordIdPresentThrowsIllegalState() {
    List<Long> wfids = Collections.singletonList(1L);
    var associatedRecordId = 2L;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    assertThrows(
        IllegalStateException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids, null, associatedRecordId, channelEffectiveTime, channelEndTime));
  }

  @Test
  void testAssociatedRecordsPresentWfidsEmptyThrowsIllegalState() {
    List<Long> wfids = List.of();
    var associatedRecordId = 2L;
    var associatedRecordType = TagName.ARID;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    assertThrows(
        IllegalStateException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids,
                associatedRecordType,
                associatedRecordId,
                channelEffectiveTime,
                channelEndTime));
  }

  @Test
  void testAssociatedRecordsPresentMultipleWfidsThrowsIllegalState() {
    List<Long> wfids = List.of(1L, 2L);
    var associatedRecordId = 2L;
    var associatedRecordType = TagName.ARID;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(5));
    assertThrows(
        IllegalStateException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids,
                associatedRecordType,
                associatedRecordId,
                channelEffectiveTime,
                channelEndTime));
  }

  @Test
  void testInvalidLoadChannelFromWfdiscRawChannelArray() {

    SiteDao siteDao =
        createSiteDao(
            SITE_DAO_1.getReferenceStation(),
            ONDATE,
            CssDaoAndCoiParameters.OFFDATE,
            STA1_PARAM_MAP,
            StaType.ARRAY_STATION,
            REFERENCE_STATION);

    WfdiscDao wfdiscDao =
        createWfdiscDao(
            siteDao.getId().getStationCode(),
            CHAN1,
            ONDATE,
            END_TIME,
            WFID_1,
            CHANID_1,
            WFDISC_PARAM_MAP);

    List<Long> wfids = List.of(wfdiscDao.getId());
    Instant epochInst = Instant.EPOCH;
    Instant epochPlus = epochInst.plusSeconds(60);

    var exMsg =
        assertThrows(
            IllegalStateException.class,
            () -> repository.rawChannelFromWfdisc(wfids, epochInst, epochPlus));
  }

  @Test
  void testLoadChannelFromWfdiscRawChannelSingleStation() {

    WfdiscDao wfdiscDao =
        createWfdiscDao(STA1, CHAN1, ONDATE, END_TIME, WFID_1, CHANID_1, WFDISC_PARAM_MAP);

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfdiscDao.getId())))
        .thenReturn(List.of(wfdiscDao));

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTime();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);

    when(channelAssembler.buildAllForTime(
            any(),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(List.of(RAW_CHANNEL));

    Channel channel =
        repository.rawChannelFromWfdisc(
            List.of(wfdiscDao.getId()), Instant.EPOCH, Instant.EPOCH.plusSeconds(60));

    assertEquals(RAW_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscRawChannelArray() {
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTime();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);

    when(channelAssembler.buildAllForTime(
            any(),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(List.of(RAW_CHANNEL));

    Channel channel =
        repository.rawChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()), Instant.EPOCH, Instant.EPOCH.plusSeconds(60));

    assertEquals(RAW_CHANNEL, channel);
  }

  @Test
  void testCreateEventBeamDerivedChannel() {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    var siteChanKey =
        new SiteChanKey(
            WFDISC_TEST_DAO_1.getStationCode(),
            WFDISC_TEST_DAO_1.getChannelCode(),
            WFDISC_TEST_DAO_1.getTime());

    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(
            List.of(siteChanKey), WFDISC_TEST_DAO_1.getTime()))
        .thenReturn(List.of(SITE_CHAN_STA_1_DAO_TIME_1));
    BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.of(beamDao));
    Station station = UtilsTestFixtures.STATION;
    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));
    String beamDescriptionRecipe = repository.getBeamDescriptionRecipe(beamDao.getDescription());

    Map<String, PhaseType> phaseMap = Map.of(beamDescriptionRecipe, PhaseType.pP);
    when(stationDefinitionBridgeConfiguration.getBeamPhase())
        .thenReturn(PhaseTypesByBeamDescriptions.from(phaseMap));
    when(stationDefinitionBridgeConfiguration.getBeamformingTemplate(
            station, PhaseType.pP, BeamType.EVENT))
        .thenReturn(Optional.of(BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE));

    List<String> channelNameList =
        BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE.getInputChannels().stream()
            .map(channel -> channel.getName())
            .toList();
    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;
    Mockito.doReturn(List.of(UtilsTestFixtures.RAW_CHANNEL, UtilsTestFixtures.RAW_CHANNEL))
        .when(spyRepository)
        .findChannelsByNameAndTime(channelNameList, Instant.EPOCH);
    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));
    Assertions.assertTrue(returnChannel.isPresent());

    Assertions.assertTrue(
        returnChannel.get().getCanonicalName().contains("beam")
            && returnChannel.get().getCanonicalName().contains("coherent"));
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingStationCode(CapturedOutput capturedOutput) {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    String statCode = "lolo";
    WFDISC_TEST_DAO_1.setStationCode(statCode);

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    Assertions.assertTrue(returnChannel.isEmpty());

    assertTrue(capturedOutput.getOut().contains("Station " + statCode + " could not be found"));
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingBeamDao(CapturedOutput capturedOutput) {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    Station station = UtilsTestFixtures.STATION;

    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));

    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.empty());

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    Assertions.assertTrue(returnChannel.isEmpty());

    assertTrue(
        capturedOutput
            .getOut()
            .contains("No BeamDao found in DB for wfid: " + WFDISC_TEST_DAO_1.getId()));
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingBeamTemplate() {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    Station station = UtilsTestFixtures.STATION;

    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));

    BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.of(beamDao));

    String beamDescriptionRecipe = repository.getBeamDescriptionRecipe(beamDao.getDescription());

    Map<String, PhaseType> phaseMap = Map.of(beamDescriptionRecipe, PhaseType.pP);
    when(stationDefinitionBridgeConfiguration.getBeamPhase())
        .thenReturn(PhaseTypesByBeamDescriptions.from(phaseMap));

    when(stationDefinitionBridgeConfiguration.getBeamformingTemplate(
            station, PhaseType.pP, BeamType.EVENT))
        .thenReturn(Optional.empty());

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    Assertions.assertTrue(returnChannel.isEmpty());
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingInputChannels(CapturedOutput capturedOutput) {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    Station station = UtilsTestFixtures.STATION;

    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));

    BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.of(beamDao));

    String beamDescriptionRecipe = repository.getBeamDescriptionRecipe(beamDao.getDescription());

    Map<String, PhaseType> phaseMap = Map.of(beamDescriptionRecipe, PhaseType.pP);
    when(stationDefinitionBridgeConfiguration.getBeamPhase())
        .thenReturn(PhaseTypesByBeamDescriptions.from(phaseMap));

    when(stationDefinitionBridgeConfiguration.getBeamformingTemplate(
            station, PhaseType.pP, BeamType.EVENT))
        .thenReturn(Optional.of(BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE));

    List<String> channelNameList =
        BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE.getInputChannels().stream()
            .map(channel -> channel.getName())
            .toList();

    Mockito.doReturn(List.of())
        .when(spyRepository)
        .findChannelsByNameAndTime(channelNameList, Instant.EPOCH);

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    Assertions.assertTrue(returnChannel.isEmpty());

    assertTrue(
        capturedOutput
            .getOut()
            .contains(
                "Input channels are missing, therefore; the derived beam channel can't be"
                    + " properly created"));
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingSiteChanDao(CapturedOutput capturedOutput) {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    Station station = UtilsTestFixtures.STATION;

    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));

    BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.of(beamDao));

    String beamDescriptionRecipe = repository.getBeamDescriptionRecipe(beamDao.getDescription());

    Map<String, PhaseType> phaseMap = Map.of(beamDescriptionRecipe, PhaseType.pP);
    when(stationDefinitionBridgeConfiguration.getBeamPhase())
        .thenReturn(PhaseTypesByBeamDescriptions.from(phaseMap));

    when(stationDefinitionBridgeConfiguration.getBeamformingTemplate(
            station, PhaseType.pP, BeamType.EVENT))
        .thenReturn(Optional.of(BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE));

    List<String> channelNameList =
        BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE.getInputChannels().stream()
            .map(channel -> channel.getName())
            .toList();

    Mockito.doReturn(List.of(UtilsTestFixtures.RAW_CHANNEL, UtilsTestFixtures.RAW_CHANNEL))
        .when(spyRepository)
        .findChannelsByNameAndTime(channelNameList, Instant.EPOCH);

    var siteChanKey =
        new SiteChanKey(
            WFDISC_TEST_DAO_1.getStationCode(),
            WFDISC_TEST_DAO_1.getChannelCode(),
            WFDISC_TEST_DAO_1.getTime());

    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(
            List.of(siteChanKey), WFDISC_TEST_DAO_1.getTime()))
        .thenReturn(List.of());

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    Optional<Channel> returnChannel =
        spyRepository.createEventBeamDerivedChannel(
            WFDISC_TEST_DAO_1,
            TagName.EVID,
            3L,
            eventHypothesis,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    Assertions.assertTrue(returnChannel.isEmpty());

    assertTrue(capturedOutput.getOut().contains("No siteChanDao from which to load channel type"));
  }

  @Test
  void testCreateEventBeamDerivedChannelMissingBeamChannel(CapturedOutput capturedOutput) {
    BridgedChannelRepository spyRepository = Mockito.spy(repository);

    Station station = UtilsTestFixtures.STATION;

    when(stationRepository.findStationsByNameAndTime(
            List.of(WFDISC_TEST_DAO_1.getStationCode()), Instant.EPOCH))
        .thenReturn(List.of(station));

    BeamDao beamDao = CSSDaoTestFixtures.createBeamDao(WFDISC_TEST_DAO_1.getId());
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.of(beamDao));

    String beamDescriptionRecipe = repository.getBeamDescriptionRecipe(beamDao.getDescription());

    Map<String, PhaseType> phaseMap = Map.of(beamDescriptionRecipe, PhaseType.pP);
    when(stationDefinitionBridgeConfiguration.getBeamPhase())
        .thenReturn(PhaseTypesByBeamDescriptions.from(phaseMap));

    when(stationDefinitionBridgeConfiguration.getBeamformingTemplate(
            station, PhaseType.pP, BeamType.EVENT))
        .thenReturn(Optional.of(BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE));

    List<String> channelNameList =
        BeamTestFixtures.MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE.getInputChannels().stream()
            .map(channel -> channel.getName())
            .toList();

    List<Channel> inputChannels =
        List.of(UtilsTestFixtures.RAW_CHANNEL, UtilsTestFixtures.RAW_CHANNEL);

    Mockito.doReturn(inputChannels)
        .when(spyRepository)
        .findChannelsByNameAndTime(channelNameList, Instant.EPOCH);

    var siteChanKey =
        new SiteChanKey(
            WFDISC_TEST_DAO_1.getStationCode(),
            WFDISC_TEST_DAO_1.getChannelCode(),
            WFDISC_TEST_DAO_1.getTime());

    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(
            List.of(siteChanKey), WFDISC_TEST_DAO_1.getTime()))
        .thenReturn(List.of(SITE_CHAN_STA_1_DAO_TIME_1));

    EventHypothesis eventHypothesis = BeamTestFixtures.EVENT_HYPOTHESIS;

    try (MockedStatic<ChannelFactory> cf = Mockito.mockStatic(ChannelFactory.class)) {
      cf.when(
              () ->
                  ChannelFactory.createBeamed(
                      inputChannels, BEAM_DEFINITION, Pair.of(TagName.EVID, 3L)))
          .thenReturn(Optional.empty());

      Optional<Channel> returnChannel =
          spyRepository.createEventBeamDerivedChannel(
              WFDISC_TEST_DAO_1,
              TagName.EVID,
              3L,
              eventHypothesis,
              Instant.EPOCH,
              Instant.EPOCH.plusSeconds(60));

      Assertions.assertTrue(returnChannel.isEmpty());

      assertTrue(
          capturedOutput
              .getOut()
              .contains(
                  "Derived Beam Channel could not be created due to an error in ChannelFactory"));
    }
  }

  @Test
  void testLoadChannelFromWfdiscFkBeam() {

    var arrSite =
        CSSDaoTestFixtures.createSiteDao(
            REF, ONDATE, OFFDATE, STA1_PARAM_MAP, StaType.ARRAY_STATION, REF);
    var arrSiteChan =
        CSSDaoTestFixtures.createSiteChanDao(REF, CHAN1, ONDATE, OFFDATE, CHAN_PARAM_MAP, CHANID_1);

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSite));
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSiteChan));
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.empty());
    when(sensorDatabaseConnector.findSensorByKeyInRange(
            any(), any(), eq(Instant.EPOCH), eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(Optional.empty());

    when(channelAssembler.buildFromAssociatedRecord(
            anyMap(),
            any(),
            eq(arrSite),
            eq(WFDISC_TEST_DAO_1),
            eq(arrSiteChan),
            any(),
            eq(Instant.EPOCH),
            eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(FK_BEAM_CHANNEL);

    Channel channel =
        repository.beamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.ARID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    assertEquals(FK_BEAM_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscFkBeamEmptySiteChans() {
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of());

    Channel channel =
        repository.beamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.ARID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    assertNull(channel);
  }

  @Test
  void testLoadChannelFromWfdiscFkBeamEmptySites() {
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of());
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(SITE_CHAN_DAO_1));

    Channel channel =
        repository.beamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.ARID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60));

    assertNull(channel);
  }

  @Test
  void testLoadChannelFromWfdiscNull() {
    List<Long> wfids = List.of(WFDISC_TEST_DAO_1.getId());
    var associatedRecordId = 3L;
    var associatedRecordType = TagName.CLUSTAID;
    Instant channelEffectiveTime = Instant.EPOCH;
    Instant channelEndTime = channelEffectiveTime.plus(Duration.ofSeconds(60));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            repository.beamedChannelFromWfdisc(
                wfids,
                associatedRecordType,
                associatedRecordId,
                channelEffectiveTime,
                channelEndTime));
  }

  @Test
  void testDerivedCacheTime() {

    var testChan = DefaultCoiTestFixtures.getDefaultChannel();
    testChan = testChan.toBuilder().setName("REF.STA.BHZ").build();
    var key = Channel.class.getSimpleName().concat(testChan.getName());
    when(versionCache.versionsByEntityIdAndTimeHasKey(key)).thenReturn(true);
    when(versionCache.retrieveVersionsByEntityIdAndTime(key, testChan.getEffectiveAt().get()))
        .thenReturn(testChan);

    List<Channel> chans =
        repository.findChannelsByNameAndTime(
            List.of(testChan.getName()), testChan.getEffectiveAt().get());

    assertEquals(1, chans.size());
    assertEquals(testChan, chans.get(0));
  }

  @Test
  void testDerivedCacheTimeRange() {

    var testChan = DefaultCoiTestFixtures.getDefaultChannel();
    testChan = testChan.toBuilder().setName("REF.STA.BHZ").build();

    RangeMap<Instant, Object> cacheRangeMap = TreeRangeMap.create();
    cacheRangeMap.put(
        Range.open(testChan.getEffectiveAt().get(), testChan.getEffectiveUntil().get()), testChan);

    var key = Channel.class.getSimpleName().concat(testChan.getName());
    when(versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(key)).thenReturn(cacheRangeMap);

    List<Channel> chans =
        repository.findChannelsByNameAndTimeRange(
            List.of(testChan.getName()),
            testChan.getEffectiveAt().get(),
            testChan.getEffectiveUntil().get());

    assertEquals(1, chans.size());
    assertEquals(testChan, chans.get(0));
  }

  Pair<List<SiteDao>, List<SiteChanDao>> mockConnectorRepositoryInterfactionTime() {

    List<SiteAndSurroundingDates> sitesAndSurroundingDates = getTestSiteAndSurroundingDates();
    when(siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTimeRange(
            any(), any(), any()))
        .thenReturn(sitesAndSurroundingDates);
    List<SiteDao> updatedSiteDaos =
        sitesAndSurroundingDates.stream()
            .map(SiteAndSurroundingDates::getSiteDao)
            .collect(Collectors.toList());

    List<SiteChanAndSurroundingDates> siteChanAndSurroundingDates =
        CSSDaoTestFixtures.getTestSiteChanAndSurroundingDates();
    when(siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByKeysAndTime(any(), any()))
        .thenReturn(siteChanAndSurroundingDates);

    List<SiteChanDao> updatedSiteChanDaos =
        siteChanAndSurroundingDates.stream()
            .map(SiteChanAndSurroundingDates::getSiteChanDao)
            .collect(Collectors.toList());

    return Pair.of(updatedSiteDaos, updatedSiteChanDaos);
  }

  Pair<List<SiteDao>, List<SiteChanDao>> mockConnectorRepositoryInterfactionTimeRange() {

    List<SiteAndSurroundingDates> sitesAndSurroundingDates = getTestSiteAndSurroundingDates();
    when(siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTimeRange(
            any(), any(), any()))
        .thenReturn(sitesAndSurroundingDates);
    List<SiteDao> updatedSiteDaos =
        sitesAndSurroundingDates.stream()
            .map(SiteAndSurroundingDates::getSiteDao)
            .collect(Collectors.toList());

    List<SiteChanAndSurroundingDates> siteChanAndSurroundingDates =
        CSSDaoTestFixtures.getTestSiteChanAndSurroundingDates();
    when(siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByKeysAndTimeRange(
            any(), any(), any()))
        .thenReturn(siteChanAndSurroundingDates);

    List<SiteChanDao> updatedSiteChanDaos =
        siteChanAndSurroundingDates.stream()
            .map(SiteChanAndSurroundingDates::getSiteChanDao)
            .collect(Collectors.toList());

    return Pair.of(updatedSiteDaos, updatedSiteChanDaos);
  }

  // Pick a reasonable filter id, it doesn't matter which one.
  final long FILTER_ID = 1L;

  @Test
  void testLoadChannelFromWfdiscRawChannelArrayFiltered() {

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTime();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);

    when(channelAssembler.buildAllForTime(
            any(),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(List.of(RAW_CHANNEL));

    when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(Set.of(FILTER_ID)))
        .thenReturn(Map.of(FILTER_ID, FILTER_DEFINITION));

    Channel channel =
        repository.filteredRawChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    assertEquals(FILTERED_RAW_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscFkBeamFiltered() {
    var arrSite =
        CSSDaoTestFixtures.createSiteDao(
            REF, ONDATE, OFFDATE, STA1_PARAM_MAP, StaType.ARRAY_STATION, REF);
    var arrSiteChan =
        CSSDaoTestFixtures.createSiteChanDao(REF, CHAN1, ONDATE, OFFDATE, CHAN_PARAM_MAP, CHANID_1);

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSite));
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSiteChan));
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.empty());
    when(sensorDatabaseConnector.findSensorByKeyInRange(
            any(), any(), eq(Instant.EPOCH), eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(Optional.empty());

    when(channelAssembler.buildFromAssociatedRecord(
            anyMap(),
            any(),
            eq(arrSite),
            eq(WFDISC_TEST_DAO_1),
            eq(arrSiteChan),
            any(),
            eq(Instant.EPOCH),
            eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(FK_BEAM_CHANNEL);

    when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(Set.of(FILTER_ID)))
        .thenReturn(Map.of(FILTER_ID, FILTER_DEFINITION));

    Channel channel =
        repository.filteredBeamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.ARID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    var idBeam =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.ARID, 3L))
            .build();

    var idFiltered =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setFilterId(FILTER_ID)
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.ARID, 3L))
            .build();

    var orderVerifier = inOrder(stationDefinitionIdUtility);
    orderVerifier.verify(stationDefinitionIdUtility).getDerivedChannelById(idFiltered);
    orderVerifier.verify(stationDefinitionIdUtility).getDerivedChannelById(idBeam);

    assertEquals(FILTERED_FK_BEAM_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscEventBeamFilteredCached() {

    var id =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setFilterId(FILTER_ID)
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.EVID, 3L))
            .build();

    when(stationDefinitionIdUtility.getDerivedChannelById(id))
        .thenReturn(Channel.createVersionReference(FILTERED_EVENT_BEAM_CHANNEL));

    when(versionCache.retrieveVersionsByEntityIdAndTime(
            Channel.class.getSimpleName().concat(FILTERED_EVENT_BEAM_CHANNEL.getName()),
            FILTERED_EVENT_BEAM_CHANNEL.getEffectiveAt().orElseThrow()))
        .thenReturn(FILTERED_EVENT_BEAM_CHANNEL);

    when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(Set.of(FILTER_ID)))
        .thenReturn(Map.of(FILTER_ID, FILTER_DEFINITION));

    Channel channel =
        repository.filteredBeamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.EVID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    assertEquals(FILTERED_EVENT_BEAM_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscEventBeamFilteredInputCached() {

    var idBeam =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.EVID, 3L))
            .build();

    var idFiltered =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setFilterId(FILTER_ID)
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.EVID, 3L))
            .build();

    when(stationDefinitionIdUtility.getDerivedChannelById(idFiltered)).thenReturn(null);

    when(stationDefinitionIdUtility.getDerivedChannelById(idBeam))
        .thenReturn(Channel.createVersionReference(EVENT_BEAM_CHANNEL));

    when(versionCache.retrieveVersionsByEntityIdAndTime(
            Channel.class.getSimpleName().concat(EVENT_BEAM_CHANNEL.getName()),
            EVENT_BEAM_CHANNEL.getEffectiveAt().orElseThrow()))
        .thenReturn(EVENT_BEAM_CHANNEL);

    when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(Set.of(FILTER_ID)))
        .thenReturn(Map.of(FILTER_ID, FILTER_DEFINITION));

    Channel channel =
        repository.filteredBeamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.EVID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    // verify(channelAssembler, times(0));
    assertEquals(FILTERED_EVENT_BEAM_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscRawFilteredCached() {

    var idFiltered =
        DerivedChannelIdComponents.builder()
            .setWfid(WFDISC_TEST_DAO_1.getId())
            .setFilterId(FILTER_ID)
            .build();

    when(stationDefinitionIdUtility.getDerivedChannelById(idFiltered))
        .thenReturn(FILTERED_RAW_CHANNEL);

    when(versionCache.retrieveVersionsByEntityIdAndTime(
            Channel.class.getSimpleName().concat(FILTERED_RAW_CHANNEL.getName()),
            FILTERED_RAW_CHANNEL.getEffectiveAt().orElseThrow()))
        .thenReturn(FILTERED_RAW_CHANNEL);

    when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(Set.of(FILTER_ID)))
        .thenReturn(Map.of(FILTER_ID, FILTER_DEFINITION));

    Channel channel =
        repository.filteredRawChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    // verify(channelAssembler, times(0));
    assertEquals(FILTERED_RAW_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscFkBeamFilterNoFd() {

    var arrSite =
        CSSDaoTestFixtures.createSiteDao(
            REF, ONDATE, OFFDATE, STA1_PARAM_MAP, StaType.ARRAY_STATION, REF);
    var arrSiteChan =
        CSSDaoTestFixtures.createSiteChanDao(REF, CHAN1, ONDATE, OFFDATE, CHAN_PARAM_MAP, CHANID_1);

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));
    when(siteDatabaseConnector.findSitesByStationCodesAndStartTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSite));
    when(siteChanDatabaseConnector.findSiteChansByKeyAndTime(anyList(), eq(Instant.EPOCH)))
        .thenReturn(List.of(arrSiteChan));
    when(beamDatabaseConnector.findBeamForWfid(WFDISC_TEST_DAO_1.getId()))
        .thenReturn(Optional.empty());
    when(sensorDatabaseConnector.findSensorByKeyInRange(
            any(), any(), eq(Instant.EPOCH), eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(Optional.empty());

    when(channelAssembler.buildFromAssociatedRecord(
            anyMap(),
            any(),
            eq(arrSite),
            eq(WFDISC_TEST_DAO_1),
            eq(arrSiteChan),
            any(),
            eq(Instant.EPOCH),
            eq(Instant.EPOCH.plusSeconds(60))))
        .thenReturn(FK_BEAM_CHANNEL);

    // Call with a filterid. Since we are not specifiying behavior for the mocked
    // bridgedFilterDefinitionRepository, it will return null when
    // loadFilterDefinitionsForFilterIds is called, which is the behvior we need
    // to test this case.
    Channel channel =
        repository.filteredBeamedChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            TagName.ARID,
            3L,
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    assertEquals(FK_BEAM_CHANNEL, channel);
  }

  @Test
  void testLoadChannelFromWfdiscRawChannelArrayFilterNoFd() {

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(WFDISC_TEST_DAO_1.getId())))
        .thenReturn(List.of(WFDISC_TEST_DAO_1));

    Pair<List<SiteDao>, List<SiteChanDao>> siteAndSiteChans =
        mockConnectorRepositoryInterfactionTime();
    var updatedSiteDaos = siteAndSiteChans.getLeft();
    var updatedSiteChanDaos = siteAndSiteChans.getRight();

    when(wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(wfdiscDaos);

    when(sensorDatabaseConnector.findSensorsByKeyAndTimeRange(any(), any(), any()))
        .thenReturn(sensorDaos);

    when(channelAssembler.buildAllForTime(
            any(),
            Mockito.argThat(t -> t.containsAll(updatedSiteDaos)),
            Mockito.argThat(t -> t.containsAll(updatedSiteChanDaos)),
            Mockito.argThat(t -> t.containsAll(sensorDaos)),
            any(),
            any(),
            any()))
        .thenReturn(List.of(RAW_CHANNEL));

    Channel channel =
        repository.filteredRawChannelFromWfdisc(
            List.of(WFDISC_TEST_DAO_1.getId()),
            Instant.EPOCH,
            Instant.EPOCH.plusSeconds(60),
            FILTER_ID);

    assertEquals(RAW_CHANNEL, channel);
  }
}
