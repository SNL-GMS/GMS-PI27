package gms.shared.waveform.qc.mask.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.cache.utils.IgniteTestUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@Tag("component")
@Disabled("failing with threading race condition 'Failed to unlock keys'")
@ExtendWith(MockitoExtension.class)
class BridgedQcSegmentCacheTest {

  BridgedQcSegmentCache qcSegmentCache;

  @Mock SystemConfig systemConfig;

  @TempDir static Path tempIgnitePath;

  @BeforeAll
  static void setup() {
    IgniteTestUtility.initializeLocally(
        tempIgnitePath,
        QcMaskCacheFactory.QC_SEGMENT_CACHE,
        QcMaskCacheFactory.QC_SEGMENT_VERSION_CACHE);
  }

  @BeforeEach
  void setUp() {
    qcSegmentCache = new BridgedQcSegmentCache(systemConfig);
  }

  @AfterEach
  void tearDown() {
    qcSegmentCache.clear();
  }

  @Test
  void testFindQcSegmentsByIds() {
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var uuids = List.of(qcSegment.getId());

    // first check that the cache is empty
    assertTrue(qcSegmentCache.findQcSegmentsByIds(uuids).isEmpty());

    // store then check the cache
    qcSegmentCache.storeQcSegments(List.of(qcSegment));
    var qcSegments = qcSegmentCache.findQcSegmentsByIds(uuids);

    assertTrue(!qcSegments.isEmpty());
    assertEquals(1, qcSegments.size());
    assertEquals(qcSegment, qcSegments.get(0));
  }

  @Test
  void testFindQcSegmentVersionsByIds() {
    var qcSegmentVersion =
        QcSegmentTestFixtures.getDefaultQcSegmentVersion(QcSegmentTestFixtures.ID_UUID);
    var versionIds = List.of(qcSegmentVersion.getId());

    // check cache empty
    assertTrue(qcSegmentCache.findQcSegmentVersionsByIds(versionIds).isEmpty());
    qcSegmentCache.storeQcSegmentVersions(List.of(qcSegmentVersion));
    var qcSegmentVersions = qcSegmentCache.findQcSegmentVersionsByIds(versionIds);

    assertTrue(!qcSegmentVersions.isEmpty());
    assertEquals(1, qcSegmentVersions.size());
    assertEquals(qcSegmentVersion, qcSegmentVersions.get(0));
  }

  @Test
  void testFindQcSegmentsByChannelsAndTimeRange() {
    // get the default qc segment with data
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentTwo = QcSegmentTestFixtures.getQcSegmentTwo();
    var qcSegmentData = qcSegment.getData().get();
    var channels = List.of(qcSegmentData.getChannel());

    // create a latest qc segment with only the last qc seg version
    var latestQcSegment = createLatestQcSegment(qcSegment);

    // get default qc segment version with data
    var qcSegmentVersion = QcSegmentTestFixtures.getDefaultQcSegmentVersion(qcSegment.getId());
    var qcSegmentVersionData = qcSegmentVersion.getData().get();
    var startTime = qcSegmentVersionData.getStartTime();
    var endTime = qcSegmentVersionData.getEndTime();

    // check that the cache is empty then populate
    assertTrue(
        qcSegmentCache
            .findQcSegmentsByChannelsAndTimeRange(channels, startTime, endTime)
            .isEmpty());
    qcSegmentCache.storeQcSegments(List.of(qcSegment, qcSegmentTwo));
    var qcSegments =
        qcSegmentCache.findQcSegmentsByChannelsAndTimeRange(channels, startTime, endTime);

    assertTrue(!qcSegments.isEmpty());
    assertEquals(1, qcSegments.size());
    assertEquals(latestQcSegment, qcSegments.get(0));
  }

  @Test
  void testFindQcSegmentsByStaChanPairAndTimeRange() {
    // get the default qc segment with data
    var qcSegment = QcSegmentTestFixtures.getDefaultQcSegment();
    var qcSegmentTwo = QcSegmentTestFixtures.getQcSegmentTwo();
    var qcSegmentData = qcSegment.getData().get();
    var chan = qcSegmentData.getChannel();

    // get staChanPair
    var staChanPair = StationDefinitionIdUtility.getStationChannelCodeFromChannel(chan);
    var staChanPairsSet = new HashSet<>(List.of(staChanPair));

    // create a latest qc segment with only the last qc seg version
    var latestQcSegment = createLatestQcSegment(qcSegment);

    // get default qc segment version with data
    var qcSegmentVersion = QcSegmentTestFixtures.getDefaultQcSegmentVersion(qcSegment.getId());
    var qcSegmentVersionData = qcSegmentVersion.getData().get();
    var startTime = qcSegmentVersionData.getStartTime();
    var endTime = qcSegmentVersionData.getEndTime();

    // check that the cache is empty then populate
    assertTrue(
        qcSegmentCache
            .findQcSegmentsByStaChanPairAndTimeRange(staChanPairsSet, startTime, endTime)
            .isEmpty());
    qcSegmentCache.storeQcSegments(List.of(qcSegment, qcSegmentTwo));
    var qcSegments =
        qcSegmentCache.findQcSegmentsByStaChanPairAndTimeRange(staChanPairsSet, startTime, endTime);

    assertTrue(!qcSegments.isEmpty());
    assertEquals(1, qcSegments.size());
    assertEquals(latestQcSegment, qcSegments.get(0));
  }

  @Test
  void testContainsQcSegmentVersionCache() {
    var qcSegmentVersion =
        QcSegmentTestFixtures.getDefaultQcSegmentVersion(QcSegmentTestFixtures.ID_UUID);

    qcSegmentCache.storeQcSegmentVersions(List.of(qcSegmentVersion));

    assertTrue(qcSegmentCache.containsQcSegmentVersion(qcSegmentVersion));
  }

  @Test
  void testDoesNotContainQcSegmentVersionCache() {
    var qcSegmentVersion =
        QcSegmentTestFixtures.getDefaultQcSegmentVersion(QcSegmentTestFixtures.ID_UUID);

    assertFalse(qcSegmentCache.containsQcSegmentVersion(qcSegmentVersion));
  }

  /**
   * Create a latest {@link QcSegment} given a previous {@link QcSegment}
   *
   * @param qcSegment the old QcSegment object
   * @return the new {@link QcSegment}
   */
  private QcSegment createLatestQcSegment(QcSegment qcSegment) {
    var uuid = qcSegment.getId();
    var data = qcSegment.getData().get();
    var latestVersion = data.getVersionHistory().last();
    var channel = data.getChannel();

    var qcSegmentData =
        QcSegment.Data.instanceBuilder()
            .setChannel(channel)
            .setVersionHistory(new TreeSet<>(Set.of(latestVersion)))
            .build();

    return QcSegment.instanceBuilder().setId(uuid).setData(qcSegmentData).build();
  }
}
