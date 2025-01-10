package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.utilities.bridge.database.connector.EntitySingleResultFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class BeamDatabaseConnector extends DatabaseConnector {

  private static final String WF_ID = "wfId";

  static final String BEAM_WFID_ERROR = "Beam wfid exception";
  static final String BEAM_WFIDS_ERROR = "Beam wfids exception";

  static final String WFID_MESSAGE = "wfid = %s";
  static final String WFIDS_MESSAGE = "wfids size = %s";

  @Autowired
  public BeamDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public Optional<BeamDao> findBeamForWfid(long wfid) {
    EntitySingleResultFunction<BeamDao> delegateFunction =
        entityManager -> entityManager.find(BeamDao.class, wfid);

    return runWithEntityManagerSingleResultFunction(
        delegateFunction, BEAM_WFID_ERROR, String.format(WFID_MESSAGE, wfid));
  }

  /**
   * Uses the provided primary key representation for a {@link BeamDao} and uses it to search the
   * database for a match.
   *
   * @param wfids List of wfdisc ids to search for (also the pk in the Beam table)
   * @return a {@link List<BeamDao>} of all matching records. The list is empty if no match is
   *     found.
   */
  public List<BeamDao> findBeamsByWfid(List<Long> wfids) {

    return runPartitionedQuery(
        wfids,
        500,
        (Collection<Long> channelIdSublist) -> {
          EntityResultListFunction<BeamDao> delegateFunc =
              (EntityManager entityManager) -> {
                var cb = entityManager.getCriteriaBuilder();
                CriteriaQuery<BeamDao> query = cb.createQuery(BeamDao.class);
                Root<BeamDao> fromBeam = query.from(BeamDao.class);

                query.select(fromBeam).where(fromBeam.get(WF_ID).in(channelIdSublist));

                return entityManager.createQuery(query).getResultList();
              };

          return runWithEntityManagerResultListFunction(
              delegateFunc, BEAM_WFIDS_ERROR, String.format(WFIDS_MESSAGE, wfids.size()));
        });
  }
}
