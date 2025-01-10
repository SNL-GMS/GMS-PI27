package gms.shared.event.connector;

import com.google.common.collect.Lists;
import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.dao.OriginIdArrivalIdKey;
import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link gms.shared.event.dao.ArInfoDao} from the database */
public class ArInfoDatabaseConnector extends AbstractPooledConnector<ArInfoDao> {

  private static final String ORIGIN_ID_ARRIVAL_ID_KEY = "originIdArrivalIdKey";
  private static final Logger LOGGER = LoggerFactory.getLogger(ArInfoDatabaseConnector.class);
  private static final int PARTITION_SIZE = 500;

  public ArInfoDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(ArInfoDao.class, entityManagerFactory);
  }

  /**
   * Returns an {@link ArInfoDao} from the database
   *
   * @param orid the oridId of the query
   * @param arid the artidId of the query
   * @return a populated {@link ArInfoDao} if found, otherwise an empty Optional
   */
  public Optional<ArInfoDao> findArInfoByOridAndArid(long orid, long arid) {
    var inputKey = new OriginIdArrivalIdKey();
    inputKey.setOriginId(orid);
    inputKey.setArrivalId(arid);

    return queryForSingle((cb, from) -> cb.equal(from.get(ORIGIN_ID_ARRIVAL_ID_KEY), inputKey));
  }

  /**
   * Returns a {@link Map} with {@link AridOridKey} keys and {@link ArInfoDao} values from the
   * database
   *
   * @param assocs A list of {@link AssocDao} objects to retrieve {@link ArInfoDao}s for
   * @return a populated Map of {@link ArInfoDao}s
   */
  public Map<AridOridKey, ArInfoDao> findArInfosByAssocs(Collection<AssocDao> assocs) {

    var assocDaoKeys =
        assocs.stream()
            .map(ArInfoDatabaseConnector::assocDaoKeyTransformer)
            .collect(Collectors.toSet());

    return Lists.partition(new ArrayList<>(assocDaoKeys), PARTITION_SIZE).stream()
        .map(
            partitionedAssocDaoKeys ->
                queryForAll(
                    (cb, from) -> from.get(ORIGIN_ID_ARRIVAL_ID_KEY).in(partitionedAssocDaoKeys)))
        .flatMap(Collection::stream)
        .collect(
            Collectors.toMap(
                ArInfoDatabaseConnector::arInfoDaoKeyTransformer, Function.identity()));
  }

  /**
   * Maps a {@link AssocDao} to an {@link OriginIdArrivalIdKey}.
   *
   * @param assocDao the {@link AssocDao} to map
   * @return the relevant {@link OriginIdArrivalIdKey}
   */
  private static OriginIdArrivalIdKey assocDaoKeyTransformer(AssocDao assocDao) {
    var key = new OriginIdArrivalIdKey();
    key.setOriginId(assocDao.getId().getOriginId());
    key.setArrivalId(assocDao.getId().getArrivalId());
    return key;
  }

  /**
   * Maps an {@link ArInfoDao} to an {@link AridOridKey}. Useful for back-referencing a ArInfoDao to
   * an {@link AssocDao}
   *
   * @param arInfoDao the {@link ArInfoDao} to map
   * @return the relevant {@link AridOridKey}
   */
  private static AridOridKey arInfoDaoKeyTransformer(ArInfoDao arInfoDao) {
    var key = new AridOridKey();
    key.setOriginId(arInfoDao.getOriginId());
    key.setArrivalId(arInfoDao.getArrivalId());
    return key;
  }
}
