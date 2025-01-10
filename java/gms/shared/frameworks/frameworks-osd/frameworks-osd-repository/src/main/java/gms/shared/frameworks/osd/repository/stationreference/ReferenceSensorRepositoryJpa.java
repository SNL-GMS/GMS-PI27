package gms.shared.frameworks.osd.repository.stationreference;

import gms.shared.frameworks.coi.exceptions.DataExistsException;
import gms.shared.frameworks.osd.api.stationreference.ReferenceSensorRepository;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSensor;
import gms.shared.frameworks.osd.dao.stationreference.ReferenceSensorDao;
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
import org.apache.commons.lang3.Validate;

public class ReferenceSensorRepositoryJpa implements ReferenceSensorRepository {

  private final EntityManagerFactory entityManagerFactory;
  private final RepositoryUtility<ReferenceSensor, ReferenceSensorDao> repositoryUtility;

  public ReferenceSensorRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
    this.repositoryUtility =
        RepositoryUtility.create(
            ReferenceSensorDao.class, ReferenceSensorDao::new, ReferenceSensorDao::toCoi);
  }

  @Override
  public List<ReferenceSensor> retrieveReferenceSensorsById(Collection<UUID> sensorIds) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSensorDao> query = cb.createQuery(ReferenceSensorDao.class);
      Root<ReferenceSensorDao> from = query.from(ReferenceSensorDao.class);
      if (!sensorIds.isEmpty()) {
        query.select(from).where(from.get("id").in(sensorIds));
      }
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSensorDao::toCoi)
          .toList();
    } finally {
      entityManager.close();
    }
  }

  @Override
  public Map<String, List<ReferenceSensor>> retrieveSensorsByChannelName(
      Collection<String> channelNames) {
    Validate.notEmpty(channelNames);
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      var cb = entityManager.getCriteriaBuilder();
      CriteriaQuery<ReferenceSensorDao> query = cb.createQuery(ReferenceSensorDao.class);
      Root<ReferenceSensorDao> from = query.from(ReferenceSensorDao.class);
      query.select(from).where(from.get("channelName").in(channelNames));
      return entityManager
          .createQuery(query)
          .getResultStream()
          .map(ReferenceSensorDao::toCoi)
          .collect(Collectors.groupingBy(ReferenceSensor::getChannelName));
    } finally {
      entityManager.close();
    }
  }

  @Override
  public void storeReferenceSensors(Collection<ReferenceSensor> sensors) {
    var entityManager = entityManagerFactory.createEntityManager();
    try {
      for (ReferenceSensor sensor : sensors) {
        if (referenceSensorExists(sensor, entityManager)) {
          throw new DataExistsException(
              String.format(
                  "ReferenceSensor %s with comment %s", sensor.getId(), sensor.getComment()));
        }
      }
      this.repositoryUtility.persist(sensors, entityManager);
    } catch (Exception ex) {
      throw new RuntimeException(ex);
    } finally {
      entityManager.close();
    }
  }

  private static boolean referenceSensorExists(ReferenceSensor sensor, EntityManager em) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<Long> query = cb.createQuery(Long.class);
    Root<ReferenceSensorDao> from = query.from(ReferenceSensorDao.class);
    query.select(cb.count(from)).where(cb.equal(from.get("id"), sensor.getId()));
    return em.createQuery(query).getSingleResult() == 1;
  }
}
