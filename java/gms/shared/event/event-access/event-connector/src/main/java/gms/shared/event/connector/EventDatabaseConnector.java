package gms.shared.event.connector;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.EventDao;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link EventDao} from the database */
public class EventDatabaseConnector extends AbstractPooledConnector<EventDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(EventDatabaseConnector.class);
  private static final double MS_IN_SEC = 1000.0;

  public EventDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(EventDao.class, entityManagerFactory);
  }

  /**
   * Returns the EventDao from the database with the specified id
   *
   * @param eventId The id of the EventDao to query
   * @return Returns an Optional populated with the retrieved EventDao. If there was no unique
   *     EventDao found with the specified id, an empty Optional is returned.
   */
  public Optional<EventDao> findEventById(long eventId) {
    return queryForSingle((cb, from) -> cb.equal(from.get("eventId"), eventId));
  }

  /**
   * Returns EventDaos that occur in the time range provided. An EventDao lies within the time range
   * if the time of its preferredOrigin +/- its OrigerrDao's stime lies within the time range. Both
   * ends of the range are inclusive.
   *
   * @param startTime Beginning of the time range
   * @param endTime End of the time range
   * @return List of EventDaos
   */
  public List<EventDao> findEventsByTime(Instant startTime, Instant endTime) {
    checkNotNull(startTime);
    checkNotNull(endTime);

    try (var entityManager = getEntityManager()) {
      var query = entityManager.createNamedQuery("event.findByTime", EventDao.class);
      query.setParameter("startTime", startTime.toEpochMilli() / MS_IN_SEC);
      query.setParameter("endTime", endTime.toEpochMilli() / MS_IN_SEC);
      LOGGER.debug(
          "EventDaos found between startTime: {} EndTime: {}: Count: {}",
          startTime.toEpochMilli() / MS_IN_SEC,
          endTime.toEpochMilli() / MS_IN_SEC,
          query.getResultList().size());
      return query.getResultList();
    }
  }

  public List<Long> findEventIdsByArids(List<Long> arids) {
    checkNotNull(arids, "arids must not be null");
    checkArgument(!arids.isEmpty(), "arids must not be empty");

    try (var entityManager = getEntityManager()) {
      var query =
          entityManager.createQuery(
              "SELECT DISTINCT event.eventId "
                  + "FROM EventDao as event "
                  + "JOIN OriginDao as origin "
                  + "  WITH origin.eventId = event.eventId "
                  + "JOIN AssocDao as assoc "
                  + "  WITH assoc.id.originId = origin.originId "
                  + "WHERE assoc.id.arrivalId IN :arrivalIds",
              Long.class);
      query.setParameter("arrivalIds", arids);

      return query.getResultList();
    }
  }

  public boolean isPreferred(long orid) {
    try (var entityManager = getEntityManager()) {
      boolean isPreferred;
      var query =
          entityManager.createQuery(
              "SELECT event.preferredOrigin "
                  + "FROM EventDao as event "
                  + "JOIN OriginDao as origin "
                  + "  WITH origin.eventId = event.eventId "
                  + "WHERE origin.originId IN :orid",
              Long.class);
      query.setParameter("orid", orid);

      var resultList = query.getResultList();

      if (resultList.isEmpty()) {
        isPreferred = true;
        LOGGER.debug("There are not EventDaos with eventId in OriginDaos with orid: {}", orid);
      } else {
        isPreferred = resultList.get(0) == orid;
      }

      return isPreferred;
    }
  }
}
