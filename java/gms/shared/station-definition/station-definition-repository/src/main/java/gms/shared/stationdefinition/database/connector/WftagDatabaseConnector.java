package gms.shared.stationdefinition.database.connector;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static java.lang.String.format;

import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class WftagDatabaseConnector extends DatabaseConnector {

  private static final String WFTAG_KEY = "wfTagKey";
  private static final String ID = "id";
  private static final String TAG_NAME = "tagName";

  @Autowired
  public WftagDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Find all {@link WfTagDao}s for the given arIds
   *
   * @param arIds Collection of arIds
   * @return list of {@link WfTagDao}s
   */
  public List<WfTagDao> findWfTagsByArIds(Collection<Long> arIds) {
    checkNotNull(arIds);
    checkArgument(!arIds.isEmpty(), "findWfTagsbyArIds requires at least one arId");

    return runPartitionedQuery(
        arIds,
        250,
        (Collection<Long> partitionedArIds) -> {
          EntityResultListFunction<WfTagDao> delegateFunc =
              (EntityManager em) -> {
                var cb = em.getCriteriaBuilder();
                CriteriaQuery<WfTagDao> query = cb.createQuery(WfTagDao.class);
                Root<WfTagDao> fromWftag = query.from(WfTagDao.class);

                final Path<Object> idPath = fromWftag.get(WFTAG_KEY);
                query.select(fromWftag);
                query.where(
                    cb.and(
                        cb.equal(idPath.get(TAG_NAME), TagName.ARID),
                        cb.or(
                            partitionedArIds.stream()
                                .map(arId -> cb.equal(idPath.get(ID), arId))
                                .toArray(Predicate[]::new))));

                return em.createQuery(query).getResultList();
              };

          return runWithEntityManagerResultListFunction(
              delegateFunc, "findWfTagsbyArIds", format("arIds: %s", arIds.toString()));
        });
  }

  /**
   * Find all {@link WfTagDao}s for the given evIds
   *
   * @param evIds Collection of evIds
   * @return list of {@link WfTagDao}s
   */
  public List<WfTagDao> findWfTagsByEvIds(Collection<Long> evIds) {
    checkNotNull(evIds);
    checkArgument(!evIds.isEmpty(), "findWfTagsbyEvIds requires at least one evId");

    return runPartitionedQuery(
        evIds,
        250,
        (Collection<Long> partitionedEvIds) -> {
          EntityResultListFunction<WfTagDao> delegateFunc =
              (EntityManager em) -> {
                var cb = em.getCriteriaBuilder();
                CriteriaQuery<WfTagDao> query = cb.createQuery(WfTagDao.class);
                Root<WfTagDao> fromWftag = query.from(WfTagDao.class);

                final Path<Object> idPath = fromWftag.get(WFTAG_KEY);
                query.select(fromWftag);
                query.where(
                    cb.and(
                        cb.equal(idPath.get(TAG_NAME), TagName.EVID),
                        cb.or(
                            partitionedEvIds.stream()
                                .map(evId -> cb.equal(idPath.get(ID), evId))
                                .toArray(Predicate[]::new))));

                return em.createQuery(query).getResultList();
              };

          return runWithEntityManagerResultListFunction(
              delegateFunc, "findWfTagsbyEvIds", format("evIds: %s", evIds.toString()));
        });
  }
}
