package gms.shared.event.connector;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import com.google.common.collect.Lists;
import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.OriginDao;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link OriginDao}s from the database */
public class OriginDatabaseConnector extends AbstractPooledConnector<OriginDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(OriginDatabaseConnector.class);
  private static final int PARTITION_SIZE = 500;
  private static final double MILLI_PER_SEC = 1000.0;

  public static final String ORIGIN_ID = "originId";
  public static final String EVENT_ID = "eventId";

  public OriginDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(OriginDao.class, entityManagerFactory);
  }

  /**
   * Retrieves a list of OriginDaos associated with the passed in eventIds
   *
   * @param eventIds to retrieve
   * @return a list of OriginDaos
   */
  public List<OriginDao> findByEventIds(List<Long> eventIds) {
    checkNotNull(eventIds, "The collection of EventIds cannot be null!");
    checkArgument(!eventIds.isEmpty(), "The collection of EventIds cannot be empty!");

    return Lists.partition(new ArrayList<>(eventIds), PARTITION_SIZE).stream()
        .map(
            partitionedEventIds ->
                queryForAll(
                    (cb, from) ->
                        cb.or(
                            partitionedEventIds.stream()
                                .map(eventId -> cb.and(cb.equal(from.get(EVENT_ID), eventId)))
                                .toArray(Predicate[]::new))))
        .flatMap(Collection::stream)
        .collect(Collectors.toList());
  }

  /**
   * Retrieves an {@link OriginDao} associated with the passed in originId
   *
   * @param originId to retrieve
   * @return a OriginDao if found, otherwise an empty {@link Optional}
   */
  public Optional<OriginDao> findById(long originId) {
    return queryForSingle((cb, from) -> cb.equal(from.get(ORIGIN_ID), originId));
  }

  /**
   * Retrieves a list of OriginDaos based on the range [startTime, endTime] +- the Origerr.stime
   * (bounds are inclusive)
   *
   * @param startTime the startTime
   * @param endTime the endTime
   * @return a list of OriginDaos
   */
  public List<OriginDao> findByTime(Instant startTime, Instant endTime) {
    checkNotNull(startTime, "startTime cannot be null!");
    checkNotNull(endTime, "endTIme cannot be null");
    checkArgument(startTime.isBefore(endTime), "startTime must be before endTime");

    try (var entityManager = getEntityManager()) {
      var query = entityManager.createNamedQuery("origin.findByTime", OriginDao.class);
      query.setParameter("startTime", startTime.toEpochMilli() / MILLI_PER_SEC);
      query.setParameter("endTime", endTime.toEpochMilli() / MILLI_PER_SEC);
      LOGGER.debug(
          "OriginDaos found between startTime: {} EndTime: {}: {}",
          startTime.toEpochMilli() / MILLI_PER_SEC,
          endTime.toEpochMilli() / MILLI_PER_SEC,
          query.getResultList().size());
      return query.getResultList();
    }
  }
}
