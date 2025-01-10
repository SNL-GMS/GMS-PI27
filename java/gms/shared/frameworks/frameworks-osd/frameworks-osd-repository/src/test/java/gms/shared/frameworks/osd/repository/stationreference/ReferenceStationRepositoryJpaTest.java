package gms.shared.frameworks.osd.repository.stationreference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.util.ReferenceStationMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStation;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStationMembership;
import gms.shared.frameworks.osd.repository.util.TestFixtures;
import jakarta.persistence.EntityManagerFactory;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("migrate to h2")
class ReferenceStationRepositoryJpaTest {

  private static ReferenceStationRepositoryJpa referenceStationRepositoryJpa;
  private static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  static void testSuiteSetup() {
    referenceStationRepositoryJpa = new ReferenceStationRepositoryJpa(entityManagerFactory);

    // store all the reference station for later testing
    referenceStationRepositoryJpa.storeReferenceStation(
        List.of(TestFixtures.JNU_V1, TestFixtures.JNU_V2, TestFixtures.JNU_V3));
    referenceStationRepositoryJpa.storeStationMemberships(TestFixtures.stationMemberships);
  }

  @Test
  void testStoringStationsTwiceWillThrowException() {
    var referenceStationCollection =
        List.of(TestFixtures.JNU_V1, TestFixtures.JNU_V2, TestFixtures.JNU_V3);
    RuntimeException ex =
        assertThrows(
            RuntimeException.class,
            () -> referenceStationRepositoryJpa.storeReferenceStation(referenceStationCollection));
    assertEquals(DataExistsException.class, ex.getCause().getClass());
  }

  @Test
  void testRetrieveStationsTestGivenEmptyList() {
    List<ReferenceStation> stations = referenceStationRepositoryJpa.retrieveStations(List.of());
    assertEquals(TestFixtures.jnuVersions, stations);
  }

  @Test
  void testRetrieveStationsTestGivenNonEmptyList() {
    List<UUID> ids =
        List.of(
            TestFixtures.JNU_V1.getEntityId(),
            TestFixtures.JNU_V2.getEntityId(),
            TestFixtures.JNU_V3.getEntityId());
    List<ReferenceStation> stations = referenceStationRepositoryJpa.retrieveStations(ids);
    assertEquals(TestFixtures.jnuVersions, stations);
  }

  @Test
  void testRetrieveStationsByNameTestGivenNonEmptyList() {
    List<String> names =
        List.of(
            TestFixtures.JNU_V1.getName(),
            TestFixtures.JNU_V2.getName(),
            TestFixtures.JNU_V3.getName());
    List<ReferenceStation> stations = referenceStationRepositoryJpa.retrieveStationsByName(names);
    assertEquals(TestFixtures.jnuVersions, stations);
  }

  @Test
  void testRetrieveStationsByName() {
    // assert that all three s of jnu have the same name
    assertEquals(TestFixtures.JNU_V1.getName(), TestFixtures.JNU_V2.getName());
    assertEquals(TestFixtures.JNU_V2.getName(), TestFixtures.JNU_V3.getName());
    List<ReferenceStation> stations =
        referenceStationRepositoryJpa.retrieveStationsByName(
            List.of(TestFixtures.JNU_V1.getName()));
    assertNotNull(stations);
    assertEquals(TestFixtures.jnuVersions.size(), stations.size());
    assertEquals(TestFixtures.jnuVersions, stations);
    // query for stations with with a bad name (that shouldn't exist)
    stations = referenceStationRepositoryJpa.retrieveStationsByName(List.of("UNKNOWN_NAME"));
    assertNotNull(stations);
    assertTrue(stations.isEmpty());
  }

  @Test
  void testRetrieveStationsByEntityId() {
    // assert that all three s of jnu have the same entity id
    assertEquals(TestFixtures.JNU_V1.getEntityId(), TestFixtures.JNU_V2.getEntityId());
    assertEquals(TestFixtures.JNU_V2.getEntityId(), TestFixtures.JNU_V3.getEntityId());
    List<ReferenceStation> stations =
        referenceStationRepositoryJpa.retrieveStations(List.of(TestFixtures.JNU_V1.getEntityId()));
    assertNotNull(stations);
    assertEquals(TestFixtures.jnuVersions.size(), stations.size());
    assertEquals(TestFixtures.jnuVersions, stations);
    // query for stations with with a bad ID (that shouldn't exist)
    stations =
        referenceStationRepositoryJpa.retrieveStations(
            List.of(UUID.fromString("10000000-100-0000-1000-100000000110")));
    assertNotNull(stations);
    assertTrue(stations.isEmpty());
  }

  @Test
  void testRetrieveStationMembershipsByStationId() {
    UUID staId = TestFixtures.JNU_V1.getEntityId();
    Map<UUID, List<ReferenceStationMembership>> memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationId(List.of(staId));
    Set<ReferenceStationMembership> expectedMemberships =
        TestFixtures.stationMemberships.stream()
            .filter(m -> m.getStationId().equals(staId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, memberships.get(staId).stream().collect(Collectors.toSet()));
    // query for bad ID, expect no results
    memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationId(
            List.of(TestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveStationMembershipsBySiteId() {
    UUID siteId = TestFixtures.JNU_SITE_V1.getEntityId();
    Map<UUID, List<ReferenceStationMembership>> memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsBySiteId(List.of(siteId));
    Set<ReferenceStationMembership> expectedMemberships =
        TestFixtures.stationMemberships.stream()
            .filter(m -> m.getSiteId().equals(siteId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, memberships.get(siteId).stream().collect(Collectors.toSet()));
    // query for bad ID, expect no results
    memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsBySiteId(
            List.of(TestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveStationMembershipsByStationAndSiteId() {
    UUID stationId = TestFixtures.JNU_V1.getEntityId();
    UUID siteId = TestFixtures.JNU_SITE_V1.getEntityId();
    List<ReferenceStationMembership> memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationAndSiteId(
            ReferenceStationMembershipRequest.create(stationId, siteId));
    Set<ReferenceStationMembership> expectedMemberships =
        TestFixtures.stationMemberships.stream()
            .filter(m -> m.getStationId().equals(stationId))
            .filter(m -> m.getSiteId().equals(siteId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships));
    // query for bad ID's, expect no results
    memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationAndSiteId(
            ReferenceStationMembershipRequest.create(
                TestFixtures.UNKNOWN_ID, TestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationAndSiteId(
            ReferenceStationMembershipRequest.create(stationId, TestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        referenceStationRepositoryJpa.retrieveStationMembershipsByStationAndSiteId(
            ReferenceStationMembershipRequest.create(TestFixtures.UNKNOWN_ID, siteId));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }
}
