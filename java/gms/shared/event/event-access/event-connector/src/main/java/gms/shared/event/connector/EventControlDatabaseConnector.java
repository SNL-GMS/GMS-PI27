package gms.shared.event.connector;

import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventIdOriginIdKey;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link EventControlDao} from the database */
public class EventControlDatabaseConnector extends AbstractPooledConnector<EventControlDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(EventControlDatabaseConnector.class);
  private static final String EVENT_ID_ORIGIN_ID_KEY = "eventIdOriginIdKey";

  public EventControlDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(EventControlDao.class, entityManagerFactory);
  }

  /**
   * Retrieves {@link EventControlDao} that match the provided evid and orid
   *
   * @param evid to query for
   * @param orid to query for
   * @return {@link Optional} {@link EventControlDao} if found
   */
  public Optional<EventControlDao> findByEventIdOriginId(long evid, long orid) {

    var inputKey = new EventIdOriginIdKey();
    inputKey.setEventId(evid);
    inputKey.setOriginId(orid);

    return queryForSingle((cb, from) -> cb.equal(from.get(EVENT_ID_ORIGIN_ID_KEY), inputKey));
  }
}
