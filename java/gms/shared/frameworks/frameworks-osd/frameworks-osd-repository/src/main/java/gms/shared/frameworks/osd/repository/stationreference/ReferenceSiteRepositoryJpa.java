package gms.shared.frameworks.osd.repository.stationreference;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSiteRepository;
import gms.shared.frameworks.osd.api.stationreference.util.ReferenceSiteMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSite;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSiteMembership;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceSiteDao;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceSiteMembershipDao;
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

public class ReferenceSiteRepositoryJpa implements ReferenceSiteRepository {

  private final EntityManagerFactory entityManagerFactory;
  private final RepositoryUtility<ReferenceSite, ReferenceSiteDao> referenceSitePersister;
  private final RepositoryUtility<ReferenceSiteMembership, ReferenceSiteMembershipDao>
      referenceSiteMembershipPersister;

  public ReferenceSiteRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    this.referenceSitePersister =
        RepositoryUtility.create(
            ReferenceSiteDao.class, ReferenceSiteDao::new, ReferenceSiteDao::toCoi);
    this.referenceSiteMembershipPersister =
        RepositoryUtility.create(
            ReferenceSiteMembershipDao.class,
            ReferenceSiteMembershipDao::new,
            ReferenceSiteMembershipDao::toCoi);
  }

  @Override
  public List<ReferenceSite> retrieveSites(List<UUID> entityIds) {
    var entityManager = entityManagerFactory.createEntityManager();

    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSiteDao> query = cb.createQuery(ReferenceSiteDao.class);
      Root<ReferenceSiteDao> from = query.from(ReferenceSiteDao.class);
      query.select(from);
      if (!entityIds.isEmpty()) {
        query.where(from.get("entityId").in(entityIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSiteDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceSite> retrieveSitesByName(List<String> names) {
    var entityManager = entityManagerFactory.createEntityManager();

    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSiteDao> query = cb.createQuery(ReferenceSiteDao.class);
      Root<ReferenceSiteDao> from = query.from(ReferenceSiteDao.class);
      query.select(from);
      if (!names.isEmpty()) {
        query.where(from.get("name").in(names));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSiteDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeReferenceSites(Collection<ReferenceSite> sites) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceSite site : sites) {
        if (siteExists(entityManager, site)) {
          throw new DataExistsException(
              String.format(
                  "ReferenceSite %s exists already in OSD. batch transaction cancelled.",
                  site.getName()));
        }
      }
      this.referenceSitePersister.persist(sites, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException(ex);
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceSiteMembership>> retrieveSiteMembershipsBySiteId(
      List<UUID> siteIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSiteMembershipDao> query =
          cb.createQuery(ReferenceSiteMembershipDao.class);
      Root<ReferenceSiteMembershipDao> from = query.from(ReferenceSiteMembershipDao.class);
      query.select(from);
      if (!siteIds.isEmpty()) {
        query.where(from.get("siteId").in(siteIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSiteMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceSiteMembership::getSiteId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<String, List<ReferenceSiteMembership>> retrieveSiteMembershipsByChannelNames(
      List<String> channelNames) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSiteMembershipDao> query =
          cb.createQuery(ReferenceSiteMembershipDao.class);
      Root<ReferenceSiteMembershipDao> from = query.from(ReferenceSiteMembershipDao.class);
      query.select(from);
      if (!channelNames.isEmpty()) {
        query.where(from.get("channelName").in(channelNames));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSiteMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceSiteMembership::getChannelName));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceSiteMembership> retrieveSiteMembershipsBySiteIdAndChannelName(
      ReferenceSiteMembershipRequest request) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSiteMembershipDao> query =
          cb.createQuery(ReferenceSiteMembershipDao.class);
      Root<ReferenceSiteMembershipDao> from = query.from(ReferenceSiteMembershipDao.class);
      query.select(from);
      query.where(
          cb.and(
              cb.equal(from.get("siteId"), request.getSiteId()),
              cb.equal(from.get("channelName"), request.getChannelName())));
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSiteMembershipDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeSiteMemberships(Collection<ReferenceSiteMembership> memberships) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceSiteMembership membership : memberships) {
        if (siteMembershipExists(entityManager, membership)) {
          throw new DataExistsException(
              String.format(
                  "ReferenceSite %s exists already in OSD. batch transaction cancelled.",
                  membership.getId()));
        }
      }
      this.referenceSiteMembershipPersister.persist(memberships, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException(ex);
    } finally {
      entityManager.close();
    }
  }

  private static boolean siteExists(EntityManager em, ReferenceSite site) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<ReferenceSiteDao> query = cb.createQuery(ReferenceSiteDao.class);
    Root<ReferenceSiteDao> from = query.from(ReferenceSiteDao.class);
    query.select(from).where(cb.equal(from.get("versionId"), site.getVersionId()));
    List<ReferenceSiteDao> results = em.createQuery(query).getResultList();
    return !results.isEmpty() && results.size() == 1;
  }

  private static boolean siteMembershipExists(
      EntityManager em, ReferenceSiteMembership siteMembership) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<ReferenceSiteMembershipDao> query =
        cb.createQuery(ReferenceSiteMembershipDao.class);
    Root<ReferenceSiteMembershipDao> from = query.from(ReferenceSiteMembershipDao.class);
    query.select(from).where(cb.equal(from.get("id"), siteMembership.getId()));
    List<ReferenceSiteMembershipDao> results = em.createQuery(query).getResultList();
    return !results.isEmpty() && results.size() == 1;
  }
}
