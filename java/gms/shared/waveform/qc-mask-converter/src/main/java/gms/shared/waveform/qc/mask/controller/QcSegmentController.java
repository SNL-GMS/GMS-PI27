package gms.shared.waveform.qc.mask.controller;

import com.google.common.collect.Range;
import com.google.common.collect.RangeSet;
import com.google.common.collect.TreeRangeSet;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegment.Data;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.mask.converter.BridgedQcSegmentConverter;
import gms.shared.waveform.qc.mask.converter.QcDaoObject;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import gms.shared.waveform.qc.mask.util.QcSegmentUtility;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.apache.commons.lang3.Validate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * QcSegmentController for controlling how the converter needs to transform the QcDaoObjects into
 * the different use cases of the QcSegments conversion
 */
@Component
public class QcSegmentController {

  // list of objects cannot be null
  static final String NULL_QC_SEGMENTS = "QcSegments cannot be null";
  static final String NULL_QC_DAO_OBJECTS = "QcDaoObjects cannot be null";
  static final Duration MIN_TIME_DURATION = Duration.ofSeconds(1);

  private final BridgedQcSegmentConverter converter;

  /**
   * Decides how the Converter needs to create QcSegments
   *
   * @param converter {@link BridgedQcSegmentConverter}
   */
  @Autowired
  public QcSegmentController(BridgedQcSegmentConverter converter) {
    this.converter = converter;
  }

  /**
   * Retrieve updated QcDaoObjects created by the converter
   *
   * @param infoDaos from the connectors {@link List<QcMaskInfoDao>}
   * @param segDaos from the connectors {@link List<QcMaskSegDao>}
   * @return {@link List<QcDaoObject>}
   */
  public List<QcDaoObject> getQcDaoObjects(
      Collection<QcMaskInfoDao> infoDaos, Collection<QcMaskSegDao> segDaos) {
    return converter.convertQcMaskDaosToQcDaoObjects(infoDaos, segDaos);
  }

  /**
   * Retrieve updated QcSegments created by the converter
   *
   * @param qcSegments from cache {@link List<QcSegment>}
   * @param qcDaoObjects {@link List<QcDaoObject>} from the connectors
   * @return {@link List<QcSegment>}
   */
  public List<QcSegment> updateQcSegmentsAndVersions(
      List<QcSegment> qcSegments, List<QcDaoObject> qcDaoObjects) {

    Validate.notNull(qcSegments, NULL_QC_SEGMENTS);
    Validate.notNull(qcDaoObjects, NULL_QC_DAO_OBJECTS);

    return qcDaoObjects.stream()
        .map(qcDao -> getUpdatedAndNewQcSegmentsForQcDao(qcSegments, qcDao))
        .flatMap(List::stream)
        .toList();
  }

  /**
   * Create and update QcSegments for a single qc dao object
   *
   * @param qcSegments from cache {@link List<QcSegment>}
   * @param qcDaoObject {@link QcDaoObject}
   * @return {@link List<QcSegment>}
   */
  private List<QcSegment> getUpdatedAndNewQcSegmentsForQcDao(
      List<QcSegment> qcSegments, QcDaoObject qcDaoObject) {

    List<QcSegment> overlappingQcSegments =
        getQcSegmentsOverlappingQcDaoObject(qcSegments, qcDaoObject);

    // Case 1: no latest qc segments overlap -> create new QcSegment
    if (overlappingQcSegments.isEmpty()) {
      return converter.convertQcDaoObjectsToQcSegments(List.of(qcDaoObject));
    }

    List<QcSegment> enclosedSegments = new ArrayList<>();
    var overlapSameTypeCounter = 0;
    RangeSet<Instant> qcDaoTimeRangeSet = TreeRangeSet.create();
    qcDaoTimeRangeSet.add(QcSegmentUtility.getQcDaoTimeRange(qcDaoObject));

    for (QcSegment qcSegment : overlappingQcSegments) {

      Optional<QcSegmentType> segType =
          qcSegment
              .getData()
              .flatMap(data -> data.getVersionHistory().last().getData())
              .flatMap(QcSegmentVersion.Data::getType);

      // create list of dao time ranges, and check segment types
      if (segType.isPresent() && segType.get() == converter.getSegmentTypeOfDao(qcDaoObject)) {

        if (qcDaoObjectAndSegmentRangeEqual(qcDaoObject, qcSegment)) {
          // there is no need to update or create new segment
          return List.of(qcSegment);
        }

        if (qcDaoObjectEnclosesSegment(qcDaoObject, qcSegment)) {
          enclosedSegments.add(qcSegment);
        }

        // remove the partial overlap time ranges from the time range set
        qcDaoTimeRangeSet.remove(QcSegmentUtility.getQcSegmentTimeRange(qcSegment));
        overlapSameTypeCounter++;
      }
    }

    return getQcSegmentsForGapsList(
        qcDaoObject, qcDaoTimeRangeSet, overlapSameTypeCounter, enclosedSegments);
  }

  // get new and updated qcsegments based on remaining gaps in time
  private List<QcSegment> getQcSegmentsForGapsList(
      QcDaoObject qcDaoObject,
      RangeSet<Instant> qcDaoTimeRangeSet,
      int overlapSameTypeCounter,
      List<QcSegment> enclosedSegments) {

    // Case 3: time overlap but with different type -> create new QCsegment
    if (overlapSameTypeCounter == 0) {
      return converter.convertQcDaoObjectsToQcSegments(List.of(qcDaoObject));
    }

    // Case 2: one overlapping segment version and it's enclosed by
    // qcDaoObject's time range -> update that qcSegment
    if (overlapSameTypeCounter == 1 && enclosedSegments.size() == 1) {
      return List.of(converter.updateQcSegment(enclosedSegments.get(0), qcDaoObject));
    }

    // Case 4: create new qcsegment for each gap not covered by overlaps
    List<QcSegment> qcSegmentsFromGaps = new ArrayList<>();
    for (Range<Instant> currRange : qcDaoTimeRangeSet.asRanges()) {
      if (isActualGap(currRange)) {
        qcSegmentsFromGaps.add(
            converter.convertQcDaoObjectToQcSegment(
                qcDaoObject, currRange.lowerEndpoint(), currRange.upperEndpoint()));
      }
    }
    return qcSegmentsFromGaps;
  }

  /**
   * Find {@link QcSegment}s that match {@link QcDaoObject} on sta and chan and overlap with {@link
   * QcDaoObject}'s time range
   *
   * @param qcSegments - list of {@link QcSegment}s
   * @param qcDaoObject - {@link QcDaoObject}
   * @return list of overlapping {@link QcSegment}s
   */
  private static List<QcSegment> getQcSegmentsOverlappingQcDaoObject(
      List<QcSegment> qcSegments, QcDaoObject qcDaoObject) {

    return qcSegments.stream()
        .filter(qcSegment -> qcSegment.getData().isPresent())
        .filter(
            qcSegment ->
                StationDefinitionIdUtility.getStationChannelCodeFromChannel(
                        qcSegment.getData().get().getChannel())
                    .equals(QcSegmentUtility.getChannelStaChanPair(qcDaoObject)))
        .filter(qcSegment -> segmentVersionsAndDaoOverlap(qcSegment, qcDaoObject))
        .toList();
  }

  /**
   * Checks if the timerange of a QcSegment's last version overlaps with the QcDao time range
   *
   * @param qcSegment
   * @param qcDaoObject
   * @return boolean of overlap
   */
  private static boolean segmentVersionsAndDaoOverlap(
      QcSegment qcSegment, QcDaoObject qcDaoObject) {

    Optional<Data> qcSegmentData = qcSegment.getData();

    if (qcSegmentData.isPresent()) {

      Optional<QcSegmentVersion.Data> qcSegmentVersionData =
          qcSegmentData.get().getVersionHistory().last().getData();

      if (qcSegmentVersionData.isPresent()) {
        var qcDaoEnd = QcSegmentUtility.getQcDaoEndTime(qcDaoObject);
        var qcDaoStart = QcSegmentUtility.getQcDaoStartTime(qcDaoObject);
        var segmentEnd = qcSegmentVersionData.get().getEndTime();
        var segmentStart = qcSegmentVersionData.get().getStartTime();

        return qcDaoStart.isBefore(segmentEnd) && segmentStart.isBefore(qcDaoEnd);
      }
    }

    return false;
  }

  /**
   * Tests if qcDaoObject's range encloses qcSegments latest version's range
   *
   * @param qcDaoObject {@link QcDaoObject}
   * @param qcSegment {@link QcSegment}
   * @return boolean of enclosing
   */
  private static boolean qcDaoObjectEnclosesSegment(QcDaoObject qcDaoObject, QcSegment qcSegment) {

    var qcDaoRange = QcSegmentUtility.getQcDaoTimeRange(qcDaoObject);
    var segmentRange = QcSegmentUtility.getQcSegmentTimeRange(qcSegment);

    return qcDaoRange.encloses(segmentRange);
  }

  /**
   * Tests if qcDaoObject's range equals qcSegments latest version's range
   *
   * @param qcDaoObject {@link QcDaoObject}
   * @param qcSegment {@link QcSegment}
   * @return boolean
   */
  private static boolean qcDaoObjectAndSegmentRangeEqual(
      QcDaoObject qcDaoObject, QcSegment qcSegment) {

    var qcDaoRange = QcSegmentUtility.getQcDaoTimeRange(qcDaoObject);
    var segmentRange = QcSegmentUtility.getQcSegmentTimeRange(qcSegment);

    return qcDaoRange.lowerEndpoint().equals(segmentRange.lowerEndpoint())
        && qcDaoRange.upperEndpoint().equals(segmentRange.upperEndpoint());
  }

  /**
   * Determine if range is long enough to qualify as a gap to create a new qc segment
   *
   * @param range f {@link Range<Instant>}
   * @param qcDaoObjects {@link List<QcDaoObject>} from the connectors
   * @return {@link boolean}
   */
  private static boolean isActualGap(Range<Instant> range) {
    return Duration.between(range.lowerEndpoint(), range.upperEndpoint())
            .compareTo(MIN_TIME_DURATION)
        > 0;
  }
}
