package gms.shared.waveform.qc.mask.util;

import com.google.common.collect.Range;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.mask.converter.QcDaoObject;
import java.time.Instant;

/**
 * Qc segment utility for performing operations on QcDaoObjects, QcSegments and QcSegmentVersions
 */
public final class QcSegmentUtility {

  private static final String COI_ID_STRING_DELIMITER = ".";

  private QcSegmentUtility() {}

  /**
   * Get closed range (start and end time inclusive) from qcDaoObject
   *
   * @param qcDaoObject {@link QcDaoObject}
   * @return {@link Range<Instant>}
   */
  public static Range<Instant> getQcDaoTimeRange(QcDaoObject qcDaoObject) {
    var qcDaoEnd = QcSegmentUtility.getQcDaoEndTime(qcDaoObject);
    var qcDaoStart = QcSegmentUtility.getQcDaoStartTime(qcDaoObject);
    return Range.closed(qcDaoStart, qcDaoEnd);
  }

  /**
   * Get closed range (start and end time inclusive) from qcSegment. Open range is used when
   * removing range from range map if data not present, return open range of Instant.MIN
   *
   * @param qcSegment {@link QcSegment}
   * @return {@link Range<Instant>}
   */
  public static Range<Instant> getQcSegmentTimeRange(QcSegment qcSegment) {

    // we only care about current segment version, which is the last in version history
    var start =
        qcSegment
            .getData()
            .flatMap(data -> data.getVersionHistory().last().getData())
            .map(QcSegmentVersion.Data::getStartTime)
            .orElse(Instant.MIN);

    var end =
        qcSegment
            .getData()
            .flatMap(data -> data.getVersionHistory().last().getData())
            .map(QcSegmentVersion.Data::getEndTime)
            .orElse(Instant.MIN);

    return Range.closed(start, end);
  }

  /**
   * Get the start time using {@link QcDaoObject} params
   *
   * @param qcDaoObject {@link QcDaoObject} for time params
   * @return startTime instant
   */
  public static Instant getQcDaoStartTime(QcDaoObject qcDaoObject) {
    var startEpoch = qcDaoObject.getStartTime().getEpochSecond();
    var startTimeSeconds = startEpoch + qcDaoObject.getStartSample() / qcDaoObject.getSampleRate();
    return new NegativeNaInstantToDoubleConverter().convertToEntityAttribute(startTimeSeconds);
  }

  /**
   * Get the end time using {@link QcDaoObject} params
   *
   * @param qcDaoObject {@link QcDaoObject} for time params
   * @return startTime instant
   */
  public static Instant getQcDaoEndTime(QcDaoObject qcDaoObject) {
    var endEpoch = qcDaoObject.getStartTime().getEpochSecond();
    var endTimeSeconds = endEpoch + qcDaoObject.getEndSample() / qcDaoObject.getSampleRate();
    return new NegativeNaInstantToDoubleConverter().convertToEntityAttribute(endTimeSeconds);
  }

  /**
   * Create channel name from a single {@link QcDaoObject}
   *
   * @param qcDaoObject single {@link QcDaoObject}
   * @return channel name
   */
  public static String createChannelName(QcDaoObject qcDaoObject) {
    return qcDaoObject.getStation()
        + COI_ID_STRING_DELIMITER
        + qcDaoObject.getStation()
        + COI_ID_STRING_DELIMITER
        + qcDaoObject.getChannel();
  }

  /**
   * Create sta.chan pair from a single {@link QcDaoObject}
   *
   * @param qcDaoObject single {@link QcDaoObject}
   * @return sta.chan name
   */
  public static String getChannelStaChanPair(QcDaoObject qcDaoObject) {
    return StationDefinitionIdUtility.createStationChannelCode(
        qcDaoObject.getStation(), qcDaoObject.getChannel());
  }

  /**
   * Create a string that uniquely identifies a {@link QcDaoObject}
   *
   * @param qcDaoObject single {@link QcDaoObject}
   * @return QCMASKID.STARTSAMPLE
   */
  public static String getUniqueKeyForQcDao(QcDaoObject qcDao) {

    return qcDao.getQcMaskId() + COI_ID_STRING_DELIMITER + qcDao.getStartSample();
  }
}
