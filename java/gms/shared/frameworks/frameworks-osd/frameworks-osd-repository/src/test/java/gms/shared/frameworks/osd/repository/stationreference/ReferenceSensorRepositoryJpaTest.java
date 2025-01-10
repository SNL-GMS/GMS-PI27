package gms.shared.frameworks.osd.repository.stationreference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSensor;
import gms.shared.frameworks.osd.coi.stationreference.StationReferenceTestFixtures;
import jakarta.persistence.EntityManagerFactory;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class ReferenceSensorRepositoryJpaTest {

  private static ReferenceSensorRepositoryJpa referenceSensorRepository;
  private static final Collection<ReferenceSensor> referenceSensorList =
      List.of(StationReferenceTestFixtures.REFERENCE_SENSOR);

  private static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  static void testSuiteSetup() {
    referenceSensorRepository = new ReferenceSensorRepositoryJpa(entityManagerFactory);
    // store test data
    referenceSensorRepository.storeReferenceSensors(referenceSensorList);
  }

  @Test
  void testStoringSensorsTwiceWillThrowException() {
    RuntimeException ex =
        assertThrows(
            RuntimeException.class,
            () -> referenceSensorRepository.storeReferenceSensors(referenceSensorList));
    assertEquals(DataExistsException.class, ex.getCause().getClass());
  }

  @Test
  void testRetrievalByIdNonEmptyList() {
    List<UUID> searchIds = List.of(StationReferenceTestFixtures.REFERENCE_SENSOR.getId());
    List<ReferenceSensor> sensors =
        referenceSensorRepository.retrieveReferenceSensorsById(searchIds);
    assertEquals(1, sensors.size());
    assertEquals(referenceSensorList, sensors);
  }

  @Test
  void testRetrievalByIdEmptyList() {
    List<ReferenceSensor> sensors =
        referenceSensorRepository.retrieveReferenceSensorsById(List.of());
    assertEquals(1, sensors.size());
    assertEquals(referenceSensorList, sensors);
  }

  @Test
  void testRetrievalByChannelName() {
    List<String> searchIds =
        List.of(StationReferenceTestFixtures.REFERENCE_SENSOR.getChannelName());
    Map<String, List<ReferenceSensor>> sensors =
        referenceSensorRepository.retrieveSensorsByChannelName(searchIds);
    assertEquals(
        referenceSensorList,
        sensors.get(StationReferenceTestFixtures.REFERENCE_SENSOR.getChannelName()));
  }

  @Test
  void testRetrievalByIdThrowsIllegalArgumentExceptionWhenPassedAnEmptyList() {
    var emptyList = List.<String>of();
    assertThrows(
        IllegalArgumentException.class,
        () -> referenceSensorRepository.retrieveSensorsByChannelName(emptyList));
  }
}
