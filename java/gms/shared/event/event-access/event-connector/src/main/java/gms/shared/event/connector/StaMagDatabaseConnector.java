package gms.shared.event.connector;

import com.google.common.collect.Lists;
import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.StaMagDao;
import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link StaMagDao}s from the database */
public class StaMagDatabaseConnector extends AbstractPooledConnector<StaMagDao> {

  private static final String ARRIVAL_ID = "arrivalId";
  private static final String ORIGIN_ID = "originId";
  private static final Logger LOGGER = LoggerFactory.getLogger(StaMagDatabaseConnector.class);
  private static final int PARTITION_SIZE = 500;

  public StaMagDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(StaMagDao.class, entityManagerFactory);
  }

  /**
   * Returns a list of {@link StaMagDao}s
   *
   * @param orid An orid to query for StagMags with
   * @return A list of {@link StaMagDao}s
   */
  public List<StaMagDao> findStaMagByOrid(long orid) {
    return queryForAll((cb, from) -> cb.equal(from.get(ORIGIN_ID), orid));
  }

  /**
   * Returns a list of {@link StaMagDao}s corresponding to the provided orid and arid
   *
   * @param orid An orid to query for StagMags with
   * @param arid An arid to query for StagMags with
   * @return A list of {@link StaMagDao}s
   */
  public List<StaMagDao> findStaMagByOridAndArid(long orid, long arid) {
    return queryForAll(
        (cb, from) ->
            cb.and(cb.equal(from.get(ORIGIN_ID), orid), cb.equal(from.get(ARRIVAL_ID), arid)));
  }

  /**
   * Returns a list of {@link StaMagDao}s corresponding to the provided list of {@link AssocDao}s
   *
   * @param assocs A list of {@link AssocDao} objects to retreive {@link StaMagDao}s for
   * @return A list of {@link StaMagDao}s relevant to the provided {@link AssocDao}s
   */
  public List<StaMagDao> findStaMagDaosByAssocs(Collection<AssocDao> assocs) {
    var assocDaoKeys =
        assocs.stream().map(AssocDao::assocDaoToAridOridKeyTransformer).collect(Collectors.toSet());

    return Lists.partition(new ArrayList<>(assocDaoKeys), PARTITION_SIZE).stream()
        .map(
            partitionedAssocDaoKeys ->
                queryForAll(
                    (cb, from) ->
                        cb.or(
                            partitionedAssocDaoKeys.stream()
                                .map(
                                    assocDaoKey ->
                                        cb.and(
                                            cb.equal(
                                                from.get(ARRIVAL_ID), assocDaoKey.getArrivalId()),
                                            cb.equal(
                                                from.get(ORIGIN_ID), assocDaoKey.getOriginId())))
                                .toArray(Predicate[]::new))))
        .flatMap(Collection::stream)
        .collect(Collectors.toList());
  }

  /**
   * Maps a {@link StaMagDao} to an {@link AridOridKey}. Useful for backreferencing a StaMagDao to
   * an {@link AssocDao}
   *
   * @param staMagDao the {@link StaMagDao} to map
   * @return the relevant {@link AridOridKey}
   */
  public static AridOridKey staMagDaoKeyTransformer(StaMagDao staMagDao) {
    var key = new AridOridKey();
    key.setOriginId(staMagDao.getOriginId());
    key.setArrivalId(staMagDao.getArrivalId());
    return key;
  }
}
