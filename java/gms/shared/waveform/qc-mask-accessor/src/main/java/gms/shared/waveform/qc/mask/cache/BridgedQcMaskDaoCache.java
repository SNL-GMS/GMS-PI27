package gms.shared.waveform.qc.mask.cache;

import static gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory.QC_MASK_DAO_CACHE;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory;
import gms.shared.waveform.qc.mask.controller.QcSegmentController;
import gms.shared.waveform.qc.mask.converter.QcDaoObject;
import gms.shared.waveform.qc.mask.util.QcSegmentUtility;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;
import org.apache.ignite.IgniteCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Main qc mask dao cache for storing previously bridged daos */
@Component
public class BridgedQcMaskDaoCache {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedQcMaskDaoCache.class);
  private static final String CACHE_INITIALIZED = "Cache already initialized: ";

  private final QcSegmentController qcSegmentController;
  private final BridgedQcSegmentCache bridgedQcSegmentCache;
  private IgniteCache<String, QcDaoObject> qcMaskDaoCache;

  @Autowired
  public BridgedQcMaskDaoCache(
      SystemConfig systemConfig,
      QcSegmentController qcSegmentController,
      BridgedQcSegmentCache bridgedQcSegmentCache) {
    this.qcSegmentController = qcSegmentController;
    this.bridgedQcSegmentCache = bridgedQcSegmentCache;
    initializeCache(systemConfig);
  }

  /**
   * Setup and initialize qc mask dao cache
   *
   * @param systemConfig input {@link SystemConfig}
   */
  private void initializeCache(SystemConfig systemConfig) {
    try {
      QcMaskCacheFactory.setUpCache(systemConfig);
    } catch (IllegalStateException e) {
      LOGGER.warn(CACHE_INITIALIZED, e);
    }

    this.qcMaskDaoCache = IgniteConnectionManager.getOrCreateCache(QC_MASK_DAO_CACHE);
  }

  /**
   * For each QcDaoObject, checks if QcDaoObject exists in cache (indicating it has been processed)
   * and if it doesn't creates a new qcsegment from the QcDaoObject and stores it in the
   * QcSegmentCache
   *
   * @param qcDaoObjects the qc dao objects
   * @param startTime the start time of the query for the dao objects
   * @param endTime the end time of the query for the dao objects
   * @return List of QcSegments
   */
  public List<QcSegment> updateDaoObjectsAndQcSegments(
      Collection<QcDaoObject> qcDaoObjects, Instant startTime, Instant endTime) {

    for (QcDaoObject qcDao : qcDaoObjects) {

      var daoLock = getLockForQcDao(qcDao);
      try {
        // acquire lock for this dao's key
        daoLock.lock();
        var key = QcSegmentUtility.getUniqueKeyForQcDao(qcDao);

        // check if dao not already in cache
        if (!qcMaskDaoCache.containsKey(key)) {

          var staChanPair = QcSegmentUtility.getChannelStaChanPair(qcDao);
          // get relevant qc segments from cache
          var qcSegments =
              bridgedQcSegmentCache.findQcSegmentsByStaChanPairAndTimeRange(
                  Set.of(staChanPair), startTime, endTime);

          var updatedQcSegments =
              qcSegmentController.updateQcSegmentsAndVersions(qcSegments, List.of(qcDao));

          var qcSegmentVersions = retrieveQcSegmentVersions(updatedQcSegments);

          bridgedQcSegmentCache.storeQcSegments(updatedQcSegments);

          bridgedQcSegmentCache.storeQcSegmentVersions(qcSegmentVersions);

          qcMaskDaoCache.put(key, qcDao);
        }
      } finally {
        daoLock.unlock();
      }
    }

    var staChanPairs =
        qcDaoObjects.stream()
            .map(QcSegmentUtility::getChannelStaChanPair)
            .distinct()
            .collect(Collectors.toSet());

    return bridgedQcSegmentCache.findQcSegmentsByStaChanPairAndTimeRange(
        staChanPairs, startTime, endTime);
  }

  private List<QcSegmentVersion> retrieveQcSegmentVersions(List<QcSegment> qcSegments) {

    return qcSegments.stream()
        .map(QcSegment::getData)
        .flatMap(Optional::stream)
        .map(data -> data.getVersionHistory().last())
        .filter(
            qcSegmentVersion -> !bridgedQcSegmentCache.containsQcSegmentVersion(qcSegmentVersion))
        .toList();
  }

  private Lock getLockForQcDao(QcDaoObject qcDaoObject) {
    var key = QcSegmentUtility.getUniqueKeyForQcDao(qcDaoObject);
    return qcMaskDaoCache.lock(key);
  }

  /** Clears all values within the cache */
  public void clear() {
    qcMaskDaoCache.clear();
  }
}
