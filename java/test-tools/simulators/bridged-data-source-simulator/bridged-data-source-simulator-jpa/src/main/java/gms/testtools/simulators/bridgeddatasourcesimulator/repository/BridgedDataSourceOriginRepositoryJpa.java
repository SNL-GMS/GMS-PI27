package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventDao;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.dao.StaMagDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.utilities.bridge.database.connector.EntityVoidFunction;
import jakarta.persistence.EntityManagerFactory;
import org.apache.commons.lang3.Validate;

public class BridgedDataSourceOriginRepositoryJpa extends BridgedDataSourceRepositoryJpa
    implements BridgedDataSourceRepository {

  private BridgedDataSourceOriginRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static BridgedDataSourceOriginRepositoryJpa create(
      EntityManagerFactory entityManagerFactory) {
    Validate.notNull(entityManagerFactory, "EntityManagerFactory cannot be null");
    return new BridgedDataSourceOriginRepositoryJpa(entityManagerFactory);
  }

  @Override
  public void cleanupData() {

    EntityVoidFunction delegateFunc =
        (entityManager) -> {
          entityManager.getTransaction().begin();

          cleanupTable(EventDao.class, entityManager);
          cleanupTable(WfTagDao.class, entityManager);
          cleanupTable(OrigerrDao.class, entityManager);
          cleanupTable(EventControlDao.class, entityManager);
          cleanupTable(AssocDao.class, entityManager);
          cleanupTable(ArInfoDao.class, entityManager);
          cleanupTable(NetMagDao.class, entityManager);
          cleanupTable(StaMagDao.class, entityManager);

          // Note, this must be deleted last!
          cleanupTable(OriginDao.class, entityManager);
          entityManager.getTransaction().commit();
        };

    var errMessage = this.getClass().getSimpleName() + ".cleanupData() error.";
    runWithEntityManagerVoidFunction(delegateFunc, errMessage);
  }
}
