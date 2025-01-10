package gms.shared.signaldetection.repository;

import static org.mockito.ArgumentMatchers.any;

import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntKey;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FilterIdUtilityTest {

  @Mock ArrivalDynParsIntDatabaseConnector arrivalDynParsIntDatabaseConnector;

  @Mock AmplitudeDynParsIntDatabaseConnector amplitudeDynParsIntDatabaseConnector;

  @Test
  void testAridFk() {

    var mockDao1 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key1 = new ArrivalDynParsIntKey();

    key1.setArid(0);
    key1.setGroupName("FK");

    var mockDao2 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key2 = new ArrivalDynParsIntKey();

    key2.setArid(1);
    key2.setGroupName("FK");

    var mockDao3 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key3 = new ArrivalDynParsIntKey();

    key3.setArid(0);
    key3.setGroupName("DETECT");

    var mockDao4 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key4 = new ArrivalDynParsIntKey();

    key4.setArid(1);
    key4.setGroupName("ONSET");

    Mockito.when(mockDao1.getArrivalDynParsIntKey()).thenReturn(key1);
    Mockito.when(mockDao1.getLdDate()).thenReturn(Instant.MAX);
    Mockito.when(mockDao2.getArrivalDynParsIntKey()).thenReturn(key2);
    Mockito.when(mockDao2.getLdDate()).thenReturn(Instant.MIN);
    Mockito.when(mockDao3.getArrivalDynParsIntKey()).thenReturn(key3);
    Mockito.when(mockDao4.getArrivalDynParsIntKey()).thenReturn(key4);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(List.of(mockDao3, mockDao1, mockDao2, mockDao4));
    Mockito.when(mockDao1.getIvalue()).thenReturn(100L);

    var optionalId = FilterIdUtility.getFilterIdForArid(arrivalDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isPresent());

    Assertions.assertEquals(100L, optionalId.get().longValue());
  }

  @Test
  void testAridOnset() {

    var mockDao1 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key1 = new ArrivalDynParsIntKey();

    key1.setArid(0);
    key1.setGroupName("ONSET");

    var mockDao2 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key2 = new ArrivalDynParsIntKey();

    key2.setArid(1);
    key2.setGroupName("ONSET");

    var mockDao3 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key3 = new ArrivalDynParsIntKey();

    key3.setArid(0);
    key3.setGroupName("DETECT");

    var mockDao4 = Mockito.mock(ArrivalDynParsIntDao.class);
    var key4 = new ArrivalDynParsIntKey();

    key4.setArid(1);
    key4.setGroupName("ONSET");

    Mockito.when(mockDao1.getArrivalDynParsIntKey()).thenReturn(key1);
    Mockito.when(mockDao1.getLdDate()).thenReturn(Instant.MAX);
    Mockito.when(mockDao1.getIvalue()).thenReturn(100L);
    Mockito.when(mockDao2.getArrivalDynParsIntKey()).thenReturn(key2);
    Mockito.when(mockDao2.getLdDate()).thenReturn(Instant.MIN);
    Mockito.when(mockDao3.getArrivalDynParsIntKey()).thenReturn(key3);
    Mockito.when(mockDao4.getArrivalDynParsIntKey()).thenReturn(key4);
    Mockito.when(mockDao4.getLdDate()).thenReturn(Instant.EPOCH);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(List.of(mockDao3, mockDao1, mockDao2, mockDao4));

    var optionalId = FilterIdUtility.getFilterIdForArid(arrivalDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isPresent());

    Assertions.assertEquals(100L, optionalId.get().longValue());
  }

  @Test
  void testAridOnlyMeasureReturnsEmpty() {
    var mockMeasureDao = Mockito.mock(ArrivalDynParsIntDao.class);
    var key = new ArrivalDynParsIntKey();

    key.setArid(0);
    key.setGroupName("AMPLITUDE");

    Mockito.when(mockMeasureDao.getArrivalDynParsIntKey()).thenReturn(key);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(List.of(mockMeasureDao));

    var optionalId = FilterIdUtility.getFilterIdForArid(arrivalDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isEmpty());
  }

  @Test
  void testAridNoRetrievedRecordsReturnsEmpty() {

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(Collections.emptyList());

    var optionalId = FilterIdUtility.getFilterIdForArid(arrivalDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isEmpty());
  }

  @Test
  void testAmpid() {

    var mockDao1 = Mockito.mock(AmplitudeDynParsIntDao.class);
    var mockDao2 = Mockito.mock(AmplitudeDynParsIntDao.class);

    Mockito.when(mockDao1.getLdDate()).thenReturn(Instant.MAX);
    Mockito.when(mockDao2.getLdDate()).thenReturn(Instant.MIN);

    Mockito.when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(List.of(mockDao1, mockDao2));
    Mockito.when(mockDao1.getIvalue()).thenReturn(100L);

    var optionalId = FilterIdUtility.getFilterIdForAmpid(amplitudeDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isPresent());

    Assertions.assertEquals(100L, optionalId.get().longValue());
  }

  @Test
  void testAmpidNoRetrievedRecordsReturnsEmpty() {

    Mockito.when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(Collections.emptyList());

    var optionalId = FilterIdUtility.getFilterIdForAmpid(amplitudeDynParsIntDatabaseConnector, 0);

    Assertions.assertTrue(optionalId.isEmpty());
  }
}
