package gms.shared.event.connector;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;

import com.google.common.collect.Lists;
import gms.shared.common.connector.AbstractPooledConnector;
import gms.shared.event.dao.GaTagDao;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.BiFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages querying {@link GaTagDao} from the database */
public class GaTagDatabaseConnector extends AbstractPooledConnector<GaTagDao> {

  private static final Logger LOGGER = LoggerFactory.getLogger(GaTagDatabaseConnector.class);
  private static final int PARTITION_SIZE = 300;

  public GaTagDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(GaTagDao.class, entityManagerFactory);
  }

  /**
   * Retrieves a list of {@link GaTagDao}s of provided object type, process state, and associated
   * with the provided evid
   *
   * @param objectType The desired object type of the returned {@link GaTagDao}s
   * @param processState The desired process state of the returned {@link GaTagDao}s
   * @param evid evid associated with the desired {@link GaTagDao}s
   * @return a list of {@link GaTagDao}s associated with the provided evid
   */
  public List<GaTagDao> findGaTagByObjectTypeProcessStateAndEvid(
      String objectType, String processState, long evid) {
    checkNotNull(objectType, "objectType must not be null");
    checkArgument(!objectType.isBlank(), "objectType must not be blank");
    checkNotNull(processState, "processState must not be null");
    checkArgument(!processState.isBlank(), "processState must not be blank");

    return queryForAll(
        (cb, from) ->
            cb.and(
                cb.equal(from.get("objectType"), objectType),
                cb.equal(from.get("processState"), processState),
                cb.equal(from.get("rejectedArrivalOriginEvid"), evid)));
  }

  /**
   * Retrieves a map of {@link GaTagDao}s of provided object types, process states, and associated
   * with the provided evids
   *
   * @param objectTypes The desired object type of the returned {@link GaTagDao}s
   * @param processStates The desired process state of the returned {@link GaTagDao}s
   * @param evids evids associated with the desired {@link GaTagDao}s
   * @return a map of {@link GaTagDao}s associated with the provided evids
   */
  public List<GaTagDao> findGaTagsByObjectTypesProcessStatesAndEvids(
      Collection<String> objectTypes, Collection<String> processStates, Collection<Long> evids) {
    checkNotNull(objectTypes, "objectTypes must not be null");
    checkArgument(!objectTypes.isEmpty(), "objectTypes must not be empty");
    checkArgument(objectTypes.stream().noneMatch(String::isBlank), "objectTypes must not be blank");
    checkNotNull(processStates, "processStates must not be null");
    checkArgument(!processStates.isEmpty(), "processStates must not be empty");
    checkArgument(
        processStates.stream().noneMatch(String::isBlank), "processStates must not be blank");

    return Lists.partition(new ArrayList<>(evids), PARTITION_SIZE).stream()
        .map(
            partitionedEvids ->
                queryForAll(inAnyCombination(objectTypes, processStates, partitionedEvids)))
        .flatMap(Collection::stream)
        .toList();
  }

  private BiFunction<CriteriaBuilder, Root<GaTagDao>, Predicate> inAnyCombination(
      Collection<String> objectTypes, Collection<String> processStates, Collection<Long> evids) {
    return (cb, from) ->
        cb.or(
            objectTypes.stream()
                .flatMap(
                    objectType ->
                        processStates.stream()
                            .flatMap(
                                processState ->
                                    evids.stream()
                                        .map(
                                            evid ->
                                                cb.and(
                                                    cb.equal(from.get("objectType"), objectType),
                                                    cb.equal(
                                                        from.get("processState"), processState),
                                                    cb.equal(
                                                        from.get("rejectedArrivalOriginEvid"),
                                                        evid)))))
                .toArray(Predicate[]::new));
  }
}
