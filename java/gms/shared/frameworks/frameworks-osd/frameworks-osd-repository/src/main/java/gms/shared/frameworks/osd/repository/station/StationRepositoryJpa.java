package gms.shared.frameworks.osd.repository.station;

import gms.shared.frameworks.osd.api.station.StationRepository;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import gms.shared.frameworks.osd.dao.channel.StationDao;
import gms.shared.frameworks.osd.repository.utils.StationUtils;
import gms.shared.metrics.CustomMetric;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StationRepositoryJpa implements StationRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(StationRepositoryJpa.class);

  private static final CustomMetric<StationRepositoryJpa, Long>
      stationRepositoryRetrieveAllStations =
          CustomMetric.create(
              CustomMetric::incrementer,
              "stationRepositoryRetrieveAllStations_hits:type=Counter",
              0L);

  private static final CustomMetric<StationRepositoryJpa, Long> stationRepositoryStoreStations =
      CustomMetric.create(
          CustomMetric::incrementer, "stationRepositoryStoreStations_hits:type=Counter", 0L);

  private static final CustomMetric<Long, Long> stationRepositoryRetrieveAllStationsDuration =
      CustomMetric.create(
          CustomMetric::updateTimingData,
          "stationRepositoryRetrieveAllStations_duration:type=Value",
          0L);

  private static final CustomMetric<Long, Long> stationRepositoryStoreStationsDuration =
      CustomMetric.create(
          CustomMetric::updateTimingData, "stationRepositoryStoreStations_duration:type=Value", 0L);

  private EntityManagerFactory entityManagerFactory;

  public StationRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
  }

  @Override
  public List<Station> retrieveAllStations(Collection<String> stationNames) {
    var entityManager = entityManagerFactory.createEntityManager();
    var stationUtils = new StationUtils(entityManager);

    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<StationDao> stationQuery = cb.createQuery(StationDao.class);
    Root<StationDao> fromStation = stationQuery.from(StationDao.class);

    stationQuery.select(fromStation);

    // only add the where clause if a specific set of stations was requested.
    if (!stationNames.isEmpty()) {
      stationQuery.where(
          cb.or(
              stationNames.stream()
                  .map(stationName -> cb.equal(fromStation.get("name"), stationName))
                  .toArray(Predicate[]::new)));
    }

    List<StationDao> stationDaos = entityManager.createQuery(stationQuery).getResultList();

    stationRepositoryRetrieveAllStations.updateMetric(this);
    var start = Instant.now();

    try {
      List<Station> result = new ArrayList<>();
      for (StationDao stationDao : stationDaos) {
        result.add(stationUtils.generateStation(stationDao, true));
      }
      return result;
    } catch (Exception e) {
      LOGGER.error(e.getMessage());
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      stationRepositoryRetrieveAllStationsDuration.updateMetric(timeElapsed);
    }

    return List.of();
  }

  @Override
  public void storeStations(Collection<Station> stations) {
    Objects.requireNonNull(stations);
    var entityManager = entityManagerFactory.createEntityManager();
    var stationUtils = new StationUtils(entityManager);

    entityManager.getTransaction().begin();

    stationRepositoryStoreStations.updateMetric(this);
    var start = Instant.now();

    try {
      for (Station station : stations) {
        stationUtils.storeStation(station);
      }
      entityManager.getTransaction().commit();
    } catch (Exception e) {
      entityManager.getTransaction().rollback();
      throw e;
    } finally {
      entityManager.close();

      var finish = Instant.now();
      long timeElapsed = Duration.between(start, finish).toMillis();
      stationRepositoryStoreStationsDuration.updateMetric(timeElapsed);
    }
  }
}
