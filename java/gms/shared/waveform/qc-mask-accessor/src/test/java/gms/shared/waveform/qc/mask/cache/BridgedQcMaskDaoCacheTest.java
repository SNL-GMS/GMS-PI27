package gms.shared.waveform.qc.mask.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gms.shared.frameworks.cache.utils.IgniteTestUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory;
import gms.shared.waveform.qc.mask.controller.QcSegmentController;
import gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@Tag("component")
@ExtendWith(MockitoExtension.class)
class BridgedQcMaskDaoCacheTest {

  BridgedQcMaskDaoCache daoCache;

  @Mock SystemConfig systemConfig;

  @Mock BridgedQcSegmentCache segmentCache;

  @TempDir static Path tempIgnitePath;

  @Mock QcSegmentController qcSegmentController;

  @BeforeAll
  static void setup() {
    IgniteTestUtility.initializeLocally(
        tempIgnitePath, QcMaskCacheFactory.QC_MASK_DAO_CACHE, QcMaskCacheFactory.QC_SEGMENT_CACHE);
  }

  @BeforeEach
  void setUp() {
    daoCache = new BridgedQcMaskDaoCache(systemConfig, qcSegmentController, segmentCache);
  }

  @AfterEach
  void tearDown() {
    daoCache.clear();
  }

  @Test
  void testNothingInCaches() {

    var dao = QcTestFixtures.getDefaultQcDaoObject();
    var segment = QcSegmentTestFixtures.getDefaultQcSegment();

    when(segmentCache.findQcSegmentsByStaChanPairAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(segment));
    when(qcSegmentController.updateQcSegmentsAndVersions(List.of(segment), List.of(dao)))
        .thenReturn(List.of(segment));

    List<QcSegment> qcSegments =
        daoCache.updateDaoObjectsAndQcSegments(List.of(dao), Instant.MIN, Instant.MAX);
    assertEquals(1, qcSegments.size());
    assertEquals(segment, qcSegments.get(0));
    verify(qcSegmentController, times(1))
        .updateQcSegmentsAndVersions(List.of(segment), List.of(dao));
  }

  @Test
  void testInCache() {

    var dao1 = QcTestFixtures.getDefaultQcDaoObject();
    var dao2 = QcTestFixtures.getDefaultQcDaoObject();
    dao2.setQcMaskId(2L);
    var segment = QcSegmentTestFixtures.getDefaultQcSegment();

    when(segmentCache.findQcSegmentsByStaChanPairAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(segment));
    when(qcSegmentController.updateQcSegmentsAndVersions(List.of(segment), List.of(dao1)))
        .thenReturn(List.of(segment));

    when(qcSegmentController.updateQcSegmentsAndVersions(List.of(segment), List.of(dao2)))
        .thenReturn(List.of(segment));

    List<QcSegment> qcSegments =
        daoCache.updateDaoObjectsAndQcSegments(List.of(dao1), Instant.MIN, Instant.MAX);
    assertEquals(1, qcSegments.size());
    assertEquals(segment, qcSegments.get(0));
    verify(qcSegmentController, times(1))
        .updateQcSegmentsAndVersions(List.of(segment), List.of(dao1));

    qcSegments =
        daoCache.updateDaoObjectsAndQcSegments(List.of(dao1, dao2), Instant.MIN, Instant.MAX);
    verify(qcSegmentController, times(1))
        .updateQcSegmentsAndVersions(List.of(segment), List.of(dao2));
  }

  @Test
  void testQcSegmentVersionCacheNoDuplicates() {
    var dao1 = QcTestFixtures.getDefaultQcDaoObject();
    var segment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentVersion = segment.getData().get().getVersionHistory().last();

    when(segmentCache.findQcSegmentsByStaChanPairAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(segment));

    when(qcSegmentController.updateQcSegmentsAndVersions(List.of(segment), List.of(dao1)))
        .thenReturn(List.of(segment));

    List<QcSegment> qcSegments =
        daoCache.updateDaoObjectsAndQcSegments(List.of(dao1), Instant.MIN, Instant.MAX);

    assertEquals(1, qcSegments.size());
    assertEquals(segment, qcSegments.get(0));

    verify(segmentCache, times(1)).storeQcSegmentVersions(List.of(qcSegmentVersion));
  }

  @Test
  void testQcSegmentVersionCacheDuplicates() {
    var dao1 = QcTestFixtures.getDefaultQcDaoObject();
    var segment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentVersion = segment.getData().get().getVersionHistory().last();

    when(segmentCache.findQcSegmentsByStaChanPairAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(segment));

    when(segmentCache.containsQcSegmentVersion(qcSegmentVersion)).thenReturn(Boolean.TRUE);

    when(qcSegmentController.updateQcSegmentsAndVersions(List.of(segment), List.of(dao1)))
        .thenReturn(List.of(segment));

    daoCache.updateDaoObjectsAndQcSegments(List.of(dao1), Instant.MIN, Instant.MAX);

    verify(segmentCache, never()).storeQcSegmentVersions(List.of(qcSegmentVersion));
  }
}
