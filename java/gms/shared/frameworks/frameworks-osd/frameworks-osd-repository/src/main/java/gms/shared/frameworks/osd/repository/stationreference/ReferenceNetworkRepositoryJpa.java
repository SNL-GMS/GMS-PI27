package gms.shared.frameworks.osd.repository.stationreference;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.ReferenceNetworkRepository;
import gms.shared.frameworks.osd.api.stationreference.util.NetworkMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetwork;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetworkMembership;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceNetworkDao;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceNetworkMembershipDao;
import gms.shared.frameworks.osd.repository.utils.RepositoryUtility;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class ReferenceNetworkRepositoryJpa implements ReferenceNetworkRepository {

  private final EntityManagerFactory entityManagerFactory;
  private final RepositoryUtility<ReferenceNetwork, ReferenceNetworkDao>
      referenceNetworkRepoUtility;
  private final RepositoryUtility<ReferenceNetworkMembership, ReferenceNetworkMembershipDao>
      referenceNetworkMembershipRepoUtility;

  public ReferenceNetworkRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    this.referenceNetworkRepoUtility =
        RepositoryUtility.create(
            ReferenceNetworkDao.class, ReferenceNetworkDao::new, ReferenceNetworkDao::toCoi);
    this.referenceNetworkMembershipRepoUtility =
        RepositoryUtility.create(
            ReferenceNetworkMembershipDao.class,
            ReferenceNetworkMembershipDao::new,
            ReferenceNetworkMembershipDao::toCoi);
  }

  @Override
  public List<ReferenceNetwork> retrieveNetworks(Collection<UUID> networkIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceNetworkDao> query = cb.createQuery(ReferenceNetworkDao.class);
      Root<ReferenceNetworkDao> from = query.from(ReferenceNetworkDao.class);
      if (!networkIds.isEmpty()) {
        query.select(from).where(from.get("entityId").in(networkIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceNetworkDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceNetwork> retrieveNetworksByName(List<String> names) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceNetworkDao> query = cb.createQuery(ReferenceNetworkDao.class);
      Root<ReferenceNetworkDao> from = query.from(ReferenceNetworkDao.class);
      if (!names.isEmpty()) {
        query.select(from).where(from.get("name").in(names));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceNetworkDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeReferenceNetwork(Collection<ReferenceNetwork> networks) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceNetwork network : networks) {
        if (referenceNetworkExists(network, entityManager)) {
          throw new DataExistsException(String.format("ReferenceNetwork %s", network.getName()));
        }
      }
      referenceNetworkRepoUtility.persist(networks, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException(ex);
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceNetworkMembership>> retrieveNetworkMembershipsByNetworkId(
      Collection<UUID> networkMembershipIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceNetworkMembershipDao> query =
          cb.createQuery(ReferenceNetworkMembershipDao.class);
      Root<ReferenceNetworkMembershipDao> from = query.from(ReferenceNetworkMembershipDao.class);
      if (!networkMembershipIds.isEmpty()) {
        query.select(from).where(from.get("networkId").in(networkMembershipIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceNetworkMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceNetworkMembership::getNetworkId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceNetworkMembership>> retrieveNetworkMembershipsByStationId(
      Collection<UUID> referenceStationIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceNetworkMembershipDao> query =
          cb.createQuery(ReferenceNetworkMembershipDao.class);
      Root<ReferenceNetworkMembershipDao> from = query.from(ReferenceNetworkMembershipDao.class);
      if (!referenceStationIds.isEmpty()) {
        query.select(from).where(from.get("stationId").in(referenceStationIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceNetworkMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceNetworkMembership::getStationId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceNetworkMembership> retrieveNetworkMembershipsByNetworkAndStationId(
      NetworkMembershipRequest request) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceNetworkMembershipDao> query =
          cb.createQuery(ReferenceNetworkMembershipDao.class);
      Root<ReferenceNetworkMembershipDao> from = query.from(ReferenceNetworkMembershipDao.class);
      query
          .select(from)
          .where(
              cb.and(
                  cb.equal(from.get("networkId"), request.getNetworkId()),
                  cb.equal(from.get("stationId"), request.getStationId())));
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceNetworkMembershipDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeNetworkMemberships(Collection<ReferenceNetworkMembership> memberships) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceNetworkMembership membership : memberships) {
        if (referenceNetworkMembershipExists(membership, entityManager)) {
          throw new DataExistsException(
              String.format(
                  "ReferenceNetworkMembership with comment: %s", membership.getComment()));
        }
      }
      referenceNetworkMembershipRepoUtility.persist(memberships, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException(ex);
    } finally {
      entityManager.close();
    }
  }

  private static boolean referenceNetworkExists(ReferenceNetwork network, EntityManager em) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<Long> query = cb.createQuery(Long.class);
    Root<ReferenceNetworkDao> from = query.from(ReferenceNetworkDao.class);
    query.select(cb.count(from)).where(cb.equal(from.get("versionId"), network.getVersionId()));
    return em.createQuery(query).getSingleResult() == 1;
  }

  private static boolean referenceNetworkMembershipExists(
      ReferenceNetworkMembership networkMembership, EntityManager em) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<Long> query = cb.createQuery(Long.class);
    Root<ReferenceNetworkMembershipDao> from = query.from(ReferenceNetworkMembershipDao.class);
    query.select(cb.count(from)).where(cb.equal(from.get("id"), networkMembership.getId()));
    return em.createQuery(query).getSingleResult() == 1;
  }
}
