package gms.shared.stationdefinition.cache.util;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableSortedSet;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.station.StationGroup.Data;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.ignite.IgniteCache;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StationDefinitionIdUtilityTest {

  public static final String STATION_GROUP_NAME = "All_1";
  public static final String STATION_NAME = "ABCD";
  public static final String CHANNEL_GROUP_NAME = STATION_NAME + ".ABCD1";
  public static final String CHANNEL_NAME = CHANNEL_GROUP_NAME + ".SHZ";
  public static final String DERIVED_CHANNEL_NAME =
      CHANNEL_NAME
          + "/beam/b/steer/az_57.736deg/slow_9.089s_per_deg/cdcb0098-5ba8-3e4e-8254-d7600ef38f81";

  @Mock
  private IgniteCache<DerivedChannelIdComponents, Channel> derivedChannelIdToChannelIgniteCache;

  @Mock
  private IgniteCache<Channel, DerivedChannelIdComponents> channelToDerivedChannelIdIgniteCache;

  @Mock private IgniteCache<Long, Response> wfidResponseIgniteCache;

  @Mock private IgniteCache<UUID, ChannelInstrumentPair> frequencyAmplitudePhaseCache;

  @Mock private SystemConfig systemConfig;
  @Mock private IgniteCache<UUID, String> channelNamesByResponseId;

  private static final Channel CHANNEL =
      Channel.builder()
          .setName(CHANNEL_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              Channel.Data.builder()
                  .setCanonicalName("Canonical Name One")
                  .setDescription("Example description")
                  .setStation(Station.createEntityReference(STATION_NAME))
                  .setChannelDataType(ChannelDataType.DIAGNOSTIC_SOH)
                  .setChannelBandType(ChannelBandType.BROADBAND)
                  .setChannelInstrumentType(ChannelInstrumentType.HIGH_GAIN_SEISMOMETER)
                  .setChannelOrientationType(ChannelOrientationType.VERTICAL)
                  .setChannelOrientationCode('Z')
                  .setUnits(Units.COUNTS_PER_NANOMETER)
                  .setNominalSampleRateHz(65.0)
                  .setLocation(Location.from(35.0, -125.0, 100.0, 5500.0))
                  .setOrientationAngles(Orientation.from(Optional.of(65.0), Optional.of(135.0)))
                  .setConfiguredInputs(List.of())
                  .setProcessingDefinition(Map.of())
                  .setProcessingMetadata(
                      Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, CHANNEL_GROUP_NAME))
                  .setResponse(UtilsTestFixtures.getResponse(CHANNEL_NAME))
                  .build())
          .build();
  private static final Channel DERIVED_CHANNEL =
      CHANNEL.toBuilder().setName(DERIVED_CHANNEL_NAME).build();
  private static final ChannelGroup CHANNEL_GROUP =
      ChannelGroup.builder()
          .setName(CHANNEL_GROUP_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              ChannelGroup.Data.builder()
                  .setDescription("Channel Group Description")
                  .setLocation(Location.from(35.0, -125.0, 100.0, 5500.0))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannels(List.of(CHANNEL))
                  .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
                  .build())
          .build();

  private static final Station STATION =
      Station.builder()
          .setName(STATION_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(50.0, 5.0, 10.0), CHANNEL)))
                  .setLocation(Location.from(35.647, 100.0, 50.0, 10.0))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL))
                  .build())
          .build();

  private static final StationGroup STATION_GROUP =
      StationGroup.builder()
          .setName(STATION_GROUP_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              Data.builder()
                  .setDescription("Test Station Group")
                  .setStations(List.of(STATION))
                  .build())
          .build();
  private static final String INVALID = "INVALID";

  @ParameterizedTest
  @MethodSource("getStationEntityForStaArguments")
  void testGetStationEntityForStaValidation(
      Class<? extends Exception> expectedException, String expectedMessage, String sta) {
    Exception exception =
        assertThrows(
            expectedException, () -> StationDefinitionIdUtility.getStationEntityForSta(sta));
    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getStationEntityForStaArguments() {
    return Stream.of(
        arguments(NullPointerException.class, "Cannot map station from null sta", null),
        arguments(IllegalStateException.class, "Cannot map station from empty sta", ""),
        arguments(IllegalStateException.class, "Cannot map station from empty sta", "     "));
  }

  @Test
  void testGetStationEntityForSta() {
    Station station = StationDefinitionIdUtility.getStationEntityForSta("test");
    assertNotNull(station);
    assertTrue(station.getData().isEmpty());
    assertTrue(station.getEffectiveAt().isEmpty());
    assertEquals("test", station.getName());
  }

  @Test
  void testGetCssKeyStationGroup() {
    final String result = StationDefinitionIdUtility.getCssKey(STATION_GROUP);
    assertNotNull(result);
    assertEquals(STATION_GROUP.getName(), result);
  }

  @Test
  void testGetCssKeyStationGroupNull() {
    final StationGroup stationGroup = null;
    final Exception exception =
        assertThrows(
            NullPointerException.class, () -> StationDefinitionIdUtility.getCssKey(stationGroup));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create CSS Key from a null object", exception.getMessage());
  }

  @Test
  void testGetCssKeyStation() {
    final SiteKey result = StationDefinitionIdUtility.getCssKey(STATION);
    assertNotNull(result);
    assertEquals(STATION.getName(), result.getStationCode());
    STATION
        .getEffectiveAt()
        .ifPresentOrElse(
            instant -> assertEquals(instant, result.getOnDate()),
            () -> assertNull(result.getOnDate()));
  }

  @Test
  void testGetCssKeyStationNull() {
    final Station station = null;
    final Exception exception =
        assertThrows(
            NullPointerException.class, () -> StationDefinitionIdUtility.getCssKey(station));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create CSS Key from a null object", exception.getMessage());
  }

  @Test
  void testGetCssKeyStationFacet() {
    final Station station = Station.createEntityReference(STATION_NAME);
    final Exception exception =
        assertThrows(
            IllegalStateException.class, () -> StationDefinitionIdUtility.getCssKey(station));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create SiteKey from entity reference", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelGroup() {
    final SiteKey result = StationDefinitionIdUtility.getCssKey(CHANNEL_GROUP);
    assertNotNull(result);
    assertEquals(CHANNEL_GROUP.getName().split("\\.")[0], result.getStationCode());
    CHANNEL_GROUP
        .getEffectiveAt()
        .ifPresentOrElse(
            effectiveAt -> assertEquals(effectiveAt, result.getOnDate()),
            () -> assertNull(result.getOnDate()));
  }

  @Test
  void testGetCssKeyChannelGroupBlankChannelName() {
    final ChannelGroup channelGroup = CHANNEL_GROUP.toBuilder().setName(" ").build();
    final Exception exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> StationDefinitionIdUtility.getCssKey(channelGroup));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals(
        "COI ID string, ' ', does not contain expected delimiter '.'", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelGroupNull() {
    final ChannelGroup channelGroup = null;
    final Exception exception =
        assertThrows(
            NullPointerException.class, () -> StationDefinitionIdUtility.getCssKey(channelGroup));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create CSS Key from a null object", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelGroupFacet() {
    final ChannelGroup channelGroup = ChannelGroup.createEntityReference(CHANNEL_GROUP_NAME);
    final Exception exception =
        assertThrows(
            IllegalStateException.class, () -> StationDefinitionIdUtility.getCssKey(channelGroup));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create SiteKey from entity reference", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelGroupInvalidChannelNameNoDelimiters() {
    var testChannelGroup = CHANNEL_GROUP.toBuilder().setName(INVALID).build();
    final Exception exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> StationDefinitionIdUtility.getCssKey(testChannelGroup));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals(
        "COI ID string, 'INVALID', does not contain expected delimiter '.'",
        exception.getMessage());
  }

  @Test
  void testGetCssKeyChannel() {
    final SiteChanKey result = StationDefinitionIdUtility.getCssKey(CHANNEL);
    assertNotNull(result);
    assertEquals(CHANNEL.getName().split("\\.")[1], result.getStationCode());
    assertEquals(CHANNEL.getName().split("\\.")[2], result.getChannelCode());
    CHANNEL
        .getEffectiveAt()
        .ifPresentOrElse(
            effectiveAt -> assertEquals(effectiveAt, result.getOnDate()),
            () -> assertNull(result.getOnDate()));
  }

  @Test
  void testGetCssKeyDerivedChannel() {
    final SiteChanKey result = StationDefinitionIdUtility.getCssKey(DERIVED_CHANNEL);
    assertNotNull(result);
    assertEquals(DERIVED_CHANNEL.getName().split("\\.")[1], result.getStationCode());
    assertEquals(
        DERIVED_CHANNEL.getName().split("\\.")[2].subSequence(0, 3), result.getChannelCode());
    DERIVED_CHANNEL
        .getEffectiveAt()
        .ifPresentOrElse(
            effectiveAt -> assertEquals(effectiveAt, result.getOnDate()),
            () -> assertNull(result.getOnDate()));
  }

  @Test
  void testGetCssKeyChannelNull() {
    final Channel channel = null;
    final Exception exception =
        assertThrows(
            NullPointerException.class, () -> StationDefinitionIdUtility.getCssKey(channel));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create CSS Key from a null object", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelFacet() {
    final Channel channel = Channel.createEntityReference(CHANNEL_NAME);
    final Exception exception =
        assertThrows(
            IllegalStateException.class, () -> StationDefinitionIdUtility.getCssKey(channel));

    assertNotNull(exception);
    assertNotNull(exception.getMessage());
    assertEquals("Cannot create SiteChanKey from entity reference", exception.getMessage());
  }

  @Test
  void testGetCssKeyChannelBlankChannelName() {
    var testChannel = CHANNEL.toBuilder().setName(" ").build();
    final Exception exception =
        assertThrows(
            IllegalStateException.class, () -> StationDefinitionIdUtility.getCssKey(testChannel));

    assertNotNull(exception);
  }

  @Test
  void testGetCssKeyChannelInvalidChannelNameNoDelimiters() {
    var invalidNameChannel = CHANNEL.toBuilder().setName(INVALID).build();
    final Exception exception =
        assertThrows(
            IllegalStateException.class,
            () -> StationDefinitionIdUtility.getCssKey(invalidNameChannel));

    assertNotNull(exception);
  }

  @Test
  void testGetCssKeyChannelInvalidChannelNameNotEnoughDelimiters() {
    var testChannel = CHANNEL.toBuilder().setName(CHANNEL_GROUP_NAME).build();
    final Exception exception =
        assertThrows(
            IllegalStateException.class, () -> StationDefinitionIdUtility.getCssKey(testChannel));

    assertNotNull(exception);
  }

  @Test
  void testStoreAndRetrieveChannelNamesByResponseId() {
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);
    UUID responseId = UUID.fromString("10000000-100-0000-1000-100000000073");
    when(channelNamesByResponseId.get(responseId)).thenReturn("testChannelName");
    assertDoesNotThrow(
        () -> idUtility.storeResponseIdChannelNameMapping(responseId, "testChannelName"));
    Optional<String> actual = idUtility.getChannelForResponseId(responseId);
    actual.ifPresentOrElse(name -> assertEquals("testChannelName", name), Assertions::fail);
  }

  @Test
  void testRetrieveUnstoredResponseId() {
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);
    Optional<String> actual =
        idUtility.getChannelForResponseId(UUID.fromString("10000000-100-0000-1000-100000000074"));
    assertTrue(actual.isEmpty());
  }

  @Test
  void testStoreAndRetrieveResponsesByWfid() {
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);
    var wfid = 1L;
    var response =
        Response.createEntityReference(UUID.fromString("10000000-100-0000-1000-100000000075"));
    when(wfidResponseIgniteCache.get(wfid)).thenReturn(response);
    assertDoesNotThrow(() -> idUtility.storeWfidResponseMapping(wfid, response));
    var actual = idUtility.getResponseForWfid(wfid);
    actual.ifPresentOrElse(response1 -> assertEquals(response, response1), Assertions::fail);
  }

  @Test
  void testRetrieveUnstoredResponseByWfid() {
    var wfid = 1L;
    when(wfidResponseIgniteCache.get(wfid)).thenReturn(null);
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);
    var actual = idUtility.getResponseForWfid(wfid);
    assertTrue(actual.isEmpty());
  }

  @ParameterizedTest
  @MethodSource("derivedChannelVersionRefTestSource")
  void testStoreAndRetrieveChannelVersionReferences(DerivedChannelIdComponents derivedChannelId) {
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);

    var derivedChannelVersionRef = Channel.createVersionReference(DERIVED_CHANNEL);

    assertDoesNotThrow(
        () -> idUtility.storeDerivedChannelMapping(derivedChannelId, DERIVED_CHANNEL));

    verify(derivedChannelIdToChannelIgniteCache).put(derivedChannelId, derivedChannelVersionRef);
    verify(channelToDerivedChannelIdIgniteCache).put(derivedChannelVersionRef, derivedChannelId);

    when(derivedChannelIdToChannelIgniteCache.get(derivedChannelId))
        .thenReturn(derivedChannelVersionRef);
    when(channelToDerivedChannelIdIgniteCache.get(derivedChannelVersionRef))
        .thenReturn(derivedChannelId);

    assertAll(
        () ->
            assertEquals(
                derivedChannelVersionRef, idUtility.getDerivedChannelById(derivedChannelId)),
        () ->
            assertEquals(
                derivedChannelId,
                idUtility.getDerivedChannelIdForChannel(derivedChannelVersionRef)));
  }

  static Stream<Arguments> derivedChannelVersionRefTestSource() {
    final long wfid = 111L;
    final var associatedRecordInfo =
        DerivedChannelIdComponents.AssociatedRecordInfo.create(TagName.ARID, 222L);
    final var filterId = 333L;
    return Stream.of(
        Arguments.arguments(DerivedChannelIdComponents.builder().setWfid(wfid).build()),
        Arguments.arguments(
            DerivedChannelIdComponents.builder().setWfid(wfid).setFilterId(filterId).build()),
        Arguments.arguments(
            DerivedChannelIdComponents.builder()
                .setWfid(wfid)
                .setAssociatedRecordInfo(associatedRecordInfo)
                .build()),
        Arguments.arguments(
            DerivedChannelIdComponents.builder()
                .setWfid(wfid)
                .setAssociatedRecordInfo(associatedRecordInfo)
                .setFilterId(filterId)
                .build()));
  }

  @Test
  void testFrequencyAmplitudePhaseStorageRetrieval() {
    var idUtility =
        new StationDefinitionIdUtility(
            systemConfig,
            derivedChannelIdToChannelIgniteCache,
            channelToDerivedChannelIdIgniteCache,
            wfidResponseIgniteCache,
            channelNamesByResponseId,
            frequencyAmplitudePhaseCache);

    var uuidStr =
        CHANNEL_NAME + Long.toString(CSSDaoTestFixtures.INSTRUMENT_DAO_1.getInstrumentId());
    var itemUUID = UUID.nameUUIDFromBytes(uuidStr.getBytes(StandardCharsets.UTF_8));

    var instrumentId = CSSDaoTestFixtures.INSTRUMENT_DAO_1.getInstrumentId();
    var storedUUID =
        idUtility.storeInstrumentIdFrequencyAmplitudePhaseMapping(CHANNEL_NAME, instrumentId);

    var pairData = new ChannelInstrumentPair(CHANNEL_NAME, instrumentId);

    verify(frequencyAmplitudePhaseCache).put(itemUUID, pairData);

    assertEquals(itemUUID, storedUUID, "Save UUID expected to match");

    when(frequencyAmplitudePhaseCache.get(itemUUID)).thenReturn(pairData);

    var retrieveChannelName =
        idUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(storedUUID);
    assertFalse(retrieveChannelName.isEmpty(), "UUID expected to retrieve channelName");
    assertEquals(
        CHANNEL_NAME, retrieveChannelName.get(), "Retrieved channelName expected to match");

    var retrieveInstrumentId =
        idUtility.retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(storedUUID);
    assertFalse(retrieveInstrumentId.isEmpty(), "UUID expected to retrieve InstrumentId");
    assertEquals(
        CSSDaoTestFixtures.INSTRUMENT_DAO_1.getInstrumentId(),
        retrieveInstrumentId.get(),
        "Retrieved InstrumentDao expected to match");
  }
}
