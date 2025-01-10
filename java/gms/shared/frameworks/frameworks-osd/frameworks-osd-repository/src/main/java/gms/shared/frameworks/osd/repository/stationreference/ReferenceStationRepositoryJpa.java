package gms.shared.frameworks.osd.repository.stationreference;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.ReferenceStationRepository;
import gms.shared.frameworks.osd.api.stationreference.util.ReferenceStationMembershipRequest;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStation;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStationMembership;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceStationDao;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceStationMembershipDao;
import gms.shared.frameworks.osd.repository.utils.RepositoryUtility;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class ReferenceStationRepositoryJpa implements ReferenceStationRepository {

  private final EntityManagerFactory entityManagerFactory;
  private final RepositoryUtility<ReferenceStation, ReferenceStationDao>
      referenceStationRepositoryUtility;
  private final RepositoryUtility<ReferenceStationMembership, ReferenceStationMembershipDao>
      referenceStationMembershipRepositoryUtility;

  public ReferenceStationRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    this.referenceStationRepositoryUtility =
        RepositoryUtility.create(
            ReferenceStationDao.class, ReferenceStationDao::new, ReferenceStationDao::toCoi);
    this.referenceStationMembershipRepositoryUtility =
        RepositoryUtility.create(
            ReferenceStationMembershipDao.class,
            ReferenceStationMembershipDao::new,
            ReferenceStationMembershipDao::toCoi);
  }

  @Override
  public List<ReferenceStation> retrieveStations(List<UUID> entityIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationDao> query = cb.createQuery(ReferenceStationDao.class);
      Root<ReferenceStationDao> from = query.from(ReferenceStationDao.class);
      query.select(from);
      if (!entityIds.isEmpty()) {
        query.where(
            cb.or(
                entityIds.stream()
                    .map(id -> cb.equal(from.get("entityId"), id))
                    .toArray(Predicate[]::new)));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceStation> retrieveStationsByVersionIds(Collection<UUID> stationVersionIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationDao> query = cb.createQuery(ReferenceStationDao.class);
      Root<ReferenceStationDao> from = query.from(ReferenceStationDao.class);
      query.select(from);
      if (!stationVersionIds.isEmpty()) {
        query.where(
            cb.or(
                stationVersionIds.stream()
                    .map(id -> cb.equal(from.get("versionId"), id))
                    .toArray(Predicate[]::new)));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceStation> retrieveStationsByName(List<String> names) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationDao> query = cb.createQuery(ReferenceStationDao.class);
      Root<ReferenceStationDao> from = query.from(ReferenceStationDao.class);
      query.select(from);
      if (!names.isEmpty()) {
        query.where(
            cb.or(
                names.stream()
                    .map(id -> cb.equal(from.get("name"), id))
                    .toArray(Predicate[]::new)));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeReferenceStation(Collection<ReferenceStation> stations) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceStation station : stations) {
        if (referenceStationExists(station, entityManager)) {
          throw new DataExistsException(
              String.format(
                  "ReferenceStation name %s version %s",
                  station.getName(), station.getVersionId()));
        }
      }
      referenceStationRepositoryUtility.persist(stations, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException("Error storing stations", ex);
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMemberships(List<UUID> ids) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationMembershipDao> query =
          cb.createQuery(ReferenceStationMembershipDao.class);
      Root<ReferenceStationMembershipDao> from = query.from(ReferenceStationMembershipDao.class);
      query.select(from);
      if (!ids.isEmpty()) {
        query.where(from.get("id").in(ids));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceStationMembership::getId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMembershipsByStationId(
      List<UUID> stationIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationMembershipDao> query =
          cb.createQuery(ReferenceStationMembershipDao.class);
      Root<ReferenceStationMembershipDao> from = query.from(ReferenceStationMembershipDao.class);
      query.select(from);
      if (!stationIds.isEmpty()) {
        query.where(from.get("stationId").in(stationIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceStationMembership::getStationId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<UUID, List<ReferenceStationMembership>> retrieveStationMembershipsBySiteId(
      List<UUID> siteIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationMembershipDao> query =
          cb.createQuery(ReferenceStationMembershipDao.class);
      Root<ReferenceStationMembershipDao> from = query.from(ReferenceStationMembershipDao.class);
      query.select(from);
      if (!siteIds.isEmpty()) {
        query.where(from.get("siteId").in(siteIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationMembershipDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceStationMembership::getSiteId));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public List<ReferenceStationMembership> retrieveStationMembershipsByStationAndSiteId(
      ReferenceStationMembershipRequest request) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceStationMembershipDao> query =
          cb.createQuery(ReferenceStationMembershipDao.class);
      Root<ReferenceStationMembershipDao> from = query.from(ReferenceStationMembershipDao.class);
      query
          .select(from)
          .where(
              cb.and(
                  cb.equal(from.get("siteId"), request.getSiteId()),
                  cb.equal(from.get("stationId"), request.getStationId())));
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceStationMembershipDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeStationMemberships(Collection<ReferenceStationMembership> memberships) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceStationMembership stationMembership : memberships) {
        if (referenceStationMembershipExists(stationMembership, entityManager)) {
          throw new DataExistsException(
              String.format("ReferenceStationMembership Id %s", stationMembership.getId()));
        }
      }
      referenceStationMembershipRepositoryUtility.persist(memberships, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException("Error storing stations", ex);
    } finally {
      entityManager.close();
    }
  }

  private static boolean referenceStationExists(ReferenceStation station, EntityManager em) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<ReferenceStationDao> query = cb.createQuery(ReferenceStationDao.class);
    Root<ReferenceStationDao> from = query.from(ReferenceStationDao.class);
    query.select(from).where(cb.equal(from.get("versionId"), station.getVersionId()));
    List<ReferenceStationDao> res = em.createQuery(query).getResultList();
    return !res.isEmpty() && res.size() == 1;
  }

  private static boolean referenceStationMembershipExists(
      ReferenceStationMembership stationMembership, EntityManager em) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<ReferenceStationMembershipDao> query =
        cb.createQuery(ReferenceStationMembershipDao.class);
    Root<ReferenceStationMembershipDao> from = query.from(ReferenceStationMembershipDao.class);
    query.select(from).where(cb.equal(from.get("id"), stationMembership.getId()));
    List<ReferenceStationMembershipDao> res = em.createQuery(query).getResultList();
    return !res.isEmpty() && res.size() == 1;
  }
}
