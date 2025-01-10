package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.InstrumentDao;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class InstrumentDatabaseConnector extends DatabaseConnector {

  private static final String INSTRUMENT_ID = "instrumentId";

  private static final Logger LOGGER = LoggerFactory.getLogger(InstrumentDatabaseConnector.class);

  static final String INSTRUMENTS_ERROR = "Instruments by ids exception";

  @Autowired
  public InstrumentDatabaseConnector(
      @Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public List<InstrumentDao> findInstruments(Collection<Long> instrumentIds) {

    if (instrumentIds == null || instrumentIds.isEmpty()) {
      LOGGER.debug("Request for Sensor by name was given an empty list of instrument ids");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          instrumentIds,
          950,
          (Collection<Long> partition) -> {
            EntityResultListFunction<InstrumentDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<InstrumentDao> query = cb.createQuery(InstrumentDao.class);
                  Root<InstrumentDao> fromSensor = query.from(InstrumentDao.class);

                  query.select(fromSensor);

                  query.where(fromSensor.get(INSTRUMENT_ID).in(partition));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc,
                INSTRUMENTS_ERROR,
                String.format("instrument ids size = %s", instrumentIds.size()));
          });
    }
  }
}
