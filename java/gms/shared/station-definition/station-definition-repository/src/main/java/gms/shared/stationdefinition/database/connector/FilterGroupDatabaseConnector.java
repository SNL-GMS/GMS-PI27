package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.FilterGroupDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/** Database connector to pull data back from the FilterGroup table */
@Component
public class FilterGroupDatabaseConnector extends DatabaseConnector {

  private static final String FILTER_GROUP_KEY = "filterGroupKey";
  private static final String PARENT_FILTER_ID = "parentFilterId";
  static final String FILTER_GROUP_ID_ERROR = "Filter Group by Ids exception";
  static final String PARENT_FILTER_ID_SIZE_MESSAGE = "filterIds size = %s";

  private static final Logger LOGGER = LoggerFactory.getLogger(FilterGroupDatabaseConnector.class);

  public FilterGroupDatabaseConnector(
      @Qualifier("oracle") EntityManagerFactory entityManagerFactory) {

    super(entityManagerFactory);
  }

  /**
   * Finds and returns all FilterGroupDaos based on the passed in Parent FIlter Ids
   *
   * @param parentFilterIds The parent Ids to query for
   * @return The list of FilterGroupDaos
   */
  public List<FilterGroupDao> findFilterGroupsByIds(Collection<Long> parentFilterIds) {

    if (parentFilterIds == null || parentFilterIds.isEmpty()) {
      LOGGER.debug(
          "Request for Filter Group was given with empty/null list of parent filterIds ids");
      return new ArrayList<>();
    } else {

      var errorMessage = String.format(PARENT_FILTER_ID_SIZE_MESSAGE, parentFilterIds.size());
      return runPartitionedQuery(
          parentFilterIds,
          950,
          (Collection<Long> partitionedParentFilterIds) -> {
            EntityResultListFunction<FilterGroupDao> delegateFunction =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<FilterGroupDao> query = cb.createQuery(FilterGroupDao.class);
                  Root<FilterGroupDao> fromFilterGroup = query.from(FilterGroupDao.class);
                  query
                      .select(fromFilterGroup)
                      .where(
                          fromFilterGroup
                              .get(FILTER_GROUP_KEY)
                              .get(PARENT_FILTER_ID)
                              .in(partitionedParentFilterIds));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, FILTER_GROUP_ID_ERROR, errorMessage);
          });
    }
  }
}
