package gms.shared.stationdefinition.coi.channel;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_GROUP;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.coi.channel.ChannelGroup.ChannelGroupType;
import gms.shared.stationdefinition.coi.id.VersionId;
import gms.shared.stationdefinition.coi.utils.StationDefinitionObject;
import gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class ChannelGroupTest {

  private static final Object NULL_OBJECT = null;

  private static final Logger LOGGER = LoggerFactory.getLogger(ChannelGroupTest.class);

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(CHANNEL_GROUP, ChannelGroup.class);
  }

  @Test
  void testEmptyNameThrowsException() {
    assertThrows(
        Exception.class,
        () -> ChannelGroup.builder().setName("").setData(createTestChannelGroupData()).build());
  }

  @Test
  void testEmptyListOfChannelsThrowsException() {
    assertThrows(
        Exception.class,
        () ->
            ChannelGroup.builder()
                .setName("Test Channel Group")
                .setEffectiveAt(Instant.now())
                .setData(
                    ChannelGroup.Data.builder()
                        .setDescription("Sample Processing Group")
                        .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
                        .setType(ChannelGroupType.PROCESSING_GROUP)
                        .setChannels(List.of())
                        .build())
                .build());
  }

  @Test
  void testChannelGroupCreateEntityReferenceSerializeToAndFrom() throws JsonProcessingException {
    final ChannelGroup channelGroup = getNameFacetChannelGroup("Test channel group");
    JsonTestUtilities.assertSerializes(channelGroup, ChannelGroup.class);
  }

  @Test
  void testChannelGroupCreateEntityReferencePresent() {
    final ChannelGroup channelGroup = getNameFacetChannelGroup("Test channel group");

    assertFalse(channelGroup.isPresent());
  }

  @Test
  void testChannelGroupCreateEntityReferenceEmptyName() {
    final var exception =
        assertThrows(IllegalArgumentException.class, () -> getNameFacetChannelGroup(""));
    LOGGER.info("EXPECTED ERROR: ", exception);
    assertEquals("Channel group must be provided a name", exception.getMessage());
  }

  @ParameterizedTest
  @MethodSource("getVersionReferenceArguments")
  void testCreateVersionReferenceValidation(String name, Instant effectiveAt) {
    assertThrows(
        NullPointerException.class, () -> ChannelGroup.createVersionReference(name, effectiveAt));
  }

  static Stream<Arguments> getVersionReferenceArguments() {
    return Stream.of(arguments(NULL_OBJECT, Instant.now()), arguments("test", NULL_OBJECT));
  }

  @Test
  void testCreateVersionReference() {
    ChannelGroup channelGroup =
        assertDoesNotThrow(() -> ChannelGroup.createVersionReference("test", Instant.now()));
    assertNotNull(channelGroup);
  }

  @Test
  void testChannelGroupFromSerializeToAndFrom() throws JsonProcessingException {
    final ChannelGroup channelGroup = getFullChannelGroup();
    JsonTestUtilities.assertSerializes(channelGroup, ChannelGroup.class);
  }

  @Test
  void testChannelGroupFromPresent() {
    final ChannelGroup channelGroup = getFullChannelGroup();
    assertTrue(channelGroup.isPresent());
    assertTrue(channelGroup.getLocation().isPresent());
  }

  @Test
  void testChannelGroupFromSerializeToAndFromWithFacetedChannels() throws JsonProcessingException {
    final ChannelGroup channelGroup = getFullChannelGroupWithFacetedChannels();
    JsonTestUtilities.assertSerializes(channelGroup, ChannelGroup.class);
  }

  @Test
  void testChannelGroupFromPresentWithFacetedChannels() {
    final ChannelGroup channelGroup = getFullChannelGroupWithFacetedChannels();

    assertTrue(channelGroup.isPresent());
    assertTrue(channelGroup.getChannels().stream().noneMatch(Channel::isPresent));
  }

  @Test
  void testChannelGroupFromSerializeToAndFromWithNullLocation() throws JsonProcessingException {
    ChannelGroup channelGroup = getFullChannelGroupNullLocation();
    JsonTestUtilities.assertSerializes(channelGroup, ChannelGroup.class);
  }

  @Test
  void testChannelGroupFromPresentWithNullLocation() {
    final ChannelGroup channelGroup = getFullChannelGroupNullLocation();
    assertTrue(channelGroup.isPresent());
    assertFalse(channelGroup.getLocation().isPresent());
  }

  @Test
  void testChannelGroupIncompleteDataBuilderException() {

    var exceptionString =
        "Either all FacetedDataClass fields must be populated or none of them can be populated";
    var channelGroupBuilder =
        ChannelGroup.Data.builder()
            // test missing description
            .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
            .setEffectiveUntil((CssDaoAndCoiParameters.END_TIME))
            .setType(ChannelGroupType.PHYSICAL_SITE)
            .setChannels(List.of(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO));

    var exception = assertThrows(IllegalStateException.class, () -> channelGroupBuilder.build());
    assertEquals(exceptionString, exception.getMessage());

    var channelGroupDataBuilder2 =
        ChannelGroup.Data.builder()
            .setDescription("Sample Processing Group")
            .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
            // test missing type
            .setChannels(List.of(UtilsTestFixtures.CHANNEL));

    exception = assertThrows(IllegalStateException.class, () -> channelGroupDataBuilder2.build());
    assertEquals(exceptionString, exception.getMessage());

    var channelGroupDataBuilder3 =
        ChannelGroup.Data.builder()
            .setDescription("Sample Processing Group")
            .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
            .setType(ChannelGroupType.PROCESSING_GROUP);
    // test missing channels

    exception = assertThrows(IllegalStateException.class, () -> channelGroupDataBuilder3.build());
    assertEquals(exceptionString, exception.getMessage());
  }

  private ChannelGroup getNameFacetChannelGroup(String name) {
    return ChannelGroup.createEntityReference(name);
  }

  private ChannelGroup getFullChannelGroup() {
    return ChannelGroup.builder()
        .setName("Channel Group Full")
        .setEffectiveAt(Instant.now())
        .setData(
            ChannelGroup.Data.builder()
                .setDescription("Sample channel group containing all test suite channels")
                .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
                .setEffectiveUntil((CssDaoAndCoiParameters.END_TIME))
                .setType(ChannelGroupType.PHYSICAL_SITE)
                .setChannels(List.of(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO))
                .build())
        .build();
  }

  private ChannelGroup getFullChannelGroupNullLocation() {
    return ChannelGroup.builder()
        .setName("Channel Group Full")
        .setEffectiveAt(Instant.now())
        .setData(
            ChannelGroup.Data.builder()
                .setDescription("Sample channel group containing all test suite channels")
                .setLocation(null)
                .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                .setType(ChannelGroupType.PHYSICAL_SITE)
                .setChannels(List.of(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO))
                .build())
        .build();
  }

  private ChannelGroup getFullChannelGroupWithFacetedChannels() {
    return ChannelGroup.builder()
        .setName("Channel Group Full")
        .setEffectiveAt(Instant.now())
        .setData(
            ChannelGroup.Data.builder()
                .setDescription("Sample channel group containing all test suite channels")
                .setLocation(Location.from(100.0, 50.0, 50.0, 100.0))
                .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                .setType(ChannelGroupType.PHYSICAL_SITE)
                .setChannels(
                    List.of(UtilsTestFixtures.CHANNEL, UtilsTestFixtures.CHANNEL_TWO).stream()
                        .map(c -> Channel.createEntityReference(c.getName()))
                        .collect(Collectors.toList()))
                .build())
        .build();
  }

  private static ChannelGroup.Data createTestChannelGroupData() {
    return ChannelGroup.Data.builder()
        .setDescription("Channel Group Description")
        .setLocation(Location.from(35.0, -125.0, 100.0, 5500.0))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(UtilsTestFixtures.CHANNEL))
        .setType(ChannelGroupType.PROCESSING_GROUP)
        .build();
  }

  @Test
  void testToVersionIdValidation() {
    var chanGroup = getNameFacetChannelGroup("test");
    assertThrows(IllegalStateException.class, () -> chanGroup.toVersionId());
  }

  @Test
  void testToVersionid() {
    VersionId versionId = CHANNEL_GROUP.toVersionId();
    assertEquals(CHANNEL_GROUP.getName(), versionId.getEntityId());
    CHANNEL_GROUP
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
      ChannelGroup.Data data) {
    ChannelGroup.Builder builder =
        ChannelGroup.builder().setName(name).setEffectiveAt(effectiveAt).setData(data);
    assertThrows(expectedException, () -> builder.build());
  }

  static Stream<Arguments> getBuildValidationArguments() {
    return Stream.of(
        arguments(
            IllegalArgumentException.class,
            "",
            Instant.EPOCH,
            UtilsTestFixtures.createTestChannelGroupData()),
        arguments(
            IllegalStateException.class,
            "Test",
            null,
            UtilsTestFixtures.createTestChannelGroupData()));
  }

  @Test
  void testBuild() {
    ChannelGroup channelGroup =
        assertDoesNotThrow(
            () ->
                ChannelGroup.builder()
                    .setName("Test")
                    .setEffectiveAt(Instant.EPOCH)
                    .setData(createTestChannelGroupData())
                    .build());

    assertNotNull(channelGroup);
  }

  @Test
  void testSetEffectiveAt() {

    StationDefinitionObject chanGroup = getFullChannelGroup();
    chanGroup = chanGroup.setEffectiveAt(DefaultCoiTestFixtures.START);
    assertEquals(DefaultCoiTestFixtures.START, chanGroup.getEffectiveAt().get());
  }

  @Test
  void testSetEffectiveUntil() {

    StationDefinitionObject chanGroup = getFullChannelGroup();
    chanGroup = chanGroup.setEffectiveUntil(DefaultCoiTestFixtures.END);
    assertEquals(DefaultCoiTestFixtures.END, chanGroup.getEffectiveUntil().get());
  }

  @Test
  void testToEntityReferenceAndCreateEntityReference() {

    var chanGroup = getFullChannelGroup();
    var entityReference = chanGroup.toEntityReference();

    assertThrows(IllegalStateException.class, () -> entityReference.getDescription());
    assertThrows(IllegalStateException.class, () -> entityReference.getEffectiveUntil());
    assertEquals(chanGroup.getName(), entityReference.getName());
    var entityReference2 = ChannelGroup.createEntityReference(chanGroup);
    assertEquals(entityReference, entityReference2);
  }

  @Test
  void testCreateVersionReferenceFromChannelGroup() {

    StationDefinitionObject chanGroup = getFullChannelGroup();
    chanGroup = chanGroup.setEffectiveAt(DefaultCoiTestFixtures.START);
    var versionReference = ChannelGroup.createVersionReference((ChannelGroup) chanGroup);
    assertThrows(IllegalStateException.class, () -> versionReference.getDescription());
    assertThrows(IllegalStateException.class, () -> versionReference.getEffectiveUntil());
    assertEquals(chanGroup.getName(), versionReference.getName());
    assertEquals(DefaultCoiTestFixtures.START, versionReference.getEffectiveAt().get());
  }
}
