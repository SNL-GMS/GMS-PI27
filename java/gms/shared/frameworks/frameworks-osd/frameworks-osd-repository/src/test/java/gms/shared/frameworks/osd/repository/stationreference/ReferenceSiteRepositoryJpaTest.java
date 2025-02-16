package gms.shared.frameworks.osd.repository.stationreference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.osd.api.stationreference.util.ReferenceSiteMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSite;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSiteMembership;
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
class ReferenceSiteRepositoryJpaTest {

  private static ReferenceSiteRepositoryJpa referenceSiteRepositoryJpa;
  private static ReferenceChannelRepositoryJpa referenceChannelRepositoryJpa;
  private static EntityManagerFactory entityManagerFactory;

  @BeforeAll
  static void testSuiteSetup() {
    referenceSiteRepositoryJpa = new ReferenceSiteRepositoryJpa(entityManagerFactory);
    referenceChannelRepositoryJpa = new ReferenceChannelRepositoryJpa(entityManagerFactory);

    // store all reference sites (for later testing)
    referenceSiteRepositoryJpa.storeReferenceSites(TestFixtures.JNU_SITE_VERSIONS);
    referenceChannelRepositoryJpa.storeReferenceChannels(TestFixtures.allReferenceChannels);
    referenceSiteRepositoryJpa.storeSiteMemberships(TestFixtures.siteMemberships);
  }

  @Test
  void testStoringReferenceSiteTwiceWillThrowException() {
    assertThrows(
        RuntimeException.class,
        () -> referenceSiteRepositoryJpa.storeReferenceSites(TestFixtures.JNU_SITE_VERSIONS));
  }

  @Test
  void testStoringReferenceSiteMembershipsTwiceWillThrowException() {
    assertThrows(
        RuntimeException.class,
        () -> referenceSiteRepositoryJpa.storeSiteMemberships(TestFixtures.siteMemberships));
  }

  @Test
  void testRetrieveSitesByName() {
    // assert that all three s of jnu have the same name
    assertEquals(TestFixtures.JNU_SITE_V1.getName(), TestFixtures.JNU_SITE_V2.getName());
    assertEquals(TestFixtures.JNU_SITE_V2.getName(), TestFixtures.JNU_SITE_V3.getName());
    List<ReferenceSite> sites =
        referenceSiteRepositoryJpa.retrieveSitesByName(List.of(TestFixtures.JNU_SITE_V1.getName()));
    assertNotNull(sites);
    assertEquals(TestFixtures.JNU_SITE_VERSIONS.size(), sites.size());
    assertEquals(TestFixtures.JNU_SITE_VERSIONS, sites);
    // query for sites with with a bad name (that shouldn't exist)
    sites = referenceSiteRepositoryJpa.retrieveSitesByName(List.of(TestFixtures.UNKNOWN_NAME));
    assertNotNull(sites);
    assertTrue(sites.isEmpty());
  }

  @Test
  void testRetrieveSites() {
    // assert that all three s of jnu have the same entity id
    assertEquals(TestFixtures.JNU_SITE_V1.getEntityId(), TestFixtures.JNU_SITE_V2.getEntityId());
    assertEquals(TestFixtures.JNU_SITE_V2.getEntityId(), TestFixtures.JNU_SITE_V3.getEntityId());
    List<ReferenceSite> sites =
        referenceSiteRepositoryJpa.retrieveSites(List.of(TestFixtures.JNU_SITE_V1.getEntityId()));
    assertNotNull(sites);
    assertEquals(TestFixtures.JNU_SITE_VERSIONS.size(), sites.size());
    assertEquals(TestFixtures.JNU_SITE_VERSIONS, sites);
    // query for sites with with a bad id (that shouldn't exist)
    sites = referenceSiteRepositoryJpa.retrieveSites(List.of(TestFixtures.UNKNOWN_ID));
    assertNotNull(sites);
    assertTrue(sites.isEmpty());
  }

  @Test
  void testRetrieveSiteMembershipsBySiteId() {
    UUID siteId = TestFixtures.JNU_SITE_V1.getEntityId();
    Map<UUID, List<ReferenceSiteMembership>> memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteId(List.of(siteId));
    Set<ReferenceSiteMembership> expectedMemberships =
        TestFixtures.siteMemberships.stream()
            .filter(m -> m.getSiteId().equals(siteId))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships.get(siteId)));
    // query for bad ID, expect no results
    memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteId(
            List.of(TestFixtures.UNKNOWN_ID));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveSiteMembershipsByChannelId() {
    String channelName = TestFixtures.CHAN_JNU_BHE_V1.getName();
    Map<String, List<ReferenceSiteMembership>> memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsByChannelNames(List.of(channelName));
    Set<ReferenceSiteMembership> expectedMemberships =
        TestFixtures.siteMemberships.stream()
            .filter(m -> m.getChannelName().equals(channelName))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships.get(channelName)));
    // query for bad ID, expect no results
    memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsByChannelNames(
            List.of(TestFixtures.UNKNOWN_ID.toString()));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }

  @Test
  void testRetrieveSiteMembershipsBySiteAndChannelId() {
    UUID siteId = TestFixtures.JNU_SITE_V1.getEntityId();
    String channelName = TestFixtures.CHAN_JNU_BHE_V1.getName();
    List<ReferenceSiteMembership> memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteIdAndChannelName(
            ReferenceSiteMembershipRequest.create(siteId, channelName));
    Set<ReferenceSiteMembership> expectedMemberships =
        TestFixtures.siteMemberships.stream()
            .filter(m -> m.getSiteId().equals(siteId))
            .filter(m -> m.getChannelName().equals(channelName))
            .collect(Collectors.toSet());
    assertEquals(expectedMemberships, new HashSet<>(memberships));
    // query for bad ID's, expect no results
    memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteIdAndChannelName(
            ReferenceSiteMembershipRequest.create(
                TestFixtures.UNKNOWN_ID, TestFixtures.UNKNOWN_ID.toString()));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteIdAndChannelName(
            ReferenceSiteMembershipRequest.create(siteId, TestFixtures.UNKNOWN_ID.toString()));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
    memberships =
        referenceSiteRepositoryJpa.retrieveSiteMembershipsBySiteIdAndChannelName(
            ReferenceSiteMembershipRequest.create(TestFixtures.UNKNOWN_ID, channelName));
    assertNotNull(memberships);
    assertTrue(memberships.isEmpty());
  }
}
