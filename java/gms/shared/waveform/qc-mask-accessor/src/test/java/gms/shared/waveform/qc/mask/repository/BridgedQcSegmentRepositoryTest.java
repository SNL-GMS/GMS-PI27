package gms.shared.waveform.qc.mask.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import gms.shared.waveform.qc.mask.cache.BridgedQcMaskDaoCache;
import gms.shared.waveform.qc.mask.cache.BridgedQcSegmentCache;
import gms.shared.waveform.qc.mask.connector.QcMaskInfoDatabaseConnector;
import gms.shared.waveform.qc.mask.connector.QcMaskSegDatabaseConnector;
import gms.shared.waveform.qc.mask.controller.QcSegmentController;
import gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedQcSegmentRepositoryTest {

  @InjectMocks BridgedQcSegmentRepository bridgedQcSegmentRepository;
  @Mock QcMaskInfoDatabaseConnector qcMaskInfoDatabaseConnector;
  @Mock QcMaskSegDatabaseConnector qcMaskSegDatabaseConnector;
  @Mock QcSegmentController qcSegmentController;
  @Mock BridgedQcSegmentCache bridgedQcSegmentCache;
  @Mock BridgedQcMaskDaoCache bridgedQcMaskDaoCache;

  @Test
  void testCreate() {
    Assertions.assertNotNull(
        new BridgedQcSegmentRepository(
            qcMaskInfoDatabaseConnector,
            qcMaskSegDatabaseConnector,
            qcSegmentController,
            bridgedQcSegmentCache,
            bridgedQcMaskDaoCache));
  }

  @Test
  void testFindByChannelsAndTimeRange() {

    Instant startTime = Instant.parse("2008-11-10T17:26:44Z");
    Instant endTime = Instant.parse("2010-07-10T17:26:44Z");
    var chans = List.of(QcTestFixtures.DEFAULT_CHANNEL);

    var infoDao = QcTestFixtures.QCMASK_INFO_DAO1;
    var segDao = QcTestFixtures.QCMASK_SEG_DAO1;
    var qcDaos = List.of(QcTestFixtures.getDefaultQcDaoObject());
    var qcSegs = List.of(QcSegmentTestFixtures.getDefaultQcSegment());

    when(qcMaskInfoDatabaseConnector.findQcMaskInfoDaos(anyList(), eq(startTime), eq(endTime)))
        .thenReturn(List.of(infoDao));

    when(qcMaskSegDatabaseConnector.findQcMaskSegDaos(List.of(infoDao.getQcMaskId())))
        .thenReturn(List.of(segDao));

    when(qcSegmentController.getQcDaoObjects(List.of(infoDao), List.of(segDao))).thenReturn(qcDaos);

    when(bridgedQcMaskDaoCache.updateDaoObjectsAndQcSegments(qcDaos, startTime, endTime))
        .thenReturn(qcSegs);

    var qcSegsActual =
        bridgedQcSegmentRepository.findQcSegmentsByChannelsAndTimeRange(chans, startTime, endTime);

    assertEquals(qcSegs, qcSegsActual);
  }

  @Test
  void testFindQcSegmentsByIds() {
    var uuid = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b876");

    var qcSegs = List.of(QcSegmentTestFixtures.getDefaultQcSegment());

    when(bridgedQcSegmentCache.findQcSegmentsByIds(List.of(uuid))).thenReturn(qcSegs);

    var qcSegsActual = bridgedQcSegmentRepository.findQcSegmentsByIds(List.of(uuid));

    assertEquals(qcSegs, qcSegsActual);
  }

  @Test
  void testFindQcSegmentVersionsByIds() {
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentVersion = qcSegment.getData().get().getVersionHistory().last();
    var id = qcSegmentVersion.getId();

    when(bridgedQcSegmentCache.findQcSegmentVersionsByIds(List.of(id)))
        .thenReturn(List.of(qcSegmentVersion));

    var qcSegVersionsActual = bridgedQcSegmentRepository.findQcSegmentVersionsByIds(List.of(id));

    assertEquals(qcSegmentVersion, qcSegVersionsActual.get(0));
  }

  @Test
  void testEmptyQcSegments() {
    var uuid = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b876");

    when(bridgedQcSegmentCache.findQcSegmentsByIds(List.of(uuid))).thenReturn(List.of());

    var qcSegsActual = bridgedQcSegmentRepository.findQcSegmentsByIds(List.of(uuid));

    assertTrue(qcSegsActual.isEmpty());
  }

  @Test
  void testEmptyQcSegmentVersions() {
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentVersion = qcSegment.getData().get().getVersionHistory().last();
    var id = qcSegmentVersion.getId();

    when(bridgedQcSegmentCache.findQcSegmentVersionsByIds(List.of(id))).thenReturn(List.of());

    var qcSegVersionsActual = bridgedQcSegmentRepository.findQcSegmentVersionsByIds(List.of(id));

    assertTrue(qcSegVersionsActual.isEmpty());
  }
}
