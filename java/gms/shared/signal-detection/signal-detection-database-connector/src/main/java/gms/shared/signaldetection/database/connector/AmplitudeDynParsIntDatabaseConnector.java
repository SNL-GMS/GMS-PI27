package gms.shared.signaldetection.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/** Database connector to pull back data from the AmplitudeDynParsInt table */
@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class AmplitudeDynParsIntDatabaseConnector extends DatabaseConnector {

  private static final String AMPLITUDE_DYN_PARS_INT_KEY = "amplitudeDynParsIntKey";
  private static final String AMPID = "ampid";
  private static final String PARAM_NAME = "paramName";
  private static final String FILTER_PARAM_NAME = "FILTERID";
  private static final String MEASURE_GROUP_NAME = "MEASURE";
  private static final String GROUP_NAME = "groupName";
  static final String AMPLITUDE_DYN_PARS_INT_ERROR = "AmplitudeDynParsInt by Ids exception";
  static final String AMPLITUDE_DYN_PARS_INT_SIZE_MESSAGE = "ampids size = %s";
  private static final Set<String> VALID_GROUP_NAMES =
      Set.of("DETECT", "FK", MEASURE_GROUP_NAME, "ONSET");
  private static final Set<String> VALID_PARAM_NAMES =
      Set.of(FILTER_PARAM_NAME, "FK", "LEAD", "LAG");
  private static final int PARTITION_SIZE = 950;

  private static final Logger LOGGER =
      LoggerFactory.getLogger(AmplitudeDynParsIntDatabaseConnector.class);

  public AmplitudeDynParsIntDatabaseConnector(
      @Qualifier("oracle") EntityManagerFactory entityManagerFactory) {

    super(entityManagerFactory);
  }

  /**
   * Queries and returns a list of AmplitudeDynParsIntDao based on the parameters provided.
   *
   * @param ampids The ampids to query for
   * @param groupNames the Group Names to query for, valid values are: `DETECT`, `FK`, `MEASURE`, or
   *     `ONSET`
   * @param paramNames The Param Names to query for, valid values are: `FILTERID`, `LEAD`, or `LAG`
   * @return
   */
  public List<AmplitudeDynParsIntDao> findAmplitudeDynParsIntsByIds(
      Collection<Long> ampids, Collection<String> groupNames, Collection<String> paramNames) {

    Preconditions.checkNotNull(ampids);
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

    if (ampids.isEmpty()) {
      LOGGER.debug(
          "Request for AmplitudeDynParsInt was given with empty list of ampids. Returning empty"
              + " results.");
      return new ArrayList<>();
    } else {
      var errorMessage = String.format(AMPLITUDE_DYN_PARS_INT_SIZE_MESSAGE, ampids.size());

      return runPartitionedQuery(
          ampids,
          PARTITION_SIZE,
          (Collection<Long> partitionedAmpids) ->
              runWithEntityManagerResultListFunction(
                  (EntityManager entityManager) ->
                      buildFindAmplitudeQuery(
                              entityManager, ampids, verifiedGroupNames, verifiedParamNames)
                          .getResultList(),
                  AMPLITUDE_DYN_PARS_INT_ERROR,
                  errorMessage));
    }
  }

  private static TypedQuery<AmplitudeDynParsIntDao> buildFindAmplitudeQuery(
      EntityManager entityManager,
      Collection<Long> ampids,
      Set<String> groupNames,
      Set<String> paramNames) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<AmplitudeDynParsIntDao> query = cb.createQuery(AmplitudeDynParsIntDao.class);
    Root<AmplitudeDynParsIntDao> fromAmplitudeDynParsInt = query.from(AmplitudeDynParsIntDao.class);
    query.select(fromAmplitudeDynParsInt);
    query.where(
        cb.and(
            fromAmplitudeDynParsInt.get(AMPLITUDE_DYN_PARS_INT_KEY).get(AMPID).in(ampids),
            fromAmplitudeDynParsInt.get(AMPLITUDE_DYN_PARS_INT_KEY).get(GROUP_NAME).in(groupNames),
            fromAmplitudeDynParsInt
                .get(AMPLITUDE_DYN_PARS_INT_KEY)
                .get(PARAM_NAME)
                .in(paramNames)));
    return entityManager.createQuery(query);
  }

  /**
   * Queries and returns a list of {@link AmplitudeDynParsIntDao}s based on the ampids provided,
   * constraining results to records associated with filter IDs
   *
   * @param ampids The ampids to query for
   * @return All {@link AmplitudeDynParsIntDao}s associated with filter IDs that match the provided
   *     ampids
   */
  public List<AmplitudeDynParsIntDao> findFilterAdpisByIds(Collection<Long> ampids) {
    Preconditions.checkNotNull(ampids);

    if (ampids.isEmpty()) {
      LOGGER.debug(
          "Request for AmplitudeDynParsInt was given with empty list of ampids. Returning empty"
              + " results.");
      return new ArrayList<>();
    } else {
      var errorMessage = String.format(AMPLITUDE_DYN_PARS_INT_SIZE_MESSAGE, ampids.size());

      return runPartitionedQuery(
          ampids,
          PARTITION_SIZE,
          (Collection<Long> partitionedAmpids) ->
              runWithEntityManagerResultListFunction(
                  (EntityManager entityManager) ->
                      buildFindFilterQuery(entityManager, ampids).getResultList(),
                  AMPLITUDE_DYN_PARS_INT_ERROR,
                  errorMessage));
    }
  }

  private static TypedQuery<AmplitudeDynParsIntDao> buildFindFilterQuery(
      EntityManager entityManager, Collection<Long> ampids) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<AmplitudeDynParsIntDao> query = cb.createQuery(AmplitudeDynParsIntDao.class);
    Root<AmplitudeDynParsIntDao> fromAmplitudeDynParsInt = query.from(AmplitudeDynParsIntDao.class);
    query.select(fromAmplitudeDynParsInt);
    query.where(
        cb.and(
            fromAmplitudeDynParsInt.get(AMPLITUDE_DYN_PARS_INT_KEY).get(AMPID).in(ampids),
            cb.equal(
                fromAmplitudeDynParsInt.get(AMPLITUDE_DYN_PARS_INT_KEY).get(GROUP_NAME),
                MEASURE_GROUP_NAME),
            cb.equal(
                fromAmplitudeDynParsInt.get(AMPLITUDE_DYN_PARS_INT_KEY).get(PARAM_NAME),
                FILTER_PARAM_NAME)));
    return entityManager.createQuery(query);
  }
}
