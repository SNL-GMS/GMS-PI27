package gms.shared.stationdefinition.accessor;

import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_GROUP_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.RESPONSE_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.STATION_GROUP_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.STATION_TYPE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_FACET;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP_TEST;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_TWO;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE_FACET;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE_FULL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE_ONE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.RESPONSE_TWO;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_2;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_CHANGE_TIMES_REQUEST_200s;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_GROUP2;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.TreeRangeMap;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.api.station.util.StationChangeTimesRequest;
import gms.shared.stationdefinition.cache.VersionCache;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.NavigableSet;
import java.util.Optional;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EntityCachingStationDefinitionAccessorTest {

  public static final String TEST_NAME = "COI Test Name";
  public static final UUID TEST_UUID = UUID.nameUUIDFromBytes("COI_UUID".getBytes());
  public static final Instant START_TIME = Instant.EPOCH;
  public static final Instant END_TIME = Instant.EPOCH.plusSeconds(30);
  public static final Instant END_TIME2 = Instant.EPOCH.plusSeconds(15);

  @Mock private StationDefinitionAccessor delegate;
  @Mock private SystemConfig systemConfig;
  @Mock private ConfigurationConsumerUtility configurationConsumerUtility;
  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;
  @Mock private VersionCache cache;
  @Captor private ArgumentCaptor<NavigableSet<Instant>> rangeSetInstantCaptor;
  @Captor private ArgumentCaptor<RangeMap<Instant, Object>> rangeMapInstantObjectCaptor;
  @Captor private ArgumentCaptor<Instant> startTimeCaptor;
  @Captor private ArgumentCaptor<Instant> endTimeCaptor;
  @Captor private ArgumentCaptor<Range<Instant>> timeRangeCaptor;
  @Captor private ArgumentCaptor<String> entityIdCaptor;
  @Captor private ArgumentCaptor<List<String>> namesCaptor;
  @Captor private ArgumentCaptor<List<UUID>> uuidCaptor;
  @Captor private ArgumentCaptor<FacetingDefinition> facetCaptor;
  @Captor private ArgumentCaptor<List<StationGroup>> stationGroupListCaptor;
  @Captor private ArgumentCaptor<List<Station>> stationListCaptor;
  @Captor private ArgumentCaptor<List<ChannelGroup>> channelGroupListCaptor;
  @Captor private ArgumentCaptor<List<Channel>> channelListCaptor;
  NavigableSet<Instant> rangeSet = new TreeSet<>();

  StationDefinitionAccessor entityCacheAccessor;

  @BeforeEach
  public void beforeEach() {
    entityCacheAccessor =
        new EntityCachingStationDefinitionAccessor(
            mock(SystemConfig.class),
            configurationConsumerUtility,
            delegate,
            cache,
            stationDefinitionIdUtility);
    ReflectionTestUtils.setField(
        entityCacheAccessor,
        "operationalRange",
        new AtomicReference(Range.closed(Instant.MIN, Instant.MAX)));
    ReflectionTestUtils.setField(
        entityCacheAccessor,
        "stationDefinitionFacetingUtility",
        StationDefinitionFacetingUtility.create(entityCacheAccessor));
  }

  /*
   * ------------------------------ StationGroup Caching Tests
   * --------------------------------
   */
  @Test
  void testFindStationGroupsByNameAndTimeHit() {

    String stationGroupKey = StationGroup.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(stationGroupKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(stationGroupKey), any()))
        .thenReturn(STATION_GROUP);

    List<StationGroup> stationGroups =
        entityCacheAccessor.findStationGroupsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(stationGroups.isEmpty());
    assertEquals(STATION_GROUP, stationGroups.get(0));
  }

  @Test
  void testFindStationGroupsByNameAndTimeMiss() {
    when(delegate.findStationGroupsByNameAndTime(any(), any())).thenReturn(List.of(STATION_GROUP));

    List<StationGroup> response =
        entityCacheAccessor.findStationGroupsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // check the delegate call is correct
    verify(delegate)
        .findStationGroupsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(STATION_GROUP, response.get(0));
  }

  @Test
  void testFindStationGroupsByNameAndTimeFacetHit() {

    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(STATION_GROUP_TYPE.getValue(), true);

    String stationGroupKey = StationGroup.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(stationGroupKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(stationGroupKey), any()))
        .thenReturn(STATION_GROUP);

    List<StationGroup> stationGroups =
        entityCacheAccessor.findStationGroupsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(stationGroups.isEmpty());
    assertEquals(STATION_GROUP, stationGroups.get(0));
  }

  @Test
  void testFindStationGroupsByNameAndTimeFacetMiss() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(STATION_GROUP_TYPE.getValue(), false);

    when(delegate.findStationGroupsByNameAndTime(any(), any())).thenReturn(List.of(STATION_GROUP));

    List<StationGroup> response =
        entityCacheAccessor.findStationGroupsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate)
        .findStationGroupsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(STATION_GROUP.toBuilder().setData(Optional.empty()).build(), response.get(0));
  }

  @Test
  void testFindStationGroupsByNameAndTimeRangeHit() {
    rangeSet.addAll(List.of(START_TIME, END_TIME));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME), STATION_GROUP);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);

    List<StationGroup> response =
        entityCacheAccessor.findStationGroupsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(STATION_GROUP, response.get(0));
  }

  @Test
  void testFindStationGroupsByNameAndTimeRangeMiss() {
    rangeSet.addAll(List.of(START_TIME, END_TIME2));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME2), STATION_GROUP);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    when(delegate.findStationGroupsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(STATION_GROUP2));

    List<StationGroup> response =
        entityCacheAccessor.findStationGroupsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertTrue(response.contains(STATION_GROUP));
    assertTrue(response.contains(STATION_GROUP2));
  }

  /*
   * ------------------------------ Station Caching Tests
   * --------------------------------
   */
  @Test
  void testFindStationsByNameAndTimeHit() {

    var station = DefaultCoiTestFixtures.getDefaultStationForTime(TEST_NAME, START_TIME);
    String stationKey = Station.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(stationKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(stationKey), any())).thenReturn(station);

    List<Station> stations =
        entityCacheAccessor.findStationsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(stations.isEmpty());
    assertEquals(station, stations.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeMiss() {

    var station = DefaultCoiTestFixtures.getDefaultStationForTime(TEST_NAME, START_TIME);
    when(delegate.findStationsByNameAndTime(any(), any())).thenReturn(List.of(station));

    List<Station> response =
        entityCacheAccessor.findStationsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // check the delegate call is correct
    verify(delegate).findStationsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(station, response.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeFacetHit() throws JsonProcessingException {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(STATION_TYPE.getValue(), true);

    var station = DefaultCoiTestFixtures.getDefaultStationForTime(TEST_NAME, START_TIME);

    String stationKey = Station.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(stationKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(stationKey), any())).thenReturn(station);

    List<Station> stations =
        entityCacheAccessor.findStationsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(stations.isEmpty());
    assertEquals(station, stations.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeFacetHitIgnoreDuplicates() throws JsonProcessingException {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(STATION_TYPE.getValue(), true);

    var station = DefaultCoiTestFixtures.getDefaultStationForTime(TEST_NAME, START_TIME);

    String stationKey = Station.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(stationKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(stationKey), any())).thenReturn(station);

    List<Station> stations =
        entityCacheAccessor.findStationsByNameAndTime(
            List.of(TEST_NAME, TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(stations.isEmpty());
    assertEquals(1, stations.size());
    assertEquals(station, stations.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeFacetMiss() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(STATION_TYPE.getValue(), false);

    when(delegate.findStationsByNameAndTime(eq(List.of(TEST_NAME)), any()))
        .thenReturn(List.of(STATION));

    List<Station> response =
        entityCacheAccessor.findStationsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate).findStationsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(STATION.toBuilder().setData(Optional.empty()).build(), response.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeRangeHit() {
    rangeSet.addAll(List.of(START_TIME, END_TIME));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME), STATION);

    String stationKey = Station.class.getSimpleName().concat(TEST_NAME);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(stationKey)).thenReturn(rangeMap);

    List<Station> stations =
        entityCacheAccessor.findStationsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(stations.isEmpty());

    Station expectedStation =
        STATION.toBuilder()
            .setData(
                STATION.getData().orElseThrow().toBuilder()
                    .setChannelGroups(
                        List.of(
                            CHANNEL_GROUP.toBuilder()
                                .setData(
                                    CHANNEL_GROUP.getData().orElseThrow().toBuilder()
                                        .setChannels(
                                            List.of(
                                                CHANNEL.toEntityReference(),
                                                CHANNEL_TWO.toEntityReference()))
                                        .build())
                                .build()))
                    .setAllRawChannels(
                        List.of(CHANNEL.toEntityReference(), CHANNEL_TWO.toEntityReference()))
                    .build())
            .build();
    assertEquals(expectedStation, stations.get(0));
  }

  @Test
  void testFindStationsByNameAndTimeRangeMiss() {

    rangeSet.addAll(List.of(START_TIME, END_TIME2));

    when(delegate.findStationsByNameAndTimeRange(List.of(TEST_NAME), START_TIME, END_TIME))
        .thenReturn(List.of(STATION, STATION_2));

    List<Station> response =
        entityCacheAccessor.findStationsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());

    List<Channel> entityReferenceChannels =
        List.of(CHANNEL.toEntityReference(), CHANNEL_TWO.toEntityReference());
    List<ChannelGroup> facetedChannelGroup =
        List.of(
            CHANNEL_GROUP.toBuilder()
                .setData(
                    CHANNEL_GROUP.getData().orElseThrow().toBuilder()
                        .setChannels(entityReferenceChannels)
                        .build())
                .build());

    Station testStation1 =
        Station.createVersionReference(STATION.getName(), STATION.getEffectiveAt().get());
    testStation1 =
        testStation1.toBuilder()
            .setData(
                STATION.getData().orElseThrow().toBuilder()
                    .setAllRawChannels(entityReferenceChannels)
                    .setChannelGroups(facetedChannelGroup)
                    .build())
            .build();

    Station testStation2 =
        Station.createVersionReference(STATION_2.getName(), STATION_2.getEffectiveAt().get());
    testStation2 =
        testStation2.toBuilder()
            .setData(
                STATION_2.getData().orElseThrow().toBuilder()
                    .setAllRawChannels(entityReferenceChannels)
                    .setChannelGroups(facetedChannelGroup)
                    .build())
            .build();

    assertTrue(response.contains(testStation1));
    assertTrue(response.contains(testStation2));
  }

  @Test
  void testDetermineStationChangeTimes() {
    StationChangeTimesRequest changeRequest = UtilsTestFixtures.STATION_CHANGE_TIMES_REQUEST_700s;
    when(delegate.findStationsByNameAndTimeRange(
            List.of(changeRequest.getStation().getName()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(
            List.of(STATION.toBuilder().setEffectiveAt(Instant.EPOCH.plusSeconds(100)).build()));

    when(delegate.findChannelGroupsByNameAndTimeRange(
            List.of(CHANNEL_GROUP.getName()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(
            List.of(
                CHANNEL_GROUP.toBuilder().setEffectiveAt(Instant.EPOCH.plusSeconds(200)).build()));

    when(delegate.findChannelsByNameAndTimeRange(
            List.of(CHANNEL.getName(), CHANNEL_TWO.getName()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(
            List.of(
                CHANNEL.toBuilder().setEffectiveAt(Instant.EPOCH.plusSeconds(300)).build(),
                CHANNEL_TWO.toBuilder().setEffectiveAt(Instant.EPOCH.plusSeconds(400)).build()));

    when(delegate.findResponsesByIdAndTimeRange(
            List.of(
                UtilsTestFixtures.getResponse(CHANNEL.getName()).getId(),
                UtilsTestFixtures.getResponse(CHANNEL_TWO.getName()).getId()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(
            List.of(
                UtilsTestFixtures.getResponse(CHANNEL.getName()).toBuilder()
                    .setEffectiveAt(Instant.EPOCH.plusSeconds(600))
                    .build(),
                UtilsTestFixtures.getResponse(CHANNEL_TWO.getName()).toBuilder()
                    .setEffectiveAt(Instant.EPOCH.plusSeconds(500))
                    .build()));

    List<Instant> changeTimes =
        entityCacheAccessor.determineStationChangeTimes(
            changeRequest.getStation(), changeRequest.getStartTime(), changeRequest.getEndTime());
    assertEquals(6, changeTimes.size());
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(100)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(200)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(300)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(400)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(500)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(600)));
  }

  @Test
  void testDetermineStationChangeTimesOutOfRange() {
    StationChangeTimesRequest changeRequest = STATION_CHANGE_TIMES_REQUEST_200s;

    var time1 = Instant.EPOCH.plusSeconds(100);
    var time2 = Instant.EPOCH.plusSeconds(200);
    var stat1 = DefaultCoiTestFixtures.getDefaultStation("STA", time1);
    var stat2 = DefaultCoiTestFixtures.getDefaultStation("STA", time2);
    var chanGroup = stat2.getData().get().getChannelGroups().first();
    var chan = chanGroup.getChannels().first();

    when(delegate.findStationsByNameAndTimeRange(
            List.of(changeRequest.getStation().getName()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(List.of(stat1, stat2));

    when(delegate.findChannelsByNameAndTimeRange(
            List.of(chan.getName(), chan.getName()),
            changeRequest.getStartTime(),
            changeRequest.getEndTime()))
        .thenReturn(List.of(chan));

    List<Instant> changeTimes =
        entityCacheAccessor.determineStationChangeTimes(
            changeRequest.getStation(), changeRequest.getStartTime(), changeRequest.getEndTime());
    assertEquals(2, changeTimes.size());
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(100)));
    assertTrue(changeTimes.contains(Instant.EPOCH.plusSeconds(200)));
  }

  // /* ------------------------------
  // * ChannelGroups Caching Tests
  // -------------------------------- */
  //
  @Test
  void testFindChannelGroupsByNameAndTimeHit() {

    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));

    String channelGroupKey = ChannelGroup.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(channelGroupKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(channelGroupKey), any()))
        .thenReturn(CHANNEL_GROUP);

    List<ChannelGroup> channelGroups =
        entityCacheAccessor.findChannelGroupsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(channelGroups.isEmpty());
    assertEquals(CHANNEL_GROUP, channelGroups.get(0));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeMiss() {

    when(delegate.findChannelGroupsByNameAndTime(any(), any())).thenReturn(List.of(CHANNEL_GROUP));

    List<ChannelGroup> response =
        entityCacheAccessor.findChannelGroupsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // check the delegate call is correct
    verify(delegate)
        .findChannelGroupsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(CHANNEL_GROUP, response.get(0));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeFacetHit() {

    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_GROUP_TYPE.getValue(), true);

    String channelGroupKey = ChannelGroup.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(channelGroupKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(channelGroupKey), any()))
        .thenReturn(CHANNEL_GROUP);

    List<ChannelGroup> channelGroups =
        entityCacheAccessor.findChannelGroupsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(channelGroups.isEmpty());
    assertEquals(CHANNEL_GROUP, channelGroups.get(0));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeFacetMiss() {
    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_GROUP_TYPE.getValue(), false);

    when(delegate.findChannelGroupsByNameAndTime(any(), any())).thenReturn(List.of(CHANNEL_GROUP));

    List<ChannelGroup> response =
        entityCacheAccessor.findChannelGroupsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate)
        .findChannelGroupsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(CHANNEL_GROUP.toBuilder().setData(Optional.empty()).build(), response.get(0));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeRangeHit() {
    rangeSet.addAll(List.of(START_TIME, END_TIME));
    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME), CHANNEL_GROUP);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    List<ChannelGroup> response =
        entityCacheAccessor.findChannelGroupsByNameAndTimeRange(
            List.of(CHANNEL_GROUP.getName()), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(CHANNEL_GROUP, response.get(0));
  }

  @Test
  void testFindChannelGroupsByNameAndTimeRangeMiss() {
    rangeSet.addAll(List.of(START_TIME, END_TIME2));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME2), CHANNEL_GROUP);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    when(delegate.findChannelGroupsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(CHANNEL_GROUP_TEST));
    List<ChannelGroup> response =
        entityCacheAccessor.findChannelGroupsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertTrue(response.contains(CHANNEL_GROUP));
    assertTrue(response.contains(CHANNEL_GROUP_TEST));
  }

  // /* ---------------------------
  // * Channels Caching Tests
  // --------------------------- */
  //
  @Test
  void testFindChannelsByNameAndTimeHit() {
    // verify cache was called and response is correct
    String channelKey = Channel.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(channelKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(channelKey), any())).thenReturn(CHANNEL);
    List<Channel> response =
        entityCacheAccessor.findChannelsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(CHANNEL, response.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeMiss() {
    when(delegate.findChannelsByNameAndTime(eq(List.of(TEST_NAME)), any()))
        .thenReturn(List.of(CHANNEL));
    List<Channel> response =
        entityCacheAccessor.findChannelsByNameAndTime(List.of(TEST_NAME), START_TIME);

    // check the delegate call is correct
    verify(delegate).findChannelsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(CHANNEL, response.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeFacetPopulatedHit() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_TYPE.getValue(), true);

    // verify cache was called and response is correct
    String channelKey = Channel.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(channelKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(channelKey), any())).thenReturn(CHANNEL);

    List<Channel> channels =
        entityCacheAccessor.findChannelsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(channels.isEmpty());
    assertEquals(CHANNEL, channels.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeFacetUnpopulatedHit() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_TYPE.getValue(), false);

    String channelKey = Channel.class.getSimpleName().concat(TEST_NAME);
    when(cache.versionsByEntityIdAndTimeHasKey(channelKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(channelKey), any())).thenReturn(CHANNEL);

    List<Channel> channels =
        entityCacheAccessor.findChannelsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache, times(1))
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(channels.isEmpty());
    assertEquals(CHANNEL_FACET, channels.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeFacetPopulatedMiss() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_TYPE.getValue(), true);

    when(delegate.findChannelsByNameAndTime(any(), any())).thenReturn(List.of(CHANNEL));
    List<Channel> response =
        entityCacheAccessor.findChannelsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate).findChannelsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(CHANNEL, response.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeFacetUnpopulatedMiss() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(CHANNEL_TYPE.getValue(), false);

    when(delegate.findChannelsByNameAndTime(any(), any())).thenReturn(List.of(CHANNEL));
    List<Channel> channels =
        entityCacheAccessor.findChannelsByNameAndTime(
            List.of(TEST_NAME), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate).findChannelsByNameAndTime(namesCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_NAME, namesCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(CHANNEL_FACET, channels.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeRangeHit() {
    rangeSet.addAll(List.of(START_TIME, END_TIME));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME), CHANNEL);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    List<Channel> response =
        entityCacheAccessor.findChannelsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(CHANNEL, response.get(0));
  }

  @Test
  void testFindChannelsByNameAndTimeRangeMiss() {
    rangeSet.addAll(List.of(START_TIME, END_TIME2));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME2), CHANNEL);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    when(delegate.findChannelsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(CHANNEL_TWO));
    List<Channel> response =
        entityCacheAccessor.findChannelsByNameAndTimeRange(
            List.of(TEST_NAME), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertTrue(response.contains(CHANNEL));
    assertTrue(response.contains(CHANNEL_TWO));
  }

  // /* ---------------------------
  // * Responses Caching Tests
  // --------------------------- */
  @Test
  void testFindResponsesByIdHit() {
    var responseKey = Response.class.getSimpleName().concat(TEST_UUID.toString());
    when(cache.versionsByEntityIdAndTimeHasKey(responseKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(eq(responseKey), any())).thenReturn(RESPONSE);
    List<Response> response = entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME);

    // verify cache was called and response is correct
    verify(cache)
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(RESPONSE, response.get(0));
  }

  @Test
  void testFindResponseByIdMiss() {
    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));

    when(delegate.findResponsesById(any(), any())).thenReturn(List.of(RESPONSE));
    List<Response> response = entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME);

    // check the delegate call is correct
    verify(delegate).findResponsesById(uuidCaptor.capture(), startTimeCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_UUID, uuidCaptor.getValue().get(0));

    // check returns delegate response
    assertEquals(RESPONSE, response.get(0));
  }

  @Test
  void testFindResponsesByIdFacetHitPopulated() {
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(RESPONSE_TYPE.getValue(), true);

    String responseKey = Response.class.getSimpleName().concat(TEST_UUID.toString());
    when(cache.versionsByEntityIdAndTimeHasKey(responseKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(any(), any())).thenReturn(RESPONSE_FULL);
    List<Response> response =
        entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache)
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(RESPONSE_FULL, response.get(0));
  }

  @Test
  void testFindResponsesByIdFacetHitUnpopulated() {
    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(RESPONSE_TYPE.getValue(), false);

    String responseKey = Response.class.getSimpleName().concat(TEST_UUID.toString());
    when(cache.versionsByEntityIdAndTimeHasKey(responseKey)).thenReturn(true);
    when(cache.retrieveVersionsByEntityIdAndTime(any(), any())).thenReturn(RESPONSE_FULL);
    List<Response> response =
        entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME, facetingDefinition);

    // verify cache was called and response is correct
    verify(cache)
        .retrieveVersionsByEntityIdAndTime(entityIdCaptor.capture(), startTimeCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(RESPONSE_FACET, response.get(0));
  }

  @Test
  void testFindResponsesByIdFacetMissPopulated() {
    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(RESPONSE_TYPE.getValue(), true);

    when(delegate.findResponsesById(any(), any(), any())).thenReturn(List.of(RESPONSE_FULL));
    List<Response> response =
        entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate)
        .findResponsesById(uuidCaptor.capture(), startTimeCaptor.capture(), facetCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_UUID, uuidCaptor.getValue().get(0));
    assertEquals(facetingDefinition, facetCaptor.getValue());

    // check returns delegate response
    assertEquals(RESPONSE_FULL, response.get(0));
  }

  @Test
  void testFindResponsesByIdFacetMissUnpopulated() {
    rangeSet.addAll(List.of(Instant.now(), Instant.now().plusSeconds(30)));
    final FacetingDefinition facetingDefinition =
        getFacetingDefinition(RESPONSE_TYPE.getValue(), false);

    when(delegate.findResponsesById(any(), any(), any())).thenReturn(List.of(RESPONSE_FULL));
    List<Response> response =
        entityCacheAccessor.findResponsesById(List.of(TEST_UUID), START_TIME, facetingDefinition);

    // check the delegate call is correct
    verify(delegate)
        .findResponsesById(uuidCaptor.capture(), startTimeCaptor.capture(), facetCaptor.capture());
    assertEquals(START_TIME, startTimeCaptor.getValue());
    assertEquals(TEST_UUID, uuidCaptor.getValue().get(0));
    assertEquals(facetingDefinition, facetCaptor.getValue());

    // check returns delegate response
    assertEquals(RESPONSE_FACET, response.get(0));
  }

  @Test
  void testFindResponsesByIdAndTimeRangeHit() {
    rangeSet.addAll(List.of(START_TIME, END_TIME));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME), RESPONSE);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);

    List<Response> response =
        entityCacheAccessor.findResponsesByIdAndTimeRange(List.of(TEST_UUID), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertEquals(RESPONSE, response.get(0));
  }

  @Test
  void testFindResponsesByIdAndTimeRangeMiss() {
    rangeSet.addAll(List.of(START_TIME, END_TIME2));

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.closed(START_TIME, END_TIME2), RESPONSE);
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(rangeMap);
    when(delegate.findResponsesByIdAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(RESPONSE_TWO));
    List<Response> response =
        entityCacheAccessor.findResponsesByIdAndTimeRange(List.of(TEST_UUID), START_TIME, END_TIME);

    // verify cache was called and response is correct
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(entityIdCaptor.capture());
    assertFalse(response.isEmpty());
    assertTrue(response.contains(RESPONSE));
    assertTrue(response.contains(RESPONSE_TWO));
  }

  @Test
  void testLoadResponseFromWfdiscHit() {
    when(stationDefinitionIdUtility.getResponseForWfid(anyLong()))
        .thenReturn(Optional.of(RESPONSE_ONE));
    when(cache.retrieveVersionsByEntityIdAndTime(any(), any())).thenReturn(RESPONSE_ONE);

    var actual = entityCacheAccessor.loadResponseFromWfdisc(1L);

    verify(stationDefinitionIdUtility, times(1)).getResponseForWfid(anyLong());
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTime(any(), any());

    Assertions.assertEquals(RESPONSE_ONE, actual);

    verifyNoMoreInteractions(stationDefinitionIdUtility, cache);
  }

  @Test
  void testLoadResponseFromWfdiscHitTestNoEffectiveAt() {
    RangeMap entityMap = TreeRangeMap.create();

    entityMap.put(Range.closed(Instant.EPOCH, Instant.MAX), RESPONSE);

    when(stationDefinitionIdUtility.getResponseForWfid(anyLong()))
        .thenReturn(Optional.of(RESPONSE));
    when(cache.retrieveVersionsByEntityIdAndTimeRangeMap(any())).thenReturn(entityMap);

    var actual = entityCacheAccessor.loadResponseFromWfdisc(1L);

    verify(stationDefinitionIdUtility, times(1)).getResponseForWfid(anyLong());
    verify(cache, times(1)).retrieveVersionsByEntityIdAndTimeRangeMap(any());

    Assertions.assertEquals(RESPONSE, actual);

    verifyNoMoreInteractions(stationDefinitionIdUtility, cache);
  }

  @Test
  void testLoadResponseFromWfdiscMiss() {
    when(stationDefinitionIdUtility.getResponseForWfid(anyLong())).thenReturn(Optional.empty());
    when(delegate.loadResponseFromWfdisc(anyLong())).thenReturn(RESPONSE_ONE);

    var actual = entityCacheAccessor.loadResponseFromWfdisc(1L);

    verify(stationDefinitionIdUtility, times(1)).getResponseForWfid(anyLong());
    verify(delegate, times(1)).loadResponseFromWfdisc(anyLong());
    verify(delegate, times(1)).storeResponses(any());

    Assertions.assertEquals(RESPONSE_ONE, actual);

    verifyNoMoreInteractions(stationDefinitionIdUtility, delegate);
  }

  @Test
  void testStoreStationGroup() {
    StationGroup stationGroup = STATION_GROUP.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = "StationGroup" + stationGroup.getName();
    entityCacheAccessor.storeStationGroups(List.of(stationGroup));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
  }

  @Test
  void testStoreStationGroupTestExistingTimes() {
    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    StationGroup existngStationGroup =
        STATION_GROUP.toBuilder()
            .setEffectiveAt(END_TIME2.plusSeconds(5))
            .setEffectiveUntil(END_TIME2.plusSeconds(10))
            .build();
    String key = StationGroup.class.getSimpleName().concat(existngStationGroup.getName());
    rangeMap.put(
        Range.closed(
            existngStationGroup.getEffectiveAt().orElseThrow(),
            existngStationGroup.getEffectiveUntil().orElseThrow()),
        existngStationGroup.getName());
    StationGroup stationGroup = STATION_GROUP.toBuilder().setEffectiveAt(END_TIME2).build();
    entityCacheAccessor.storeStationGroups(List.of(stationGroup));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
  }

  @Test
  void testStoreStation() {
    Station station = STATION.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = Station.class.getSimpleName().concat(station.getName());
    entityCacheAccessor.storeStations(List.of(station));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeStations(stationListCaptor.capture());
  }

  @Test
  void testStoreStationTestExistingTimes() {
    Station station = STATION.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = Station.class.getSimpleName().concat(station.getName());
    entityCacheAccessor.storeStations(List.of(station));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeStations(stationListCaptor.capture());
  }

  @Test
  void testStoreChannelGroup() {
    ChannelGroup channelGroup = CHANNEL_GROUP.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = ChannelGroup.class.getSimpleName().concat(channelGroup.getName());
    entityCacheAccessor.storeChannelGroups(List.of(channelGroup));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeChannelGroups(channelGroupListCaptor.capture());
  }

  @Test
  void testStoreChannelGroupTestExistingTimes() {
    ChannelGroup channelGroup = CHANNEL_GROUP.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = ChannelGroup.class.getSimpleName().concat(channelGroup.getName());
    entityCacheAccessor.storeChannelGroups(List.of(channelGroup));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeChannelGroups(channelGroupListCaptor.capture());
  }

  @Test
  void testStoreChannel() {
    Channel channel = CHANNEL.toBuilder().setEffectiveAt(END_TIME2).build();
    String key = Channel.class.getSimpleName().concat(channel.getName());
    entityCacheAccessor.storeChannels(List.of(channel));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeChannels(channelListCaptor.capture());
  }

  @Test
  void testStoreChannelTestExistingTimes() {
    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    Channel existngChannel = CHANNEL.toBuilder().setEffectiveAt(END_TIME2.plusSeconds(5)).build();
    String key = Channel.class.getSimpleName().concat(existngChannel.getName());
    rangeMap.put(
        Range.closed(
            existngChannel.getEffectiveAt().orElseThrow(),
            existngChannel.getEffectiveUntil().orElseThrow()),
        existngChannel.getName());
    Channel channel = CHANNEL.toBuilder().setEffectiveAt(END_TIME2).build();
    entityCacheAccessor.storeChannels(List.of(channel));
    verify(cache).cacheVersionsByEntityIdAndTime(eq(key), any());
    verify(delegate).storeChannels(channelListCaptor.capture());
  }

  @Test
  void testStoreResponseValidation() {

    assertThrows(NullPointerException.class, () -> entityCacheAccessor.storeResponses(null));
  }

  @Test
  void testStoreResponses() {
    Response timeAdjResponse = RESPONSE.toBuilder().setEffectiveAt(START_TIME).build();
    List<Response> responses = List.of(timeAdjResponse);
    entityCacheAccessor.storeResponses(responses);
    verify(cache)
        .cacheVersionsByEntityIdAndTime(
            entityIdCaptor.capture(), rangeMapInstantObjectCaptor.capture());
    assertEquals(
        entityIdCaptor.getValue(),
        Response.class.getSimpleName().concat(responses.get(0).getId().toString()));
    assertEquals(rangeMapInstantObjectCaptor.getValue().get(START_TIME), (Object) timeAdjResponse);
  }

  @Test
  void testStoreResponsesExistingTimes() {
    Response existingResponse =
        RESPONSE_FULL.toBuilder()
            .setId(UUID.nameUUIDFromBytes("NEWID".getBytes()))
            .setEffectiveAt(Instant.EPOCH.plusSeconds(5))
            .build();

    RangeMap<Instant, Object> rangeMap = TreeRangeMap.create();
    rangeMap.put(Range.atLeast(existingResponse.getEffectiveAt().orElseThrow()), existingResponse);
    Response timeAdjResponse = RESPONSE.toBuilder().setEffectiveAt(START_TIME).build();
    List<Response> responses = List.of(timeAdjResponse);
    entityCacheAccessor.storeResponses(responses);
    verify(cache)
        .cacheVersionsByEntityIdAndTime(
            entityIdCaptor.capture(), rangeMapInstantObjectCaptor.capture());
    assertEquals(
        entityIdCaptor.getValue(),
        Response.class.getSimpleName().concat(responses.get(0).getId().toString()));
    assertEquals(rangeMapInstantObjectCaptor.getValue().get(START_TIME), timeAdjResponse);
  }

  @ParameterizedTest
  @MethodSource("getCacheArguments")
  void testCachingValidation(
      Class<? extends Exception> expectedException,
      List<String> stationGroupNames,
      Instant startTime,
      Instant endTime) {

    assertThrows(
        expectedException, () -> entityCacheAccessor.cache(stationGroupNames, startTime, endTime));
  }

  static Stream<Arguments> getCacheArguments() {
    return Stream.of(
        arguments(NullPointerException.class, null, START_TIME, END_TIME),
        arguments(NullPointerException.class, List.of("Test"), null, END_TIME),
        arguments(NullPointerException.class, List.of("Test"), START_TIME, null),
        arguments(IllegalStateException.class, List.of("Test"), END_TIME, START_TIME));
  }

  @Test
  void testCache() {
    when(delegate.findStationGroupsByNameAndTimeRange(
            List.of(STATION_GROUP.getName()), START_TIME, END_TIME))
        .thenReturn(List.of(STATION_GROUP));
    when(delegate.findStationsByNameAndTimeRange(List.of(STATION.getName()), START_TIME, END_TIME))
        .thenReturn(List.of(STATION));
    when(delegate.findChannelGroupsByNameAndTimeRange(
            List.of(CHANNEL_GROUP.getName()), START_TIME, END_TIME))
        .thenReturn(List.of(CHANNEL_GROUP));
    when(delegate.findChannelsByNameAndTimeRange(
            List.of(CHANNEL.getName(), CHANNEL_TWO.getName()), START_TIME, END_TIME))
        .thenReturn(List.of(CHANNEL, CHANNEL_TWO));
    when(delegate.findResponsesByIdAndTimeRange(
            List.of(
                CHANNEL.getResponse().map(Response::getId).orElseThrow(),
                CHANNEL_TWO.getResponse().map(Response::getId).orElseThrow()),
            START_TIME,
            END_TIME))
        .thenReturn(
            List.of(CHANNEL.getResponse().orElseThrow(), CHANNEL_TWO.getResponse().orElseThrow()));

    entityCacheAccessor.cache(List.of(STATION_GROUP.getName()), START_TIME, END_TIME);

    verify(cache, times(1)).clear();
    verify(delegate, times(1))
        .findStationGroupsByNameAndTimeRange(
            List.of(STATION_GROUP.getName()), START_TIME, END_TIME);
    verify(delegate, times(1))
        .findStationsByNameAndTimeRange(List.of(STATION.getName()), START_TIME, END_TIME);
    verify(delegate, times(1)).storeStations(List.of(STATION));
    verify(delegate, times(1))
        .findChannelGroupsByNameAndTimeRange(
            List.of(CHANNEL_GROUP.getName()), START_TIME, END_TIME);
    verify(delegate, times(1)).storeChannelGroups(List.of(CHANNEL_GROUP));

    verify(delegate, times(1))
        .findChannelsByNameAndTimeRange(
            List.of(CHANNEL.getName(), CHANNEL_TWO.getName()), START_TIME, END_TIME);
    verify(delegate, times(1)).storeChannels(List.of(CHANNEL, CHANNEL_TWO));
    verify(delegate, times(2))
        .storeResponses(
            List.of(CHANNEL.getResponse().orElseThrow(), CHANNEL_TWO.getResponse().orElseThrow()));

    verify(delegate, times(1))
        .findResponsesByIdAndTimeRange(
            List.of(
                CHANNEL.getResponse().map(Response::getId).orElseThrow(),
                CHANNEL_TWO.getResponse().map(Response::getId).orElseThrow()),
            START_TIME,
            END_TIME);

    verifyNoMoreInteractions(delegate);
  }

  public FacetingDefinition getFacetingDefinition(String classType, boolean populated) {
    return FacetingDefinition.builder().setClassType(classType).setPopulated(populated).build();
  }
}
