package gms.shared.frameworks.osd.repository.stationreference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.util.NetworkMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetwork;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetworkMembership;
import gms.shared.frameworks.osd.coi.stationreference.StationReferenceTestFixtures;
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
class ReferenceNetworkRepositoryJpaTest {

  private static ReferenceNetworkRepositoryJpa networkRepositoryJpa;
  private static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  static void testCaseSetUp() {
    networkRepositoryJpa = new ReferenceNetworkRepositoryJpa(entityManagerFactory);
    networkRepositoryJpa.storeReferenceNetwork(
        List.of(StationReferenceTestFixtures.NET_IMS_AUX, StationReferenceTestFixtures.NET_IDC_DA));
    networkRepositoryJpa.storeNetworkMemberships(
        StationReferenceTestFixtures.referenceNetworkMemberships);
  }

  @Test
  void testStoringNetworksTwiceWillThrowException() {
    var referenceNetworkCollection =
        List.of(StationReferenceTestFixtures.NET_IMS_AUX, StationReferenceTestFixtures.NET_IDC_DA);
    RuntimeException ex =
        assertThrows(
            RuntimeException.class,
            () -> networkRepositoryJpa.storeReferenceNetwork(referenceNetworkCollection));
    assertEquals(DataExistsException.class, ex.getCause().getClass());
  }

  @Test
  void testStoringNetworkMembershipsTwiceWillThrowException() {
    RuntimeException ex =
        assertThrows(
            RuntimeException.class,
            () ->
                networkRepositoryJpa.storeNetworkMemberships(
                    StationReferenceTestFixtures.referenceNetworkMemberships));
    assertEquals(DataExistsException.class, ex.getCause().getClass());
  }

  @Test
  void testRetrieveNetworksGivenNonEmptyCollection() {
    List<ReferenceNetwork> allNets =
        networkRepositoryJpa.retrieveNetworks(
            List.of(
                StationReferenceTestFixtures.NET_IMS_AUX.getEntityId(),
                StationReferenceTestFixtures.NET_IDC_DA.getEntityId()));
    assertNotNull(allNets);
    assertEquals(2, allNets.size());
    assertTrue(allNets.contains(StationReferenceTestFixtures.NET_IMS_AUX));
    assertTrue(allNets.contains(StationReferenceTestFixtures.NET_IDC_DA));
  }

  @Test
  void testRetrieveNetworksGivenEmptyCollection() {
    List<ReferenceNetwork> allNets = networkRepositoryJpa.retrieveNetworks(List.of());
    assertNotNull(allNets);
    assertEquals(2, allNets.size());
    assertTrue(allNets.contains(StationReferenceTestFixtures.NET_IMS_AUX));
    assertTrue(allNets.contains(StationReferenceTestFixtures.NET_IDC_DA));
  }

  @Test
  void testRetrieveNetworksByName() {
    // query for network imx_aux
    List<ReferenceNetwork> networks =
        networkRepositoryJpa.retrieveNetworksByName(
            List.of(StationReferenceTestFixtures.NET_IMS_AUX.getName()));
    assertNotNull(networks);
    assertEquals(1, networks.size());
    assertTrue(networks.contains(StationReferenceTestFixtures.NET_IMS_AUX));
    // query for network idc_da
    networks =
        networkRepositoryJpa.retrieveNetworksByName(
            List.of(StationReferenceTestFixtures.NET_IDC_DA.getName()));
    assertNotNull(networks);
    assertEquals(1, networks.size());
    assertTrue(networks.contains(StationReferenceTestFixtures.NET_IDC_DA));
    // query for networks with a bad name (that shouldn't exist)
    networks = networkRepositoryJpa.retrieveNetworksByName(List.of());
    assertNotNull(networks);
    assertEquals(2, networks.size());
    assertTrue(networks.contains(StationReferenceTestFixtures.NET_IMS_AUX));
    assertTrue(networks.contains(StationReferenceTestFixtures.NET_IDC_DA));
  }

  @Test
  void testRetrieveNetworkMembershipsByNetworkId() {
    UUID netId = StationReferenceTestFixtures.NET_IMS_AUX.getEntityId();
    Map<UUID, List<ReferenceNetworkMembership>> memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkId(List.of(netId));
    Set<ReferenceNetworkMembership> expectedMemberships =
        StationReferenceTestFixtures.referenceNetworkMemberships.stream()
            .filter(m -> m.getNetworkId().equals(netId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships.get(netId)));
    // query for bad ID, expect no results
    memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkId(
            List.of(StationReferenceTestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveNetworkMembershipsByStationId() {
    UUID stationId = StationReferenceTestFixtures.JNU_V1.getEntityId();
    Map<UUID, List<ReferenceNetworkMembership>> memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByStationId(List.of(stationId));
    Set<ReferenceNetworkMembership> expectedMemberships =
        StationReferenceTestFixtures.referenceNetworkMemberships.stream()
            .filter(m -> m.getStationId().equals(stationId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships.get(stationId)));
    // query for bad ID, expect no results
    memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByStationId(
            List.of(StationReferenceTestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveNetworkMembershipsByNetworkAndStationId() {
    UUID netId = StationReferenceTestFixtures.NET_IMS_AUX.getEntityId();
    UUID stationId = StationReferenceTestFixtures.JNU_V1.getEntityId();
    List<ReferenceNetworkMembership> memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkAndStationId(
            NetworkMembershipRequest.from(netId, stationId));
    Set<ReferenceNetworkMembership> expectedMemberships =
        StationReferenceTestFixtures.referenceNetworkMemberships.stream()
            .filter(m -> m.getNetworkId().equals(netId))
            .filter(m -> m.getStationId().equals(stationId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships));
    // query for bad ID's, expect no results
    memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkAndStationId(
            NetworkMembershipRequest.from(
                StationReferenceTestFixtures.UNKNOWN_ID, StationReferenceTestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkAndStationId(
            NetworkMembershipRequest.from(netId, StationReferenceTestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        networkRepositoryJpa.retrieveNetworkMembershipsByNetworkAndStationId(
            NetworkMembershipRequest.from(StationReferenceTestFixtures.UNKNOWN_ID, stationId));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }
}
