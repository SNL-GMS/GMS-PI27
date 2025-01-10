package gms.shared.waveform.qc.mask.connector;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import org.junit.jupiter.api.Test;

class QcMaskSegDatabaseConnectorTest extends QcMaskDbTest<QcMaskSegDatabaseConnector> {

  @Override
  protected QcMaskSegDatabaseConnector getRepository(EntityManagerFactory entityManagerFactory) {
    return new QcMaskSegDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testMissingQcMaskIdError() {
    assertErrorThrown(
        NullPointerException.class,
        QcMaskSegDatabaseConnector.EMPTY_QC_MASK_ID,
        () -> repository.findQcMaskSegDaos(null));
  }

  @Test
  void testEmptyQcMaskIds() {
    List<QcMaskSegDao> qcMaskSegDaos = repository.findQcMaskSegDaos(List.of());

    assertTrue(qcMaskSegDaos.isEmpty());
  }

  @Test
  void testRetrieveSingleDao() {
    List<QcMaskSegDao> qcMaskSegDaos = repository.findQcMaskSegDaos(List.of(1000000000208L));

    assertEquals(1, qcMaskSegDaos.size());
  }

  @Test
  void testRetrieveMultipleDaos() {
    List<QcMaskSegDao> qcMaskSegDaos = repository.findQcMaskSegDaos(List.of(1000000000209L));

    List<Long> startSampleList = List.of(20016L, 83606L);

    assertEquals(2, qcMaskSegDaos.size());
    qcMaskSegDaos.forEach(
        dao -> assertTrue(startSampleList.contains(dao.getQcMaskSegKey().getStartSample())));
  }
}
