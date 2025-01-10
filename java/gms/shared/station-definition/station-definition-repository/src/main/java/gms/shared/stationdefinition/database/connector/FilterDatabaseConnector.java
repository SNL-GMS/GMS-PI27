package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.FilterDao;
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

/** Database connector for pulling back data from the Filter table */
@Component
public class FilterDatabaseConnector extends DatabaseConnector {

  private static final String FILTER_ID = "filterId";
  static final String FILDER_ID_ERROR = "Filter by Ids exception";
  static final String FILTER_ID_SIZE_MESSAGE = "filterIds size = %s";

  private static final Logger LOGGER = LoggerFactory.getLogger(FilterDatabaseConnector.class);

  public FilterDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {

    super(entityManagerFactory);
  }

  /**
   * Queries and returns a list of FilterDaos based on the provided filterIds
   *
   * @param filterIds The filter Ids to query for
   * @return The FilterDaos that were found
   */
  public List<FilterDao> findFiltersByIds(Collection<Long> filterIds) {

    if (filterIds == null || filterIds.isEmpty()) {
      LOGGER.debug("Request for Filter was given with empty/null list of filterIds ids");
      return new ArrayList<>();
    } else {

      var errorMessage = String.format(FILTER_ID_SIZE_MESSAGE, filterIds.size());
      return runPartitionedQuery(
          filterIds,
          950,
          (Collection<Long> partitionedFilterids) -> {
            EntityResultListFunction<FilterDao> delegateFunction =
                (EntityManager entityManager) -> {
                  var cb = entityManager.getCriteriaBuilder();
                  CriteriaQuery<FilterDao> query = cb.createQuery(FilterDao.class);
                  Root<FilterDao> fromFilter = query.from(FilterDao.class);
                  query.select(fromFilter);
                  query.where(fromFilter.get(FILTER_ID).in(partitionedFilterids));
                  return entityManager.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, FILDER_ID_ERROR, errorMessage);
          });
    }
  }
}
