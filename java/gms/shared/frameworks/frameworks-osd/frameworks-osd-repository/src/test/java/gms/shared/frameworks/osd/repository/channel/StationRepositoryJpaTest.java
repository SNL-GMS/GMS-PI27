package gms.shared.frameworks.osd.repository.channel;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.coi.stationreference.StationType;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import gms.shared.utilities.db.test.utils.TestFixtures;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@Disabled("migrate to h2")
class StationRepositoryJpaTest {

  private static EntityManagerFactory entityManagerFactory;
  private static final StationRepository stationRepository =
      new StationRepositoryJpa(entityManagerFactory);

  @BeforeEach
  void beforeEach() {
    stationRepository.storeStations(List.of(UtilsTestFixtures.STATION, TestFixtures.station));
  }

  @AfterEach
  void afterEach() {
    EntityManager entityManager = entityManagerFactory.createEntityManager();
    try {
      entityManager.getTransaction().begin();
      Query query = entityManager.createNativeQuery("truncate gms_soh.station cascade");
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

  // Store

  @Test
  void testStoreStation() {
    assertDoesNotThrow(() -> stationRepository.storeStations(List.of(TestFixtures.stationTwo)));
  }

  @ParameterizedTest
  @MethodSource("stationUpdateSource")
  void testStoreStationUpdate(Station storedStation, Station updatedStation) {
    assertDoesNotThrow(() -> stationRepository.storeStations(List.of(storedStation)));

    var stations =
        assertDoesNotThrow(
            () -> stationRepository.retrieveAllStations(List.of(storedStation.getName())));

    assertEquals(1, stations.size());
    assertEquals(storedStation, stations.get(0));

    assertDoesNotThrow(() -> stationRepository.storeStations(List.of(updatedStation)));

    stations =
        assertDoesNotThrow(
            () -> stationRepository.retrieveAllStations(List.of(storedStation.getName())));

    assertEquals(1, stations.size());
    assertEquals(updatedStation, stations.get(0));
  }

  private static Stream<Arguments> stationUpdateSource() {
    var stationBase = TestFixtures.stationTwo;
    var relPosByChannelBase = stationBase.getRelativePositionsByChannel();
    var channelGroupsBase = new ArrayList<ChannelGroup>(stationBase.getChannelGroups());
    var channelGroup = channelGroupsBase.get(0);
    var channelsBase = new ArrayList<Channel>(stationBase.getChannels());

    var updatedChannels = new ArrayList<Channel>(channelsBase);
    updatedChannels.add(TestFixtures.channel8);
    var updatedChannelGroup =
        ChannelGroup.from(
            channelGroup.getName(),
            channelGroup.getDescription(),
            channelGroup.getLocation().orElse(null),
            channelGroup.getType(),
            updatedChannels);
    var updatedChannelGroups = List.of(updatedChannelGroup);
    var updatedRelPosByChan = new HashMap<String, RelativePosition>(relPosByChannelBase);
    updatedRelPosByChan.put(TestFixtures.channel8.getName(), RelativePosition.from(0, 0, 0));

    var replacedChannels = List.of(TestFixtures.channel8);
    var replacedChannelGroup =
        ChannelGroup.from(
            channelGroup.getName(),
            channelGroup.getDescription(),
            channelGroup.getLocation().orElse(null),
            channelGroup.getType(),
            replacedChannels);
    var replacedChannelGroups = List.of(replacedChannelGroup);
    var replacedRelPosByChan =
        Map.of(TestFixtures.channel8.getName(), RelativePosition.from(0, 0, 0));

    return Stream.of(
        // Update StationType
        Arguments.arguments(
            stationBase,
            Station.from(
                stationBase.getName(),
                StationType.UNKNOWN,
                stationBase.getDescription(),
                relPosByChannelBase,
                stationBase.getLocation(),
                channelGroupsBase,
                channelsBase)),
        // Update Description
        Arguments.arguments(
            stationBase,
            Station.from(
                stationBase.getName(),
                stationBase.getType(),
                "New Description",
                relPosByChannelBase,
                stationBase.getLocation(),
                channelGroupsBase,
                channelsBase)),
        // Update Location
        Arguments.arguments(
            stationBase,
            Station.from(
                stationBase.getName(),
                stationBase.getType(),
                stationBase.getDescription(),
                relPosByChannelBase,
                Location.from(0.0, 0.0, 0.0, 0.0),
                channelGroupsBase,
                channelsBase)),
        // Update with new channel in Channel Group, channels, relPos
        Arguments.arguments(
            stationBase,
            Station.from(
                stationBase.getName(),
                stationBase.getType(),
                stationBase.getDescription(),
                updatedRelPosByChan,
                stationBase.getLocation(),
                updatedChannelGroups,
                updatedChannels)),
        // Replace channel in Channel Group, channels, relPos
        Arguments.arguments(
            stationBase,
            Station.from(
                stationBase.getName(),
                stationBase.getType(),
                stationBase.getDescription(),
                replacedRelPosByChan,
                stationBase.getLocation(),
                replacedChannelGroups,
                replacedChannels)));
  }

  @Test
  void testUpdateAndResetStation() {

    var cg7 =
        ChannelGroup.from(
            "channelGroup7",
            "Channel group containing only sample channel 7",
            Location.from(100.0, 10.0, 50.0, 100.0),
            Type.SITE_GROUP,
            List.of(TestFixtures.channel7));

    var cg78 =
        ChannelGroup.from(
            "channelGroup78",
            "Channel group containing exactly sample channels 7 and 8",
            Location.from(100.0, 10.0, 50.0, 100.0),
            Type.SITE_GROUP,
            List.of(TestFixtures.channel7, TestFixtures.channel8));

    var stationName = "TESTING";

    var initialStation =
        TestFixtures.stationTwo.toBuilder()
            .setName(stationName)
            .setDescription("Station with referenced channels 7 and 8")
            .setRelativePositionsByChannel(
                Map.of(
                    "testChannelSeven", RelativePosition.from(50.0, 55.0, 64.0),
                    "testChannelEight", RelativePosition.from(50.0, 55.0, 64.0)))
            .setChannelGroups(List.of(cg78))
            .setChannels(List.of(TestFixtures.channel7, TestFixtures.channel8))
            .build();

    var updatedStation =
        initialStation.toBuilder()
            .setDescription("Station with only referenced channel 7")
            .setRelativePositionsByChannel(
                Map.of("testChannelSeven", RelativePosition.from(50.0, 55.0, 64.0)))
            .setChannelGroups(List.of(cg7))
            .setChannels(List.of(TestFixtures.channel7))
            .build();

    // Initial station store
    stationRepository.storeStations(List.of(initialStation));

    assertEquals(
        initialStation, stationRepository.retrieveAllStations(List.of(stationName)).get(0));

    // Update the station
    stationRepository.storeStations(List.of(updatedStation));

    assertEquals(
        updatedStation, stationRepository.retrieveAllStations(List.of(stationName)).get(0));

    // Revert the station to the original state
    stationRepository.storeStations(List.of(initialStation));

    assertEquals(
        initialStation, stationRepository.retrieveAllStations(List.of(stationName)).get(0));
  }

  @Test
  void testStoreStationsNullStationPassedWillThrowException() {
    assertThrows(NullPointerException.class, () -> stationRepository.storeStations(null));
  }

  @Test
  void testStoreStationWithChannelGroupThatHasNullLocation() {
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

    assertDoesNotThrow(() -> stationRepository.storeStations(List.of(station)));
  }

  // Retrieve

  @Test
  void testRetrieveStations() {
    List<Station> storedStations =
        stationRepository.retrieveAllStations(List.of(TestFixtures.station.getName()));
    Station stored = storedStations.get(0);
    assertAll(
        () -> assertEquals(TestFixtures.station.getName(), stored.getName()),
        () -> assertEquals(TestFixtures.station.getDescription(), stored.getDescription()),
        () -> assertEquals(TestFixtures.station.getLocation(), stored.getLocation()),
        () -> assertEquals(TestFixtures.station.getType(), stored.getType()),
        () -> assertEquals(TestFixtures.station.getChannelGroups(), stored.getChannelGroups()),
        () -> assertEquals(TestFixtures.station.getChannels(), stored.getChannels()),
        () ->
            assertEquals(
                TestFixtures.station.getRelativePositionsByChannel(),
                stored.getRelativePositionsByChannel()));
  }

  @Test
  void testNoStationsPassedWillRetrieveAllStations() {
    List<Station> storedStations = stationRepository.retrieveAllStations(List.of());

    storedStations.forEach(
        stored -> {
          if (stored.getName().equalsIgnoreCase("stationOne")) {
            assertAll(
                () -> assertEquals(TestFixtures.station.getName(), stored.getName()),
                () -> assertEquals(TestFixtures.station.getDescription(), stored.getDescription()),
                () -> assertEquals(TestFixtures.station.getLocation(), stored.getLocation()),
                () -> assertEquals(TestFixtures.station.getType(), stored.getType()),
                () ->
                    assertEquals(
                        TestFixtures.station.getChannelGroups(), stored.getChannelGroups()),
                () -> assertEquals(TestFixtures.station.getChannels(), stored.getChannels()),
                () ->
                    assertEquals(
                        TestFixtures.station.getRelativePositionsByChannel(),
                        stored.getRelativePositionsByChannel()));
          }
        });
  }

  @Test
  void testNullStationIdCollectionToRetrieveAllStationsWillThrowException() {
    assertThrows(NullPointerException.class, () -> stationRepository.retrieveAllStations(null));
  }
}
