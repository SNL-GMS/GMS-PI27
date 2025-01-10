package gms.shared.waveform.qc.mask.cache;

import static gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory.QC_SEGMENT_CACHE;
import static gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory.QC_SEGMENT_VERSION_CACHE;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.qc.mask.cache.util.QcMaskCacheFactory;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.locks.Lock;
import javax.cache.Cache;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.query.ScanQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Bridged qc segment cache stores new qc segment coi objects */
@Component
public final class BridgedQcSegmentCache {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedQcSegmentCache.class);
  public static final String CACHE_INITIALIZED = "Cache already initialized: ";

  private IgniteCache<UUID, QcSegment> qcSegmentCache;
  private IgniteCache<QcSegmentVersionId, QcSegmentVersion> qcSegmentVersionCache;

  @Autowired
  public BridgedQcSegmentCache(SystemConfig systemConfig) {
    initializeCache(systemConfig);
  }

  /**
   * Setup and initialize qc segment and version caches
   *
   * @param systemConfig input {@link SystemConfig}
   */
  private void initializeCache(SystemConfig systemConfig) {
    try {
      QcMaskCacheFactory.setUpCache(systemConfig);
    } catch (IllegalStateException e) {
      LOGGER.warn(CACHE_INITIALIZED, e);
    }

    this.qcSegmentCache = IgniteConnectionManager.getOrCreateCache(QC_SEGMENT_CACHE);
    this.qcSegmentVersionCache = IgniteConnectionManager.getOrCreateCache(QC_SEGMENT_VERSION_CACHE);
  }

  /**
   * Find {@link QcSegment}s by uuids
   *
   * @param uuids input uuids
   * @return list of matching {@link QcSegment}s
   */
  public List<QcSegment> findQcSegmentsByIds(Collection<UUID> uuids) {
    return qcSegmentCache.query(new ScanQuery<UUID, QcSegment>()).getAll().stream()
        .filter(entry -> uuids.contains(entry.getKey()))
        .map(Cache.Entry::getValue)
        .toList();
  }

  /**
   * Find {@link QcSegmentVersion}s by version ids
   *
   * @param qcSegmentVersionIds input list of { @QcSegmentVersionId}s
   * @return list of {@link QcSegmentVersion}
   */
  public List<QcSegmentVersion> findQcSegmentVersionsByIds(
      Collection<QcSegmentVersionId> qcSegmentVersionIds) {

    return qcSegmentVersionCache
        .query(new ScanQuery<QcSegmentVersionId, QcSegmentVersion>())
        .getAll()
        .stream()
        .filter(entry -> qcSegmentVersionIds.contains(entry.getKey()))
        .map(Cache.Entry::getValue)
        .toList();
  }

  /**
   * Find {@link QcSegment}s by channels and time range
   *
   * @param channels input chans
   * @param startTime time range start
   * @param endTime time range end
   * @return list of {@link QcSegment}s
   */
  public List<QcSegment> findQcSegmentsByChannelsAndTimeRange(
      List<Channel> channels, Instant startTime, Instant endTime) {

    return qcSegmentCache.query(new ScanQuery<UUID, QcSegment>()).getAll().stream()
        .map(Cache.Entry::getValue)
        .filter(BridgedQcSegmentCache::checkQcSegmentAndVersionData)
        .filter(
            qcSegment ->
                checkChannelAndTimeRange(qcSegment.getData().get(), channels, startTime, endTime))
        .map(BridgedQcSegmentCache::createLatestQcSegment)
        .filter(Objects::nonNull)
        .toList();
  }

  /**
   * Find {@link QcSegment}s by channels and time range
   *
   * @param channelNames input channel names
   * @param startTime time range start
   * @param endTime time range end
   * @return list of {@link QcSegment}s
   */
  public List<QcSegment> findQcSegmentsByStaChanPairAndTimeRange(
      Set<String> channelNames, Instant startTime, Instant endTime) {

    return qcSegmentCache.query(new ScanQuery<UUID, QcSegment>()).getAll().stream()
        .map(Cache.Entry::getValue)
        .filter(BridgedQcSegmentCache::checkQcSegmentAndVersionData)
        .filter(
            qcSegment ->
                checkChannelNameAndTimeRange(
                    qcSegment.getData().get(), channelNames, startTime, endTime))
        .map(BridgedQcSegmentCache::createLatestQcSegment)
        .toList();
  }

  /**
   * Store {@link QcSegment}s to cache
   *
   * @param qcSegments
   */
  public void storeQcSegments(Iterable<QcSegment> qcSegments) {
    for (var qcSegment : qcSegments) {
      var uuid = qcSegment.getId();
      var lock = acquireQcSegmentLock(uuid);
      try {
        lock.lock();
        qcSegmentCache.put(uuid, qcSegment);
      } finally {
        lock.unlock();
      }
    }
  }

  /**
   * Store {@link QcSegmentVersion}s to cache
   *
   * @param qcSegmentVersions
   */
  public void storeQcSegmentVersions(Iterable<QcSegmentVersion> qcSegmentVersions) {
    for (var qcSegmentVersion : qcSegmentVersions) {
      var qcSegmentVersionKey = qcSegmentVersion.getId();
      var lock = acquireQcSegmentVersionLock(qcSegmentVersionKey);
      try {
        lock.lock();
        qcSegmentVersionCache.put(qcSegmentVersionKey, qcSegmentVersion);
      } finally {
        lock.unlock();
      }
    }
  }

  /**
   * Finds whether or not the QcSegmentVersion is already in the cache
   *
   * @param qcSegmentVersion input qc segment versions
   * @return boolean for qc segment version contain in the cache
   */
  public boolean containsQcSegmentVersion(QcSegmentVersion qcSegmentVersion) {
    return qcSegmentVersionCache.containsKey(qcSegmentVersion.getId());
  }

  public void clear() {
    qcSegmentCache.clear();
    qcSegmentVersionCache.clear();
  }

  /**
   * Lock the {@link QcSegmentCache} when updating
   *
   * @param uuid key to lock
   * @return the cache lock for the UUID
   */
  private Lock acquireQcSegmentLock(UUID uuid) {
    return qcSegmentCache.lock(uuid);
  }

  /**
   * Lock the {@link QcSegmentVersionCache} when updating
   *
   * @param uuid key to lock
   * @return the cache lock for the UUID
   */
  private Lock acquireQcSegmentVersionLock(QcSegmentVersionId qcSegmentVersionKey) {
    return qcSegmentVersionCache.lock(qcSegmentVersionKey);
  }

  /**
   * Check that the channel is in the channel list and version data exists
   *
   * @param qcSegment {@link QcSegment}
   * @return boolean for channel and data existence
   */
  private static boolean checkQcSegmentAndVersionData(QcSegment qcSegment) {
    var segData = qcSegment.getData();
    if (segData.isPresent()) {
      var data = segData.get();
      var lastVersion = data.getVersionHistory().last();
      return lastVersion.getData().isPresent();
    }

    return false;
  }

  /**
   * Check that {@link QcSegment} channel is in the channels list and that the last version lies in
   * the time range
   *
   * @param data {@link QcSegment.Data}
   * @param channels list of input channels
   * @param startTime start time input
   * @param endTime end time input
   * @return boolean
   */
  private static boolean checkChannelAndTimeRange(
      QcSegment.Data data, List<Channel> channels, Instant startTime, Instant endTime) {
    var chan = data.getChannel();
    var lastVersion = data.getVersionHistory().last();
    var versionData = lastVersion.getData().orElse(null);

    if (versionData != null) {
      var versionStart = versionData.getStartTime();
      var versionEnd = versionData.getEndTime();
      return channels.contains(chan)
          && versionStart.isBefore(endTime)
          && versionEnd.isAfter(startTime);
    }

    return false;
  }

  /**
   * Check that {@link String} station channel pair is in the channel names list and that the last
   * version lies in the time range
   *
   * @param data {@link QcSegment.Data}
   * @param channelNames list of input channel names
   * @param startTime start time input
   * @param endTime end time input
   * @return boolean
   */
  private static boolean checkChannelNameAndTimeRange(
      QcSegment.Data data, Set<String> channelNames, Instant startTime, Instant endTime) {
    var chan = data.getChannel();
    var staChanPair = StationDefinitionIdUtility.getStationChannelCodeFromChannel(chan);
    var lastVersion = data.getVersionHistory().last();
    var versionData = lastVersion.getData().orElse(null);

    if (versionData != null) {
      var versionStart = versionData.getStartTime();
      var versionEnd = versionData.getEndTime();
      return channelNames.contains(staChanPair)
          && versionStart.isBefore(endTime)
          && versionEnd.isAfter(startTime);
    }

    return false;
  }

  /**
   * Create a latest {@link QcSegment} given a previous {@link QcSegment}
   *
   * @param qcSegment the old QcSegment object
   * @return the new {@link QcSegment}
   */
  private static QcSegment createLatestQcSegment(QcSegment qcSegment) {
    var uuid = qcSegment.getId();
    var data = qcSegment.getData().orElse(null);

    if (data != null) {
      var latestVersion = data.getVersionHistory().last();
      var channel = data.getChannel();

      var qcSegmentData =
          QcSegment.Data.instanceBuilder()
              .setChannel(channel)
              .setVersionHistory(new TreeSet<>(Set.of(latestVersion)))
              .build();

      return QcSegment.instanceBuilder().setId(uuid).setData(qcSegmentData).build();
    }

    return null;
  }
}
