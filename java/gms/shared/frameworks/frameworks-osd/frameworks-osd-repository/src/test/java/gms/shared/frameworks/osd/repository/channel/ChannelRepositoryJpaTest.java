package gms.shared.frameworks.osd.repository.channel;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.osd.api.channel.ChannelRepository;
import gms.shared.frameworks.osd.api.station.StationRepository;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import gms.shared.utilities.db.test.utils.TestFixtures;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Query;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class ChannelRepositoryJpaTest {

  private static EntityManagerFactory entityManagerFactory;
  private static final ChannelRepository channelRepository =
      new ChannelRepositoryJpa(entityManagerFactory);
  private static final StationRepository stationRepository =
      new StationRepositoryJpa(entityManagerFactory);
  private static final List<Channel> CHANNELS =
      List.of(
          TestFixtures.channel1,
          TestFixtures.channel2,
          TestFixtures.channel3,
          TestFixtures.channel4,
          TestFixtures.channel5,
          TestFixtures.channel6);

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
  void testStoreChannels() {
    channelRepository.storeChannels(List.of(TestFixtures.derivedChannelOne));
    List<Channel> storedChannels = channelRepository.retrieveChannels(List.of("derivedChannelOne"));
    assertAll(
        () -> assertFalse(storedChannels.isEmpty()),
        () -> assertEquals(TestFixtures.derivedChannelOne, storedChannels.get(0)));
  }

  @Test
  void testStoringChannelWithStationThatDoesNotExistThrowsException() {
    final List<Channel> channels = List.of(TestFixtures.channelWithNonExistentStation);
    assertThrows(Exception.class, () -> channelRepository.storeChannels(channels));
  }

  @Test
  void testStoringChannelThatExistsAlreadyThrowsException() {
    final List<Channel> channels = List.of(TestFixtures.channel1);
    assertThrows(Exception.class, () -> channelRepository.storeChannels(channels));
  }

  @Test
  void testStoringNullChannelIdListPassedWillThrowException() {
    assertThrows(NullPointerException.class, () -> channelRepository.storeChannels(null));
  }

  // Retrieve

  @Test
  void testRetrieveChannels() {
    List<String> channelIds = CHANNELS.stream().map(Channel::getName).collect(Collectors.toList());
    List<Channel> storedChannels = channelRepository.retrieveChannels(channelIds);
    for (Channel channel : CHANNELS) {
      assertTrue(storedChannels.contains(channel));
    }
  }

  @Test
  void testEmptyListPassedToRetrieveChannelsWillReturnAllChannels() {
    List<Channel> storedChannels = channelRepository.retrieveChannels(List.of());
    for (Channel channel : CHANNELS) {
      assertTrue(storedChannels.contains(channel));
    }
  }
}
