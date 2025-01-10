package gms.shared.event.connector;

import com.google.common.collect.Lists;
import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.signaldetection.dao.css.AssocDao;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;

/** Manages querying {@link AssocDao} from the database */
public class AssocDatabaseConnector extends AbstractPooledConnector<AssocDao> {

  private static final String ARRIVAL_ID = "arrivalId";
  private static final String ORIGIN_ID = "originId";
  private static final String ID = "id";
  private static final int PARTITION_SIZE = 1000;

  public AssocDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(AssocDao.class, entityManagerFactory);
  }

  /**
   * Retrieves a list of AssocDaos that match the passed in list of ARIDs
   *
   * @param arids the ARIDs to find
   * @return a list of AssocDaos matching the ARIDs passed in
   */
  public List<AssocDao> findAssocsByArids(Collection<Long> arids) {
    Objects.requireNonNull(arids, "Arids cannot be null");

    if (arids.isEmpty()) {
      return List.of();
    } else {
      return Lists.partition(new ArrayList<>(arids), PARTITION_SIZE).stream()
          .map(
              partitionedArids ->
                  queryForAll((cb, from) -> from.get(ID).get(ARRIVAL_ID).in(partitionedArids)))
          .flatMap(Collection::stream)
          .toList();
    }
  }

  /**
   * Retrieves a list of AssocDaos that match the passed in list of ORIDs
   *
   * @param orids the ORIDs to find
   * @return a list of AssocDaos matching the ORIDs passed in
   */
  public List<AssocDao> findAssocsByOrids(Collection<Long> orids) {
    Validate.notNull(orids, "OriginIds cannot be null!");

    if (orids.isEmpty()) {
      return List.of();
    } else {
      return Lists.partition(new ArrayList<>(orids), PARTITION_SIZE).stream()
          .map(
              partitionedOrids ->
                  queryForAll((cb, from) -> from.get(ID).get(ORIGIN_ID).in(partitionedOrids)))
          .flatMap(Collection::stream)
          .toList();
    }
  }

  /**
   * Retrieves a list of AssocDaos that match the passed in list of pairs of arids and orids
   *
   * @param aridOridList the list of pairs of arids and orids
   * @return a list of AssocDaos matching the arids and orids passed in
   */
  public List<AssocDao> findAssocsByAridsAndOrids(Collection<Pair<Long, Long>> aridOridList) {
    Validate.notNull(aridOridList, "Arids and Orids cannot be null!");

    if (aridOridList.isEmpty()) {
      return List.of();
    } else {
      return Lists.partition(new ArrayList<>(aridOridList), PARTITION_SIZE).stream()
          .map(
              partitionedAridsOrids ->
                  queryForAll(
                      (cb, from) ->
                          cb.or(
                              partitionedAridsOrids.stream()
                                  .map(
                                      aridOridPair ->
                                          cb.and(
                                              cb.equal(
                                                  from.get(ID).get(ARRIVAL_ID),
                                                  aridOridPair.getLeft()),
                                              cb.equal(
                                                  from.get(ID).get(ORIGIN_ID),
                                                  aridOridPair.getRight())))
                                  .toArray(Predicate[]::new))))
          .flatMap(Collection::stream)
          .toList();
    }
  }
}
