package gms.shared.stationdefinition.coi.station;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_TEST;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.createTestStationData;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.id.VersionId;
import gms.shared.stationdefinition.coi.utils.StationDefinitionObject;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class StationTest {
  private static final Object NULL_OBJECT = null;

  private static final Logger LOGGER = LoggerFactory.getLogger(StationTest.class);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(STATION, Station.class);
  }

  @Test
  void testGetRelativePositionsMapFaceting() {
    Map<Channel, RelativePosition> relativePositionsByChannel =
        STATION.getRelativePositionsByChannel();
    for (RelativePositionChannelPair pair : STATION.getRelativePositionChannelPairs()) {
      assertTrue(relativePositionsByChannel.containsKey(pair.getChannel().toEntityReference()));
      assertEquals(
          pair.getRelativePosition(),
          relativePositionsByChannel.get(pair.getChannel().toEntityReference()));
    }
  }

  @Test
  void testBuildPartialFacet() {
    Station.Data.Builder builder = Station.Data.builder().setDescription("test");
    IllegalStateException exception =
        assertThrows(IllegalStateException.class, () -> builder.build());
    assertEquals(
        "Either all FacetedDataClass fields must be populated or none of them can be populated",
        exception.getMessage());
  }

  @Test
  void testEmptyNameThrowsException() {
    Exception exception =
        assertThrows(
            Exception.class,
            () ->
                Station.builder()
                    .setName("")
                    .setEffectiveAt(Instant.now())
                    .setData(
                        Station.Data.builder()
                            .setType(StationType.HYDROACOUSTIC)
                            .setDescription("")
                            .setRelativePositionChannelPairs(
                                List.of(
                                    RelativePositionChannelPair.create(
                                        RelativePosition.from(100.0, 50.0, 50.0),
                                        UtilsTestFixtures.CHANNEL)))
                            .setLocation(Location.from(0.0, 100.0, 50.0, 10.0))
                            .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                            .setChannelGroups(List.of(UtilsTestFixtures.CHANNEL_GROUP))
                            .setAllRawChannels(List.of(UtilsTestFixtures.CHANNEL))
                            .build())
                    .build());
    assertEquals("Station must be provided a name", exception.getMessage());
  }

  @Test
  void testEmptyMapOfRelativePositionsThrowsException() {
    Exception exception =
        assertThrows(
            Exception.class,
            () ->
                STATION.toBuilder()
                    .setData(
                        STATION.getData().orElseThrow().toBuilder()
                            .setRelativePositionChannelPairs(List.of())
                            .build())
                    .build());
    assertEquals(
        "Station being passed an empty or null map of relative positions for channels it manages",
        exception.getMessage());
  }

  @Test
  void testEmptyListOfChannelsThrowsException() {
    Exception exception =
        assertThrows(
            Exception.class,
            () ->
                STATION.toBuilder()
                    .setData(
                        STATION.getData().orElseThrow().toBuilder()
                            .setAllRawChannels(new TreeSet<>())
                            .build())
                    .build());
    assertEquals("Station must have a non-empty list of channels", exception.getMessage());
  }

  @Test
  void testEmptyListOfChannelGroupsThrowsException() {
    Exception exception =
        assertThrows(
            Exception.class,
            () ->
                STATION.toBuilder()
                    .setData(
                        STATION.getData().orElseThrow().toBuilder()
                            .setChannelGroups(new TreeSet<>())
                            .build())
                    .build());
    assertEquals("Station must have a non-empty list of channel groups", exception.getMessage());
  }

  @Test
  void testMapOfRelativePositionsNotAssociatedWithChannelsStationManagesThrowsException() {
    Exception exception =
        assertThrows(
            Exception.class,
            () ->
                STATION.toBuilder()
                    .setData(
                        STATION.getData().orElseThrow().toBuilder()
                            .setRelativePositionChannelPairs(
                                List.of(
                                    RelativePositionChannelPair.create(
                                        RelativePosition.from(100.0, 55.0, 67.0), CHANNEL_TEST)))
                            .build())
                    .build());
    assertNotNull(exception);
  }

  @Test
  void testStationContainsChannelNotInChannelGroupThrowsException() {

    assertNotEquals(UtilsTestFixtures.CHANNEL_TWO, UtilsTestFixtures.CHANNEL);

    ChannelGroup channelGroup = UtilsTestFixtures.CHANNEL_2_GROUP;

    var builder =
        STATION.getData().orElseThrow().toBuilder()
            .setChannelGroups(List.of(UtilsTestFixtures.CHANNEL_2_GROUP))
            .setAllRawChannels(List.of(UtilsTestFixtures.CHANNEL_TWO, UtilsTestFixtures.CHANNEL));

    final IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class, () -> builder.build());

    assertEquals("All raw channels must be present in channel groups.", exception.getMessage());
  }

  @Test
  void testStationCreateEntityReferenceSerializeToAndFrom() throws JsonProcessingException {
    final Station station = getNameFacetStation("test");
    JsonTestUtilities.assertSerializes(station, Station.class);
  }

  @Test
  void testStationCreateEntityReferencePresent() {
    final Station station = getNameFacetStation("test");

    assertFalse(station.isPresent());
  }

  @Test
  void testStationGroupCreateEntityReferenceEmptyName() {
    final var exception =
        assertThrows(IllegalArgumentException.class, () -> getNameFacetStation(""));
    LOGGER.info("EXPECTED ERROR: ", exception);
    assertEquals("Station must be provided a name", exception.getMessage());
  }

  @ParameterizedTest
  @MethodSource("getCreateVersionReferenceArguments")
  void testCreateVersionReferenceValidation(String name, Instant effectiveAt) {
    assertThrows(
        NullPointerException.class, () -> Station.createVersionReference(name, effectiveAt));
  }

  static Stream<Arguments> getCreateVersionReferenceArguments() {
    return Stream.of(arguments(NULL_OBJECT, Instant.EPOCH), arguments("test", NULL_OBJECT));
  }

  @Test
  void testCreateVersionReference() {
    Station station =
        assertDoesNotThrow(() -> Station.createVersionReference("test", Instant.EPOCH));
    assertNotNull(station);
  }

  @Test
  void testStationFromSerializeToAndFrom() throws JsonProcessingException {
    final Station station = getFullStation();
    assertThat(station.getAllRawChannels())
        .describedAs("Channels in unserialized station group are in order")
        .containsExactly(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO);
    JsonTestUtilities.assertSerializes(station, Station.class);
  }

  @Test
  void testStationCreateEntityReferenceFullStationPresent() {
    final Station station = getFullStation();

    assertTrue(station.isPresent());
  }

  @Test
  void testStationFromFacetedChannelsSerializeToAndFrom() throws JsonProcessingException {
    final Station station = getFullStationWithFacetedChannels();
    assertThat(station.getChannelGroups())
        .describedAs("ChannelGroups in unserialized station group are in order")
        .containsExactly(UtilsTestFixtures.CHANNEL_GROUP);
    assertThat(station.getAllRawChannels())
        .describedAs("Channels in unserialized station group are in order")
        .map(Channel::getName)
        .containsExactly(
            UtilsTestFixtures.CHANNEL.getName(), UtilsTestFixtures.CHANNEL_TWO.getName());
    JsonTestUtilities.assertSerializes(station, Station.class);
  }

  @Test
  void testStationCreateEntityReferenceFacetedChannelsPresent() {
    final Station station = getFullStationWithFacetedChannels();

    assertTrue(station.isPresent());
    assertTrue(station.getAllRawChannels().stream().noneMatch(Channel::isPresent));
  }

  @Test
  void testStationFromFacetedChannelGroupsSerializeToAndFrom() throws JsonProcessingException {
    final Station station = getFullStationWithFacetedChannelGroups();
    assertThat(station.getChannelGroups())
        .describedAs("ChannelGroups in unserialized station group are in order")
        .map(ChannelGroup::getName)
        .containsExactly(UtilsTestFixtures.CHANNEL_GROUP.getName());
    assertThat(station.getAllRawChannels())
        .describedAs("Channels in unserialized station group are out of order")
        .containsExactly(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO);
    JsonTestUtilities.assertSerializes(station, Station.class);
  }

  @Test
  void testStationCreateEntityReferenceFacetedChannelGroupsPresent() {
    final Station station = getFullStationWithFacetedChannelGroups();

    assertTrue(station.isPresent());
    assertTrue(station.getChannelGroups().stream().noneMatch(ChannelGroup::isPresent));
  }

  @Test
  void testStationFromFacetedChannelGroupsAndChannelsSerializeToAndFrom()
      throws JsonProcessingException {
    final Station station = getFullStationWithFacetedChannelGroupsAndChannels();
    assertThat(station.getChannelGroups())
        .describedAs("ChannelGroups in unserialized station group are in order")
        .map(ChannelGroup::getName)
        .contains(UtilsTestFixtures.CHANNEL_GROUP.getName());
    assertThat(station.getAllRawChannels())
        .describedAs("Channels in unserialized station group are in order")
        .map(Channel::getName)
        .containsExactly(
            UtilsTestFixtures.CHANNEL.getName(), UtilsTestFixtures.CHANNEL_TWO.getName());
    JsonTestUtilities.assertSerializes(station, Station.class);
  }

  @Test
  void testStationCreateEntityReferenceFacetedChannelGroupsAndChannelsPresent() {
    final Station station = getFullStationWithFacetedChannelGroupsAndChannels();

    assertTrue(station.isPresent());
    assertTrue(station.getAllRawChannels().stream().noneMatch(Channel::isPresent));
    assertTrue(station.getChannelGroups().stream().noneMatch(ChannelGroup::isPresent));
  }

  @Test
  void testStationToEntityReferenceFromEntityReference() {
    final Station nameFacet = getNameFacetStation("test");

    final Station result = nameFacet.toEntityReference();

    assertEquals(nameFacet.getName(), result.getName());
    assertFalse(result.isPresent());
  }

  @Test
  void testStationToEntityReferenceFomFullChannel() {
    final Station fullEntity = getFullStation();

    final Station result = fullEntity.toEntityReference();

    assertEquals(fullEntity.getName(), result.getName());
    assertFalse(result.isPresent());
  }

  private Station getNameFacetStation(String name) {
    return Station.createEntityReference(name);
  }

  private Station getFullStation() {
    return STATION;
  }

  private Station getFullStationWithFacetedChannelGroups() {
    return STATION.toBuilder()
        .setName("test")
        .setData(
            STATION.getData().orElseThrow().toBuilder()
                .setChannelGroups(
                    List.of(
                        ChannelGroup.createEntityReference(
                            UtilsTestFixtures.CHANNEL_GROUP.getName())))
                .build())
        .build();
  }

  private Station getFullStationWithFacetedChannels() {
    return STATION.toBuilder()
        .setName("test")
        .setData(
            STATION.getData().orElseThrow().toBuilder()
                .setAllRawChannels(
                    List.of(
                        Channel.createEntityReference(UtilsTestFixtures.CHANNEL.getName()),
                        Channel.createEntityReference(UtilsTestFixtures.CHANNEL_TWO.getName())))
                .build())
        .build();
  }

  private Station getFullStationWithFacetedChannelGroupsAndChannels() {
    return STATION.toBuilder()
        .setName("test")
        .setData(
            STATION.getData().orElseThrow().toBuilder()
                .setChannelGroups(
                    List.of(
                        ChannelGroup.createEntityReference(
                            UtilsTestFixtures.CHANNEL_GROUP.getName())))
                .setAllRawChannels(
                    List.of(
                        Channel.createEntityReference(UtilsTestFixtures.CHANNEL.getName()),
                        Channel.createEntityReference(UtilsTestFixtures.CHANNEL_TWO.getName())))
                .build())
        .build();
  }

  @Test
  void testToVersionIdValidation() {
    final Station namedStation = getNameFacetStation("test");
    assertThrows(IllegalStateException.class, () -> namedStation.toVersionId());
  }

  @Test
  void testToVersionId() {
    VersionId versionId = STATION.toVersionId();
    assertEquals(STATION.getName(), versionId.getEntityId());
    STATION
        .getEffectiveAt()
        .ifPresentOrElse(
            effectiveAt -> assertEquals(effectiveAt, versionId.getEffectiveAt()), () -> fail());
  }

  @ParameterizedTest
  @MethodSource("getBuildValidationArguments")
  void testBuildValidation(
      Class<? extends Exception> expectedException,
      String name,
      Instant effectiveAt,
      Station.Data data) {
    Station.Builder builder =
        Station.builder().setName(name).setEffectiveAt(effectiveAt).setData(data);
    assertThrows(expectedException, () -> builder.build());
  }

  static Stream<Arguments> getBuildValidationArguments() {
    return Stream.of(
        arguments(IllegalArgumentException.class, "", Instant.EPOCH, createTestStationData()),
        arguments(IllegalStateException.class, "test", NULL_OBJECT, createTestStationData()));
  }

  @Test
  void testBuild() {
    Station station =
        assertDoesNotThrow(
            () ->
                Station.builder()
                    .setName("test")
                    .setEffectiveAt(Instant.EPOCH)
                    .setData(createTestStationData())
                    .build());
    assertNotNull(station);
  }

  @Test
  void testSetEffectiveAt() {

    StationDefinitionObject station = getFullStation();
    station = station.setEffectiveAt(DefaultCoiTestFixtures.START);
    assertEquals(DefaultCoiTestFixtures.START, station.getEffectiveAt().get());
  }

  @Test
  void testSetEffectiveUntil() {

    StationDefinitionObject station = getFullStation();
    station = station.setEffectiveUntil(DefaultCoiTestFixtures.END);
    assertEquals(DefaultCoiTestFixtures.END, station.getEffectiveUntil().get());
  }
}
