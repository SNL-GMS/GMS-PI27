package gms.shared.waveform.qc.mask.repository;

import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentRepository;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.qc.mask.cache.BridgedQcMaskDaoCache;
import gms.shared.waveform.qc.mask.cache.BridgedQcSegmentCache;
import gms.shared.waveform.qc.mask.connector.QcMaskInfoDatabaseConnector;
import gms.shared.waveform.qc.mask.connector.QcMaskSegDatabaseConnector;
import gms.shared.waveform.qc.mask.controller.QcSegmentController;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** BridgedQcSegmentRepository for querying connectors and cache */
@Component("bridgedQcSegmentRepository")
public class BridgedQcSegmentRepository implements QcSegmentRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedQcSegmentRepository.class);
  private static final String NOT_SUPPORTED = "Not supported yet.";

  private final QcMaskInfoDatabaseConnector qcMaskInfoDatabaseConnector;
  private final QcMaskSegDatabaseConnector qcMaskSegDatabaseConnector;
  private final QcSegmentController qcSegmentController;
  private final BridgedQcSegmentCache bridgedQcSegmentCache;
  private final BridgedQcMaskDaoCache bridgedQcMaskDaoCache;

  @Autowired
  public BridgedQcSegmentRepository(
      QcMaskInfoDatabaseConnector qcMaskInfoDatabaseConnector,
      QcMaskSegDatabaseConnector qcMaskSegDatabaseConnector,
      QcSegmentController qcSegmentController,
      BridgedQcSegmentCache bridgedQcSegmentCache,
      BridgedQcMaskDaoCache bridgedQcMaskDaoCache) {
    this.qcMaskInfoDatabaseConnector = qcMaskInfoDatabaseConnector;
    this.qcMaskSegDatabaseConnector = qcMaskSegDatabaseConnector;
    this.qcSegmentController = qcSegmentController;
    this.bridgedQcSegmentCache = bridgedQcSegmentCache;
    this.bridgedQcMaskDaoCache = bridgedQcMaskDaoCache;
  }

  @Override
  public List<QcSegment> findQcSegmentsByIds(List<UUID> uuids) {
    var qcSegments = bridgedQcSegmentCache.findQcSegmentsByIds(uuids);

    if (qcSegments.isEmpty()) {
      LOGGER.warn("There are not QcSegments in cache with the ids: {}", uuids);
    }

    return qcSegments;
  }

  @Override
  public List<QcSegmentVersion> findQcSegmentVersionsByIds(
      List<QcSegmentVersionId> qcSegmentVersionIds) {
    var qcSegmentVersions = bridgedQcSegmentCache.findQcSegmentVersionsByIds(qcSegmentVersionIds);

    if (qcSegmentVersions.isEmpty()) {
      LOGGER.warn("There are not QcSegmentVersions in cache with the ids: {}", qcSegmentVersionIds);
    }

    return qcSegmentVersions;
  }

  @Override
  public List<QcSegment> findQcSegmentsByChannelsAndTimeRange(
      Collection<Channel> channels, Instant startTime, Instant endTime) {

    var keys = channels.stream().map(StationDefinitionIdUtility::getCssKeyFromChannelName).toList();

    var infoDaos = qcMaskInfoDatabaseConnector.findQcMaskInfoDaos(keys, startTime, endTime);
    var qcMaskIds = infoDaos.stream().map(QcMaskInfoDao::getQcMaskId).toList();
    var segDaos = qcMaskSegDatabaseConnector.findQcMaskSegDaos(qcMaskIds);

    if (segDaos.isEmpty() || infoDaos.isEmpty()) {
      LOGGER.warn("No QcMaskInfo or QcMasSeg daos found");
      return List.of();
    }

    var qcDaos = qcSegmentController.getQcDaoObjects(infoDaos, segDaos);

    return bridgedQcMaskDaoCache.updateDaoObjectsAndQcSegments(qcDaos, startTime, endTime);
  }

  @Override
  public void storeQcSegments(List<QcSegment> qcSegments) {
    throw new UnsupportedOperationException(NOT_SUPPORTED);
  }

  @Override
  public void storeQcSegmentVersions(List<QcSegmentVersion> qcSegmentVersions) {
    throw new UnsupportedOperationException(NOT_SUPPORTED);
  }

  @Override
  public void clear() {
    throw new UnsupportedOperationException(NOT_SUPPORTED);
  }

  @Override
  public Collection<QcSegment> findQcSegmentsByChannelsandTimeRangeCanned(
      Collection<Channel> channels,
      Instant startTime,
      Instant endTime,
      FacetingDefinition facetingDefinition) {
    return List.of();
  }

  @Override
  public Collection<QcSegment> findQcSegmentsByChannelsandTimeRangeCanned(
      Collection<Channel> channels, Instant startTime, Instant endTime) {
    return List.of();
  }
}
