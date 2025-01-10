package gms.shared.signaldetection.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/** Database connector to pull back data from the ArrivalDynParsInt table */
@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class ArrivalDynParsIntDatabaseConnector extends DatabaseConnector {

  private static final String ARRIVAL_DYN_PARS_INT_KEY = "arrivalDynParsIntKey";
  private static final String ARID = "arid";
  private static final String PARAM_NAME = "paramName";
  private static final String FILTER_PARAM_NAME = "FILTERID";
  private static final String GROUP_NAME = "groupName";
  static final String ARRIVAL_DYN_PARS_INT_ERROR = "ArrivalDynParsInt by Ids exception";
  static final String ARRIVAL_DYN_PARS_INT_SIZE_MESSAGE = "arids size = %s";
  private static final Set<String> VALID_GROUP_NAMES = Set.of("DETECT", "FK", "MEASURE", "ONSET");
  private static final Set<String> VALID_PARAM_NAMES =
      Set.of(FILTER_PARAM_NAME, "FK", "LEAD", "LAG");

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ArrivalDynParsIntDatabaseConnector.class);

  @Autowired
  public ArrivalDynParsIntDatabaseConnector(EntityManagerFactory entityManagerFactory) {

    super(entityManagerFactory);
  }

  /**
   * Queries and returns a list of ArrivalDynParsIntDao based on the parameters provided.
   *
   * @param arids The arids to query for
   * @param groupNames the Group Names to query for, valid values are: `DETECT`, `FK`, `MEASURE`, or
   *     `ONSET`
   * @param paramNames The Param Names to query for, valid values are: `FILTERID`, `LEAD`, or `LAG`
   * @return
   */
  public List<ArrivalDynParsIntDao> findArrivalDynParsIntsByIds(
      Collection<Long> arids, Collection<String> groupNames, Collection<String> paramNames) {
    Preconditions.checkNotNull(arids);
    Preconditions.checkNotNull(groupNames);
    Preconditions.checkNotNull(paramNames);

    var invalidGroupNames =
        groupNames.stream()
            .filter(name -> !VALID_GROUP_NAMES.contains(name))
            .collect(Collectors.toSet());
    var invalidParamNames =
        paramNames.stream()
            .filter(name -> !VALID_PARAM_NAMES.contains(name))
            .collect(Collectors.toSet());
    if (!invalidGroupNames.isEmpty()) {
      LOGGER.debug(
          "Invalid group names {}, valid values are: {}. Will be filtered from results.",
          invalidGroupNames,
          VALID_GROUP_NAMES);
    }
    if (!invalidParamNames.isEmpty()) {
      LOGGER.debug(
          "Invalid param names {}, valid values are: {}. Will be filtered from results.",
          invalidParamNames,
          VALID_PARAM_NAMES);
    }
    var verifiedGroupNames =
        groupNames.stream().filter(VALID_GROUP_NAMES::contains).collect(Collectors.toSet());
    var verifiedParamNames =
        paramNames.stream().filter(VALID_PARAM_NAMES::contains).collect(Collectors.toSet());

    if (arids.isEmpty()) {
      LOGGER.debug(
          "Request for ArrivalDynParsInt was given with empty list of arids. Returning empty"
              + " results.");
      return new ArrayList<>();
    } else {
      var errorMessage = String.format(ARRIVAL_DYN_PARS_INT_SIZE_MESSAGE, arids.size());
      return runPartitionedQuery(
          arids,
          950,
          (Collection<Long> partitionedArids) -> {
            EntityResultListFunction<ArrivalDynParsIntDao> delegateFunction =
                (EntityManager entityManager) ->
                    buildDelegateFunction(
                        entityManager, partitionedArids, verifiedGroupNames, verifiedParamNames);

            return runWithEntityManagerResultListFunction(
                delegateFunction, ARRIVAL_DYN_PARS_INT_ERROR, errorMessage);
          });
    }
  }

  private static List<ArrivalDynParsIntDao> buildDelegateFunction(
      EntityManager entityManager,
      Collection<Long> partitionedArids,
      Set<String> verifiedGroupNames,
      Set<String> verifiedParamNames) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<ArrivalDynParsIntDao> query = cb.createQuery(ArrivalDynParsIntDao.class);
    Root<ArrivalDynParsIntDao> fromArrivalDynParsInt = query.from(ArrivalDynParsIntDao.class);
    query.select(fromArrivalDynParsInt);
    query.where(
        cb.and(
            fromArrivalDynParsInt.get(ARRIVAL_DYN_PARS_INT_KEY).get(ARID).in(partitionedArids),
            fromArrivalDynParsInt
                .get(ARRIVAL_DYN_PARS_INT_KEY)
                .get(GROUP_NAME)
                .in(verifiedGroupNames),
            fromArrivalDynParsInt
                .get(ARRIVAL_DYN_PARS_INT_KEY)
                .get(PARAM_NAME)
                .in(verifiedParamNames)));
    return entityManager.createQuery(query).getResultList();
  }

  /**
   * Queries and returns a list of {@link ArrivalDynParsIntDao}s based on the arids provided,
   * constraining results to records associated with filter IDs
   *
   * @param arids The arids to query for
   * @return All {@link ArrivalDynParsIntDao}s associated with filter IDs that match the provided
   *     arids
   */
  public List<ArrivalDynParsIntDao> findFilterAdpisByIds(Collection<Long> arids) {
    Preconditions.checkNotNull(arids);

    if (arids.isEmpty()) {
      LOGGER.debug(
          "Request for ArrivalDynParsInt was given with empty list of arids. Returning empty"
              + " results.");
      return new ArrayList<>();
    } else {
      var filterGroupNames = Set.of("DETECT", "FK", "ONSET");
      var errorMessage = String.format(ARRIVAL_DYN_PARS_INT_SIZE_MESSAGE, arids.size());

      return runPartitionedQuery(
          arids,
          950,
          (Collection<Long> partitionedArids) -> {
            EntityResultListFunction<ArrivalDynParsIntDao> delegateFunction =
                (EntityManager entityManager) ->
                    buildFilterDelegateFunction(entityManager, partitionedArids, filterGroupNames);

            return runWithEntityManagerResultListFunction(
                delegateFunction, ARRIVAL_DYN_PARS_INT_ERROR, errorMessage);
          });
    }
  }

  private static List<ArrivalDynParsIntDao> buildFilterDelegateFunction(
      EntityManager entityManager,
      Collection<Long> partitionedArids,
      Set<String> filterGroupNames) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<ArrivalDynParsIntDao> query = cb.createQuery(ArrivalDynParsIntDao.class);
    Root<ArrivalDynParsIntDao> fromArrivalDynParsInt = query.from(ArrivalDynParsIntDao.class);
    query.select(fromArrivalDynParsInt);
    query.where(
        cb.and(
            fromArrivalDynParsInt.get(ARRIVAL_DYN_PARS_INT_KEY).get(ARID).in(partitionedArids),
            fromArrivalDynParsInt
                .get(ARRIVAL_DYN_PARS_INT_KEY)
                .get(GROUP_NAME)
                .in(filterGroupNames),
            cb.equal(
                fromArrivalDynParsInt.get(ARRIVAL_DYN_PARS_INT_KEY).get(PARAM_NAME),
                FILTER_PARAM_NAME)));
    return entityManager.createQuery(query).getResultList();
  }
}
