package gms.shared.event.connector;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import org.junit.jupiter.api.Test;

class ArInfoDatabaseConnectorTest extends DatabaseConnectorTest<ArInfoDatabaseConnector> {

  @Override
  protected ArInfoDatabaseConnector getDatabaseConnector(
      EntityManagerFactory entityManagerFactory) {
    return new ArInfoDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindArInfoByOridIdAndAridId() {

    var queriedArInfo = databaseConnector.findArInfoByOridAndArid(11111L, 22222L);
    assertTrue(queriedArInfo.isPresent());

    queriedArInfo = databaseConnector.findArInfoByOridAndArid(23423L, 2342);
    assertTrue(queriedArInfo.isEmpty());
  }

  @Test
  void testFindArInfosByAssocs() {
    var assocDao1 = mock(AssocDao.class);
    var assocDao1Key = new AridOridKey();
    assocDao1Key.setOriginId(11111);
    assocDao1Key.setArrivalId(22222);
    when(assocDao1.getId()).thenReturn(assocDao1Key);

    var assocDao2 = mock(AssocDao.class);
    var assocDao2Key = new AridOridKey();
    assocDao2Key.setOriginId(11111);
    assocDao2Key.setArrivalId(33333);
    when(assocDao2.getId()).thenReturn(assocDao2Key);

    // this is not in the database!
    var assocDao3 = mock(AssocDao.class);
    var assocDao3Key = new AridOridKey();
    assocDao3Key.setOriginId(76575675);
    assocDao3Key.setArrivalId(4329);
    when(assocDao3.getId()).thenReturn(assocDao3Key);

    var queriedArInfo =
        databaseConnector.findArInfosByAssocs(List.of(assocDao1, assocDao2, assocDao3, assocDao1));
    assertEquals(2, queriedArInfo.entrySet().size());
  }
}
