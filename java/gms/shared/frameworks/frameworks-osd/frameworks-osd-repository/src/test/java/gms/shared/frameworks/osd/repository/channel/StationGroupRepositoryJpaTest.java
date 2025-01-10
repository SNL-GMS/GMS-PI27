package gms.shared.frameworks.osd.repository.channel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.coi.exceptions.RepositoryException;
import gms.shared.frameworks.osd.api.station.StationGroupRepository;
import gms.shared.frameworks.osd.api.station.StationRepository;
import gms.shared.frameworks.osd.coi.Units;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelBandType;
import gms.shared.frameworks.osd.coi.channel.ChannelDataType;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup.Type;
import gms.shared.frameworks.osd.coi.channel.ChannelInstrumentType;
import gms.shared.frameworks.osd.coi.channel.ChannelOrientationType;
import gms.shared.frameworks.osd.coi.channel.ChannelProcessingMetadataType;
import gms.shared.frameworks.osd.coi.channel.Orientation;
import gms.shared.frameworks.osd.coi.signaldetection.Location;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroupDefinition;
import gms.shared.frameworks.osd.coi.station.StationTestFixtures;
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.coi.stationreference.StationType;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import gms.shared.frameworks.osd.repository.station.StationGroupRepositoryJpa;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import gms.shared.utilities.db.test.utils.TestFixtures;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Query;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class StationGroupRepositoryJpaTest {

  private static EntityManagerFactory entityManagerFactory;
  private static final StationRepository stationRepository =
      new StationRepositoryJpa(entityManagerFactory);
  private static final StationGroupRepository stationGroupRepository =
      new StationGroupRepositoryJpa(entityManagerFactory);
  private static final List<Station> STATIONS = List.of(TestFixtures.station);

  @BeforeEach
  void beforeEach() {
    stationRepository.storeStations(List.of(UtilsTestFixtures.STATION, TestFixtures.station));
    stationGroupRepository.storeStationGroups(
        List.of(UtilsTestFixtures.STATION_GROUP, StationTestFixtures.getStationGroup()));
  }

  @AfterEach
  void afterEach() {
    EntityManager entityManager = entityManagerFactory.createEntityManager();
    try {
      entityManager.getTransaction().begin();
      Query query = entityManager.createNativeQuery("truncate gms_soh.station_group cascade");
      query.executeUpdate();
      query = entityManager.createNativeQuery("truncate gms_soh.station cascade");
      query.executeUpdate();
      query = entityManager.createNativeQuery("truncate gms_soh.channel_group cascade");
      query.executeUpdate();
      query = entityManager.createNativeQuery("truncate gms_soh.channel cascade");
      query.executeUpdate();
      query = entityManager.createNativeQuery("truncate gms_soh.station_channel_info cascade");
      query.executeUpdate();
      entityManager.getTransaction().commit();
    } finally {
      entityManager.close();
    }
  }

  // /store

  @Test
  void testStoreStationGroupWithStationNotCurrentlyInDatabase() {
    final Station station =
        Station.from(
            "testStationTwo",
            StationType.SEISMIC_3_COMPONENT,
            "Sample 3-component station",
            Map.of("testChannelEight", RelativePosition.from(25, 35, 35)),
            Location.from(65.75, 135.50, 100.0, 50),
            List.of(
                ChannelGroup.from(
                    "testChannelGroupThree",
                    "Another Channel Group",
                    Location.from(136.76, 65.75, 105.0, 55.0),
                    ChannelGroup.Type.SITE_GROUP,
                    List.of(TestFixtures.channel8))),
            List.of(TestFixtures.channel8));
    final StationGroup stationGroup =
        StationGroup.from(
            "AnotherPSG",
            "This is a PSG with a station that has not yet been stored",
            List.of(station));

    assertTrue(() -> stationRepository.retrieveAllStations(List.of(station.getName())).isEmpty());

    assertDoesNotThrow(() -> stationGroupRepository.storeStationGroups(List.of(stationGroup)));

    var storedStations = stationRepository.retrieveAllStations(List.of(station.getName()));
    assertEquals(1, storedStations.size());
    assertEquals(station, storedStations.get(0));
  }

  @Test
  void testStoringStationGroupsWithTheSameStations() {
    final Channel channel =
        Channel.from(
            "newChannel",
            "Test Channel One",
            "This is a description of the channel",
            TestFixtures.station.getName(),
            ChannelDataType.DIAGNOSTIC_SOH,
            ChannelBandType.BROADBAND,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.EAST_WEST,
            'E',
            Units.HERTZ,
            50.0,
            Location.from(100.0, 150.0, 30, 20),
            Orientation.from(10.0, 35.0),
            List.of(),
            Map.of(),
            Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));

    final ChannelGroup newChannelGroup =
        ChannelGroup.from(
            "channelGroupWithNullLocation",
            "Sample channel group containing all test suite channels",
            null,
            ChannelGroup.Type.SITE_GROUP,
            List.of(channel));

    final Station station =
        Station.from(
            "stationWithChannelWithUnknownLocation",
            StationType.SEISMIC_ARRAY,
            "Station that does has a channel with unknown location",
            Map.of("newChannel", RelativePosition.from(30, 55, 120)),
            Location.from(135.75, 65.75, 50.0, 0.0),
            List.of(newChannelGroup),
            List.of(channel));

    final StationGroup stationGroup =
        StationGroup.from(
            "Yet Another PSG",
            "This is a PSG with a station that has not yet been stored",
            List.of(station));

    final StationGroup stationGroupTwo =
        StationGroup.from(
            "Different PSG", "This is a PSG with a station that has been stored", List.of(station));

    assertDoesNotThrow(
        () -> stationGroupRepository.storeStationGroups(List.of(stationGroup, stationGroupTwo)));
  }

  @Test
  void testStoreUpdateExistingStationGroup() {
    var existingStationGroup = StationTestFixtures.getStationGroup();
    var updatedStationGroup =
        StationGroup.from(
            existingStationGroup.getName(),
            "Updating the stations for this group, along with description",
            List.of(StationTestFixtures.asar()));

    assertEquals(
        existingStationGroup,
        stationGroupRepository
            .retrieveStationGroups(List.of(existingStationGroup.getName()))
            .get(0));

    assertDoesNotThrow(
        () -> stationGroupRepository.storeStationGroups(List.of(updatedStationGroup)));

    assertEquals(
        updatedStationGroup,
        stationGroupRepository
            .retrieveStationGroups(List.of(existingStationGroup.getName()))
            .get(0));
  }

  @Test
  void testStoreUpdateAndResetExistingStationGroup() {
    var stationGroupName = TestFixtures.STATION_GROUP.getName();
    var existingStationGroup = TestFixtures.STATION_GROUP;

    var updatedStationGroup =
        StationGroup.from(
            stationGroupName,
            "Updated existing station group, now includes stationTwo",
            List.of(TestFixtures.station, TestFixtures.stationTwo));

    stationGroupRepository.storeStationGroups(List.of(existingStationGroup));

    assertEquals(
        existingStationGroup,
        stationGroupRepository.retrieveStationGroups(List.of(stationGroupName)).get(0));

    // Update existing group
    stationGroupRepository.storeStationGroups(List.of(updatedStationGroup));

    assertEquals(
        updatedStationGroup,
        stationGroupRepository.retrieveStationGroups(List.of(stationGroupName)).get(0));

    // Revert existing group to original state
    stationGroupRepository.storeStationGroups(List.of(existingStationGroup));

    assertEquals(
        existingStationGroup,
        stationGroupRepository.retrieveStationGroups(List.of(stationGroupName)).get(0));
  }

  @Test
  void testStoreUpdateStationGroupChangesSharedStation() {

    var cg78 =
        ChannelGroup.from(
            "channelGroup78",
            "Channel group containing exactly sample channels 7 and 8",
            Location.from(100.0, 10.0, 50.0, 100.0),
            Type.SITE_GROUP,
            List.of(TestFixtures.channel7, TestFixtures.channel8));

    var updatedStation =
        TestFixtures.stationTwo.toBuilder()
            .setDescription("Updated to include channel 8")
            .setRelativePositionsByChannel(
                Map.of(
                    "testChannelSeven", RelativePosition.from(50.0, 55.0, 64.0),
                    "testChannelEight", RelativePosition.from(50.0, 55.0, 64.0)))
            .setChannelGroups(List.of(cg78))
            .setChannels(List.of(TestFixtures.channel7, TestFixtures.channel8))
            .build();

    String stationGroupName = "stationGroup";
    String otherStationGroupName = "OTHER";

    var stationGroup =
        StationGroup.from(
            stationGroupName,
            "This is an example of a station group",
            List.of(TestFixtures.stationTwo));

    var otherStationGroup =
        StationGroup.from(
            otherStationGroupName,
            "Other station group, with shared station",
            List.of(TestFixtures.stationTwo));

    var updatedStationGroup =
        StationGroup.from(
            stationGroupName,
            "Updating stationGroup with changed shared station",
            List.of(updatedStation));

    var updatedOtherStationGroup =
        StationGroup.from(
            otherStationGroupName,
            "Other station group, with shared station",
            List.of(updatedStation));

    stationGroupRepository.storeStationGroups(List.of(stationGroup, otherStationGroup));

    var initial =
        stationGroupRepository.retrieveStationGroups(
            List.of(stationGroupName, otherStationGroupName));

    assertEquals(2, initial.size());
    assertThat(initial).containsExactlyInAnyOrder(stationGroup, otherStationGroup);

    stationGroupRepository.storeStationGroups(List.of(updatedStationGroup));

    var updated =
        stationGroupRepository.retrieveStationGroups(
            List.of(stationGroupName, otherStationGroupName));

    assertEquals(2, updated.size());
    assertThat(updated).containsExactlyInAnyOrder(updatedStationGroup, updatedOtherStationGroup);
  }

  @Test
  void testPassingNullToStoreStationGroupsThrowsException() {
    assertThrows(NullPointerException.class, () -> stationGroupRepository.storeStationGroups(null));
  }

  @Test
  void testPassingEmptyCollectionToStoreStationGroupsThrowsException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> stationGroupRepository.storeStationGroups(Collections.EMPTY_LIST));
  }

  // /update

  @Test
  void testUpdateStationGroupsNewGroup() {
    final StationGroupDefinition newDefinition =
        StationGroupDefinition.from(
            "updateNewStationGroup",
            "This is a completely new station group that we are creating via"
                + " StationGroupDefinition. This should store a new station group containing all"
                + " STATIONS successfully",
            STATIONS.stream().map(Station::getName).collect(Collectors.toList()));

    stationGroupRepository.updateStationGroups(List.of(newDefinition));

    final List<StationGroup> stationGroups =
        stationGroupRepository.retrieveStationGroups(List.of(newDefinition.getName()));

    assertEquals(1, stationGroups.size());

    StationGroup newStationGroup = stationGroups.get(0);
    assertEquals(newDefinition.getName(), newStationGroup.getName());
    assertEquals(newDefinition.getDescription(), newStationGroup.getDescription());
    assertTrue(STATIONS.containsAll(newStationGroup.getStations()));
  }

  @Test
  void testUpdateStationGroupsUpdateExisting() {
    stationRepository.storeStations(List.of(TestFixtures.stationTwo));

    final StationGroupDefinition updatedGroupDefinition =
        StationGroupDefinition.from(
            TestFixtures.STATION_GROUP.getName(),
            "This is an update to an existing station group that we are updating via"
                + " StationGroupDefinition. This should update the existing station group"
                + " containing all STATIONS (plus one new station) successfully",
            List.of(TestFixtures.station.getName(), TestFixtures.stationTwo.getName()));

    stationGroupRepository.updateStationGroups(List.of(updatedGroupDefinition));

    final List<StationGroup> stationGroups =
        stationGroupRepository.retrieveStationGroups(List.of(updatedGroupDefinition.getName()));

    assertEquals(1, stationGroups.size());

    StationGroup updatedStationGroup = stationGroups.get(0);
    assertEquals(TestFixtures.STATION_GROUP.getName(), updatedStationGroup.getName());
    assertEquals(updatedGroupDefinition.getDescription(), updatedStationGroup.getDescription());
    assertFalse(STATIONS.containsAll(updatedStationGroup.getStations()));
    assertTrue(
        List.of(TestFixtures.station, TestFixtures.stationTwo)
            .containsAll(updatedStationGroup.getStations()));
  }

  @Test
  void testUpdateStationGroupsReplaceStation() {
    stationRepository.storeStations(List.of(TestFixtures.stationTwo));

    final StationGroupDefinition updatedGroupDefinition =
        StationGroupDefinition.from(
            TestFixtures.STATION_GROUP.getName(),
            "This is an update to an existing station group that we are updating via"
                + " StationGroupDefinition. This should update the existing station group to"
                + " replace the one station associated with it with another successfully",
            List.of(TestFixtures.stationTwo.getName()));

    stationGroupRepository.updateStationGroups(List.of(updatedGroupDefinition));

    final List<StationGroup> stationGroups =
        stationGroupRepository.retrieveStationGroups(List.of(updatedGroupDefinition.getName()));

    assertEquals(1, stationGroups.size());

    StationGroup updatedStationGroup = stationGroups.get(0);
    assertEquals(TestFixtures.STATION_GROUP.getName(), updatedStationGroup.getName());
    assertEquals(updatedGroupDefinition.getDescription(), updatedStationGroup.getDescription());
    assertThat(updatedStationGroup.getStations()).containsOnly(TestFixtures.stationTwo);
    assertArrayEquals(
        List.of(TestFixtures.stationTwo).toArray(), updatedStationGroup.getStations().toArray());
  }

  @Test
  void testUpdateStationGroupsMissingStation() {
    final StationGroupDefinition newDefinitionMissingStation =
        StationGroupDefinition.from(
            "updateNewStationGroupMissingStation",
            "This is a completely new station group that we are creating via"
                + " StationGroupDefinition. This should fail to store a station group and throw an"
                + " exception due to missing stations in its name list",
            List.of("thisStationDoesNotExist"));
    var missingStationList = List.of(newDefinitionMissingStation);
    assertThrows(
        RepositoryException.class,
        () -> stationGroupRepository.updateStationGroups(missingStationList));
  }

  // Retrieve

  @Test
  void testRetrieveStationGroups() {
    final Channel channel =
        Channel.from(
            "yetiChannelOne",
            "New Channel One",
            "This is a description of the channel",
            "yetiStation",
            ChannelDataType.DIAGNOSTIC_SOH,
            ChannelBandType.BROADBAND,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.EAST_WEST,
            'E',
            Units.HERTZ,
            50.0,
            Location.from(100.0, 150.0, 30, 20),
            Orientation.from(10.0, 35.0),
            List.of(),
            Map.of(),
            Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));

    final ChannelGroup newChannelGroup =
        ChannelGroup.from(
            "yetiChannelGroup",
            "Another Sample channel group containing all test suite channels",
            null,
            ChannelGroup.Type.SITE_GROUP,
            List.of(channel));

    final Station station =
        Station.from(
            "yetiStation",
            StationType.SEISMIC_3_COMPONENT,
            "Sample 3-component station",
            Map.of("yetiChannelOne", RelativePosition.from(25, 35, 35)),
            Location.from(65.75, 135.50, 100.0, 50),
            List.of(newChannelGroup),
            List.of(channel));

    final StationGroup stationGroup =
        StationGroup.from(
            "YetiPSG",
            "This is a PSG with a station that has not yet been stored",
            List.of(station));
    stationGroupRepository.storeStationGroups(List.of(stationGroup));
    List<StationGroup> storedPsgs =
        stationGroupRepository.retrieveStationGroups(List.of("YetiPSG"));
    assertAll(
        () -> assertEquals(stationGroup.getName(), storedPsgs.get(0).getName()),
        () -> assertEquals(stationGroup.getDescription(), storedPsgs.get(0).getDescription()));

    assertFalse(storedPsgs.get(0).getStations().isEmpty());
    assertEquals(storedPsgs.get(0).getStations().first(), station);
  }

  @Test
  void testPassingNullToRetrieveStationGroupsThrowsException() {
    assertThrows(
        NullPointerException.class, () -> stationGroupRepository.retrieveStationGroups(null));
  }

  @Test
  void testPassingEmptyCollectionToRetrieveStationGroupThrowsException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> stationGroupRepository.retrieveStationGroups(Collections.EMPTY_LIST));
  }
}
