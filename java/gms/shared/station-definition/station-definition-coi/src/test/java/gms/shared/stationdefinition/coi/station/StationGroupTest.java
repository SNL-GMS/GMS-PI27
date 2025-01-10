package gms.shared.stationdefinition.coi.station;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION_GROUP;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.createTestStationGroupData;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.StationGroup.Data;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class StationGroupTest {

  private static final Object NULL_OBJECT = null;

  private static final Logger LOGGER = LoggerFactory.getLogger(StationGroupTest.class);

  @Test
  void testFactoryMethodWithEmptyStationListThrowsException() {
    Data.Builder dataBuilder =
        Data.builder().setDescription("test description").setStations(List.of());

    Exception e = assertThrows(IllegalArgumentException.class, () -> dataBuilder.build());
  }

  @Test
  void testStationGroupCreateEntityReferenceSerializeToAndFrom() throws JsonProcessingException {
    final StationGroup stationGroup = getNameFacetStationGroup("test");
    JsonTestUtilities.assertSerializes(stationGroup, StationGroup.class);
  }

  @Test
  void testStationGroupCreateEntityReferenceFacetPresent() {
    final StationGroup stationGroup = getNameFacetStationGroup("test");

    assertFalse(stationGroup.isPresent());
  }

  @Test
  void testStationGroupCreateEntityReferenceEmptyName() {
    final var exception =
        assertThrows(IllegalArgumentException.class, () -> getNameFacetStationGroup(""));
    LOGGER.info("EXPECTED ERROR: ", exception);
    assertEquals("Station group must be provided a name", exception.getMessage());
  }

  @Test
  void testStationGroupFromSerializeToAndFrom() throws JsonProcessingException {
    final StationGroup stationGroup = getFullStationGroup();
    assertThat(stationGroup.getStations())
        .describedAs("Stations in unserialized station group are out of order")
        .contains(UtilsTestFixtures.STATION);
    JsonTestUtilities.assertSerializes(stationGroup, StationGroup.class);
  }

  @Test
  void testStationGroupCreateEntityReferencePresent() {
    final StationGroup stationGroup = getFullStationGroup();

    assertTrue(stationGroup.isPresent());
  }

  @ParameterizedTest
  @MethodSource("getVersionReferenceArguments")
  void testCreateVersionReferenceValidation(String name, Instant effectiveAt) {
    assertThrows(
        NullPointerException.class, () -> StationGroup.createVersionReference(name, effectiveAt));
  }

  static Stream<Arguments> getVersionReferenceArguments() {
    return Stream.of(arguments(NULL_OBJECT, Instant.EPOCH), arguments("test", NULL_OBJECT));
  }

  @Test
  void testCreateVersionReference() {
    StationGroup stationGroup =
        assertDoesNotThrow(() -> StationGroup.createVersionReference("test", Instant.EPOCH));
    assertNotNull(stationGroup);
  }

  @Test
  void testStationGroupFromFacetedStationsSerializeToAndFrom() throws JsonProcessingException {
    final StationGroup stationGroup = getFullStationGroupWithFacetedStations();
    assertThat(stationGroup.getStations())
        .describedAs("Faceted stations in unserialized station group are in order")
        .map(Station::getName)
        .containsExactly("station1", "station2");
    JsonTestUtilities.assertSerializes(stationGroup, StationGroup.class);
  }

  @Test
  void testStationGroupFromFacetedStationChannelsPresent() {
    final StationGroup stationGroup = getFullStationGroupWithFacetedStations();

    assertTrue(stationGroup.isPresent());
  }

  @Test
  void testStationGroupFromFacetedStationChannelsSerializeToAndFrom()
      throws JsonProcessingException {
    final StationGroup stationGroup = getFullStationGroupWithStationsWithFacetedChannels();
    assertThat(stationGroup.getStations())
        .describedAs("Channels in unserialized station group are in order")
        .flatMap(s -> s.getAllRawChannels())
        .map(Channel::getName)
        .containsExactly(
            UtilsTestFixtures.CHANNEL.getName(), UtilsTestFixtures.CHANNEL_TWO.getName());
    JsonTestUtilities.assertSerializes(stationGroup, StationGroup.class);
  }

  @Test
  void testStationGroupFromFacetedStationsPresent() {
    final StationGroup stationGroup = getFullStationGroupWithStationsWithFacetedChannels();

    assertTrue(stationGroup.isPresent());
    assertTrue(stationGroup.getStations().stream().allMatch(Station::isPresent));
    assertTrue(
        stationGroup.getStations().stream()
            .flatMap(s -> s.getAllRawChannels().stream())
            .noneMatch(Channel::isPresent));
  }

  @Test
  void testStationGroupToEntityReferenceFromEntityReference() {
    final StationGroup nameFacet = getNameFacetStationGroup("test");

    final StationGroup result = nameFacet.toEntityReference();

    assertEquals(nameFacet.getName(), result.getName());
    assertFalse(result.isPresent());
  }

  @Test
  void testStationGroupToEntityReferenceFromFullChannel() {
    final StationGroup fullEntity = getFullStationGroup();

    final StationGroup result = fullEntity.toEntityReference();

    assertEquals(fullEntity.getName(), result.getName());
    assertFalse(result.isPresent());
  }

  private StationGroup getNameFacetStationGroup(String name) {
    return StationGroup.createEntityReference(name);
  }

  private StationGroup getFullStationGroup() {
    return STATION_GROUP;
  }

  private StationGroup getFullStationGroupWithFacetedStations() {
    return StationGroup.builder()
        .setName("test")
        .setEffectiveAt(Instant.now())
        .setEffectiveUntil(Instant.now().plusSeconds(100))
        .setData(
            Data.builder()
                .setDescription("the is the group for testing!")
                .setStations(
                    List.of(
                        Station.createEntityReference("station1"),
                        Station.createEntityReference("station2")))
                .build())
        .build();
  }

  private StationGroup getFullStationGroupWithStationsWithFacetedChannels() {
    final var channels =
        UtilsTestFixtures.STATION.getAllRawChannels().stream()
            .map(c -> Channel.createEntityReference(c.getName()))
            .collect(Collectors.toList());
    final var station =
        UtilsTestFixtures.STATION.toBuilder()
            .setEffectiveAt(Instant.EPOCH)
            .setData(
                UtilsTestFixtures.STATION.getData().orElseThrow().toBuilder()
                    .setAllRawChannels(channels)
                    .build())
            .build();
    return StationGroup.builder()
        .setName("test")
        .setEffectiveAt(Instant.now())
        .setEffectiveUntil(Optional.empty())
        .setData(
            Data.builder()
                .setDescription("the is the group for testing!")
                .setStations(List.of(station))
                .build())
        .build();
  }

  @Test
  void testToVersionIdValidation() {
    var stationGroup = getNameFacetStationGroup("test");
    assertThrows(IllegalStateException.class, () -> stationGroup.toVersionId());
  }

  @Test
  void testToVersionId() {
    var versionId = assertDoesNotThrow(() -> STATION_GROUP.toVersionId());
    assertEquals(STATION_GROUP.getName(), versionId.getEntityId());
    STATION_GROUP
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
      StationGroup.Data data) {
    StationGroup.Builder builder =
        StationGroup.builder().setName(name).setEffectiveAt(effectiveAt).setData(data);
    assertThrows(expectedException, () -> builder.build());
  }

  static Stream<Arguments> getBuildValidationArguments() {
    return Stream.of(
        arguments(IllegalArgumentException.class, "", Instant.EPOCH, createTestStationGroupData()),
        arguments(IllegalStateException.class, "test", NULL_OBJECT, createTestStationGroupData()));
  }

  @Test
  void testBuild() {
    StationGroup stationGroup =
        assertDoesNotThrow(
            () ->
                StationGroup.builder()
                    .setName("test")
                    .setEffectiveAt(Instant.EPOCH)
                    .setData(createTestStationGroupData())
                    .build());
    assertNotNull(stationGroup);
  }

  @Test
  void testChannelGroupIncompleteDataBuilderException() {
    var exceptionString =
        "Either all FacetedDataClass fields must be populated or none of them can be populated";

    var stationGroupDataBuilder = StationGroup.Data.builder().setDescription("Station description");
    var exception =
        assertThrows(IllegalStateException.class, () -> stationGroupDataBuilder.build());
    assertEquals(exceptionString, exception.getMessage());
  }
}
