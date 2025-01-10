package gms.shared.event.connector;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.OrigerrDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Executes {@link OrigerrDao} queries against the database */
public class OriginErrDatabaseConnector extends AbstractPooledConnector<OrigerrDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(OriginErrDatabaseConnector.class);

  public static final String ORIGIN_ID = "originId";

  public OriginErrDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(OrigerrDao.class, entityManagerFactory);
  }

  /**
   * Retrieves all {@link OrigerrDao}s that contain the particular origin IDs
   *
   * @param orids The Collection of Origin IDs to query for
   * @return all the {@link OrigerrDao}s that contain the particular origin IDs
   */
  public Set<OrigerrDao> findByIds(Collection<Long> orids) {
    checkNotNull(orids, "The collection of OriginIds cannot be null!");
    checkArgument(!orids.isEmpty(), "The collection of OriginIds cannot be empty!");

    return Set.copyOf(queryForAll((cb, from) -> from.get(ORIGIN_ID).in(orids)));
  }

  /**
   * Retrieves an {@link OrigerrDao} that contains the particular origin ID, if found
   *
   * @param orid The Origin IDs to query for
   * @return the {@link OrigerrDao} that contains the particular origin IDs, if found
   */
  public Optional<OrigerrDao> findById(long orid) {
    return queryForSingle((cb, from) -> cb.equal(from.get(ORIGIN_ID), orid));
  }
}
