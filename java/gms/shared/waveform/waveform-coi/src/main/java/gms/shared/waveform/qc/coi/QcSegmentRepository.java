package gms.shared.waveform.qc.coi;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** QcSegmentRepository defining BridgedQcSegmentRepository and cache operations */
public interface QcSegmentRepository {

  /** Clear all values in the cache */
  void clear();

  /**
   * Find {@link QcSegment}s by ids
   *
   * @param uuids input list of UUIDs
   * @return list of {@link QcSegment}s
   */
  List<QcSegment> findQcSegmentsByIds(List<UUID> uuids);

  /**
   * Find {@link QcSegmentVersion}s by {@link QcSegmentVersionId}s
   *
   * @param qcSegmentVersionIds input list of {@link QcSegmentVersionId}s
   * @return list of {@link QcSegmentVersion}s
   */
  List<QcSegmentVersion> findQcSegmentVersionsByIds(List<QcSegmentVersionId> qcSegmentVersionIds);

  /**
   * Find {@link QcSegment}s by {@link Channel}s and time range
   *
   * @param channels list of {@link Channel}s
   * @param startTime start time Instant
   * @param endTime end time Instant
   * @return list of {@link QcSegment}s
   */
  List<QcSegment> findQcSegmentsByChannelsAndTimeRange(
      Collection<Channel> channels, Instant startTime, Instant endTime);

  /**
   * Store {@link QcSegment}s to cache
   *
   * @param qcSegments list of {@link QcSegment}s to store to cache
   */
  void storeQcSegments(List<QcSegment> qcSegments);

  /**
   * Store {@link QcSegmentVersion}s to cache
   *
   * @param qcSegmentVersions list of {@link QcSegmentVersion}s to store to cache
   */
  void storeQcSegmentVersions(List<QcSegmentVersion> qcSegmentVersions);

  /**
   * Queries for {@link QcSegment}s of channels in within the provided time range with a provided
   * {@link FacetingDefinition}
   *
   * @param channels A list of channels to query for {@link QcSegment}s
   * @param startTime Start time of the query
   * @param endTime End Time of the query
   * @param facetingDefinition {@link FacetingDefinition}
   * @return A Collection of {@link QcSegment}s associated with the channels during the requested
   *     interval.
   */
  Collection<QcSegment> findQcSegmentsByChannelsandTimeRangeCanned(
      Collection<Channel> channels,
      Instant startTime,
      Instant endTime,
      FacetingDefinition facetingDefinition);

  /**
   * Queries for {@link QcSegment}s of channels in within the provided time range.
   *
   * @param channels A list of channels to query for {@link QcSegment}s
   * @param startTime Start time of the query
   * @param endTime End Time of the query
   * @param facetingDefinition {@link FacetingDefinition}
   * @return A Collection of {@link QcSegment}s associated with the channels during the requested
   *     interval.
   */
  Collection<QcSegment> findQcSegmentsByChannelsandTimeRangeCanned(
      Collection<Channel> channels, Instant startTime, Instant endTime);
}
