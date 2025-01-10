package gms.shared.waveform.qc.mask.converter;

import com.google.common.collect.ImmutableMap;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import gms.shared.waveform.qc.mask.util.QcSegmentUtility;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/**
 * BridgedQcSegmentConverter for converting qc mask daos to qc dao objects, qc segment versions and
 * qc segment coi objects
 */
@Component("bridgedQcSegmentConverter")
public class BridgedQcSegmentConverter implements QcSegmentConverter {

  // list of objects cannot be null or empty
  static final String NULL_QC_MASK_INFO_DAOS = "QcMaskInfoDaos cannot be null";
  static final String NULL_QC_MASK_SEG_DAOS = "QcMaskSegDaos cannot be null";
  static final String NULL_QC_DAO_OBJECTS = "QcDaoObject cannot be null";
  static final String EMPTY_QC_MASK_INFO_DAOS = "QcMaskInfoDaos cannot be empty";
  static final String EMPTY_QC_MASK_SEG_DAOS = "QcMaskSegDaos cannot be empty";
  static final String EMPTY_QC_DAO_OBJECTS = "QcDaoObject cannot be empty";

  // single objects cann be null or blank
  static final String BLANK_CHANNEL = "Channel cannot be null or empty";
  static final String BLANK_STATION = "Station cannot be null or empty";
  static final String NULL_START_TIME = "Start time cannot be null";
  static final String NULL_END_TIME = "End time cannot be null";
  static final String NAN_SAMPLE_RATE = "Sample rate cannot be NaN";
  static final String BLANK_AUTHOR = "Author cannot be null or empty";
  static final String NULL_LOAD_DATE = "Load date cannot be null";
  static final String NULL_QC_MASK_SEG_KEY = "Qc mask seg key cannot be null";
  static final String NULL_QC_SEG_ID = "The qc segment parent id cannot be null";

  static final int MAX_TIME_DURATION_IN_SECONDS = 7200;
  private final StationDefinitionAccessor stationDefinitionAccessor;
  private final Map<QcMaskType, Pair<QcSegmentCategory, QcSegmentType>> qcSegmentCategoryTypeMap;

  @Autowired
  public BridgedQcSegmentConverter(
      @Qualifier("defaultStationDefinitionAccessor") StationDefinitionAccessor stationDefinitionAccessor) {
    this.stationDefinitionAccessor = stationDefinitionAccessor;
    this.qcSegmentCategoryTypeMap = createQcSegmentCategoryTypeMap();
  }

  @Override
  public List<QcDaoObject> convertQcMaskDaosToQcDaoObjects(
      Collection<QcMaskInfoDao> qcMaskInfoDaos, Collection<QcMaskSegDao> qcMaskSegDaos) {

    Validate.notNull(qcMaskInfoDaos, NULL_QC_MASK_INFO_DAOS);
    Validate.notNull(qcMaskSegDaos, NULL_QC_MASK_SEG_DAOS);
    Validate.notEmpty(qcMaskInfoDaos, EMPTY_QC_MASK_INFO_DAOS);
    Validate.notEmpty(qcMaskSegDaos, EMPTY_QC_MASK_SEG_DAOS);
    validateNotNullQcMaskSegKey(qcMaskSegDaos, NULL_QC_MASK_SEG_KEY);

    return qcMaskInfoDaos.stream()
        .flatMap(
            qcMaskInfoDao ->
                qcMaskSegDaos.stream()
                    .filter(
                        qcMaskSegDao ->
                            qcMaskInfoDao.getQcMaskId()
                                == qcMaskSegDao.getQcMaskSegKey().getQcMaskId())
                    .map(qcMaskSegDao -> convertLegacyDaos(qcMaskInfoDao, qcMaskSegDao))
                    .flatMap(qcDaoObject -> splitQcDaoObjects(qcDaoObject).stream())
                    .distinct())
        .toList();
  }

  @Override
  public List<QcSegment> convertQcDaoObjectsToQcSegments(Collection<QcDaoObject> qcDaoObjects) {
    Validate.notNull(qcDaoObjects, NULL_QC_DAO_OBJECTS);
    Validate.notEmpty(qcDaoObjects, EMPTY_QC_DAO_OBJECTS);

    var uuid = UUID.randomUUID();

    return qcDaoObjects.stream()
        .flatMap(
            qcDaoObject ->
                splitQcDaoObjects(qcDaoObject).stream()
                    .map(
                        qcDaoObjectPartition ->
                            QcSegment.instanceBuilder()
                                .setId(uuid)
                                .setData(createQcSegmentData(uuid, qcDaoObjectPartition))
                                .build())
                    .distinct())
        .toList();
  }

  @Override
  public List<QcSegmentVersion> convertQcDaoObjectsToQcSegmentVersions(
      UUID parentQcSegmentId, Collection<QcDaoObject> qcDaoObjects) {
    Validate.notNull(parentQcSegmentId, NULL_QC_SEG_ID);
    Validate.notNull(qcDaoObjects, NULL_QC_DAO_OBJECTS);
    Validate.notEmpty(qcDaoObjects, EMPTY_QC_DAO_OBJECTS);

    // create stream of qc dao objects to qc segment versions
    return qcDaoObjects.stream()
        .map(qcDaoObject -> convertToQcSegmentVersion(parentQcSegmentId, qcDaoObject))
        .toList();
  }

  /**
   * Create QcSegment with QcSegmentVersion time set to startTime and endTime and qcDaoObject used
   * to fill all other information
   *
   * @param qcDaoObject {@link QcDaoObject}
   * @param startTime {@link Instant}
   * @param endTime {@link Instant}
   * @return {@link QcSegment}
   */
  public QcSegment convertQcDaoObjectToQcSegment(
      QcDaoObject qcDaoObject, Instant startTime, Instant endTime) {

    var uuid = UUID.randomUUID();
    return QcSegment.instanceBuilder()
        .setId(uuid)
        .setData(createQcSegmentData(uuid, qcDaoObject, startTime, endTime))
        .build();
  }

  /**
   * Update qcSegment with QcSegmentVersion from qcDao
   *
   * @param qcSegment {@link QcSegment}
   * @param qcDao {@link QcDaoObject}
   * @return {@link QcSegment}
   */
  public QcSegment updateQcSegment(QcSegment qcSegment, QcDaoObject qcDao) {

    var dataOptional = qcSegment.getData();
    if (dataOptional.isPresent()) {
      var data = dataOptional.get();
      var segmentVersion = convertToQcSegmentVersion(qcSegment.getId(), qcDao);
      var history = data.getVersionHistory();
      if (!history.contains(segmentVersion)) {
        history.add(segmentVersion);
      }
    }

    return qcSegment;
  }

  /**
   * Create QcSegment.Data object to be used in the QcSegment object
   *
   * @param qcDaoObject input {@link QcDaoObject}
   * @param qcSegmentVersion nested {@link QcSegmentVersion}
   * @return {@link QcSegment.Data}
   */
  private QcSegment.Data createQcSegmentData(UUID parentUUID, QcDaoObject qcDaoObject) {

    var startTime = QcSegmentUtility.getQcDaoStartTime(qcDaoObject);
    var endTime = QcSegmentUtility.getQcDaoEndTime(qcDaoObject);
    return createQcSegmentData(parentUUID, qcDaoObject, startTime, endTime);
  }

  /**
   * Create QcSegment.Data object to be used in the QcSegment object with updated start and end
   * times
   *
   * @param parentUUID - qc segment parent uuid
   * @param qcDaoObject input {@link QcDaoObject}
   * @param startTime - updated start time for qc seg version
   * @param endTime - updated end time for qc seg version
   * @return {@link QcSegment.Data}
   */
  private QcSegment.Data createQcSegmentData(
      UUID parentUUID, QcDaoObject qcDaoObject, Instant startTime, Instant endTime) {

    // the channel query does not work if startTime == endTime
    var queryEnd = startTime.equals(endTime) ? endTime.plusSeconds(1) : endTime;

    // Channel entity reference object using sta/chan codes
    var channel =
        StationDefinitionIdUtility.getChannelEntityForRefStaChan(
            qcDaoObject.getStation(), qcDaoObject.getStation(), qcDaoObject.getChannel());

    // query for raw channels using station def accessor
    var rawChannels =
        stationDefinitionAccessor.findChannelsByNameAndTimeRange(
            List.of(channel.getName()), startTime, queryEnd);

    if (!rawChannels.isEmpty()) {
      channel = rawChannels.get(0).toEntityReference();
    }

    // convert the qc dao object to qc segment version object
    var qcSegmentVersion = convertToQcSegmentVersion(parentUUID, qcDaoObject, startTime, endTime);

    return QcSegment.Data.instanceBuilder()
        .setChannel(channel)
        .setVersionHistory(new TreeSet<>(Set.of(qcSegmentVersion)))
        .build();
  }

  /**
   * Convert given {@link QcDaoObject} to a {@link QcSegmentVersion}
   *
   * @param qcDaoObject input {@link QcDaoObject}
   * @return {@link QcSegmentVersion}
   */
  private QcSegmentVersion convertToQcSegmentVersion(
      UUID parentQcSegmentId, QcDaoObject qcDaoObject) {

    // get/set qc segment version data params using qc dao object
    var startTime = QcSegmentUtility.getQcDaoStartTime(qcDaoObject);
    var endTime = QcSegmentUtility.getQcDaoEndTime(qcDaoObject);

    return convertToQcSegmentVersion(parentQcSegmentId, qcDaoObject, startTime, endTime);
  }

  private QcSegmentVersion convertToQcSegmentVersion(
      UUID parentQcSegmentId, QcDaoObject qcDaoObject, Instant startTime, Instant endTime) {

    // the channel query does not work if startTime == endTime
    var queryEnd = startTime.equals(endTime) ? endTime.plusSeconds(1) : endTime;

    // create version id from parent and load date
    var versionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(qcDaoObject.getLoadDate())
            .setParentQcSegmentId(parentQcSegmentId)
            .build();
    var sta = qcDaoObject.getStation();
    var chan = qcDaoObject.getChannel();

    var createdBy = qcDaoObject.getAuthor();
    var rejected = qcDaoObject.getMaskType() == QcMaskType.ANALYST_DELETED;
    var rationale = "N/A (bridged)";

    // Channel entity reference object using sta/chan codes
    var channel = StationDefinitionIdUtility.getChannelEntityForRefStaChan(sta, sta, chan);

    // query for raw channels using station def accessor
    var rawChannels =
        stationDefinitionAccessor
            .findChannelsByNameAndTimeRange(List.of(channel.getName()), startTime, queryEnd)
            .stream()
            .map(Channel::createVersionReference)
            .toList();

    // create the category and type based on qc mask seg masktype
    Pair<QcSegmentCategory, QcSegmentType> categoryAndType =
        qcSegmentCategoryTypeMap.get(qcDaoObject.getMaskType());
    QcSegmentCategory category = categoryAndType.getLeft();
    QcSegmentType type = categoryAndType.getRight();

    // create the qc segment version data
    var qcSegmentVersionData =
        QcSegmentVersion.Data.instanceBuilder()
            .setChannels(rawChannels)
            .setCategory(category)
            .setType(type)
            .setStartTime(startTime)
            .setEndTime(endTime)
            .setCreatedBy(createdBy)
            .setRejected(rejected)
            .setRationale(rationale)
            .setDiscoveredOn(List.of())
            .build();

    // create the main qcSegmentVersion
    return QcSegmentVersion.instanceBuilder()
        .setId(versionId)
        .setData(qcSegmentVersionData)
        .build();
  }

  /**
   * Split QcDaoObject into intervals less than max time
   *
   * @param qcDaoObject input {@link QcDaoObject}
   * @return {@link List<QcDaoObject>}
   */
  private static List<QcDaoObject> splitQcDaoObjects(QcDaoObject qcDaoObject) {
    var startSamp = qcDaoObject.getStartSample();
    var endSamp = qcDaoObject.getEndSample();

    var seconds = (long) Math.ceil((endSamp - startSamp) / qcDaoObject.getSampleRate());

    var timeElapsed = Duration.ofSeconds(seconds);

    if (timeElapsed.getSeconds() > MAX_TIME_DURATION_IN_SECONDS) {

      var numberOfPartitions =
          (long) Math.ceil((double) timeElapsed.getSeconds() / MAX_TIME_DURATION_IN_SECONDS);
      var samplesPer = (endSamp - startSamp) / numberOfPartitions;
      var rem = (endSamp - startSamp + 1) % numberOfPartitions;
      List<QcDaoObject> partitionedQcDaos = new ArrayList<>();

      var start = startSamp;
      long end;
      for (var i = 0; i < numberOfPartitions; i++) {

        end = start + samplesPer - 1;
        if (rem > 0) {
          end += 1;
          rem--;
        }

        var copyDao = new QcDaoObject(qcDaoObject);
        copyDao.setStartSample(start);
        copyDao.setEndSample(end);
        partitionedQcDaos.add(copyDao);
        start = end + 1;
      }

      return partitionedQcDaos;
    }

    return List.of(qcDaoObject);
  }

  /**
   * Convert QcMask legacy daos to a single QcDaoObject
   *
   * @param qcMaskInfoDao single {@link QcMaskInfoDao}
   * @param qcMaskSegDao single {@link QcMaskSegDao}
   * @return QcDaoObject to be used for converting to COIs
   */
  private static QcDaoObject convertLegacyDaos(
      QcMaskInfoDao qcMaskInfoDao, QcMaskSegDao qcMaskSegDao) {
    Validate.notBlank(qcMaskInfoDao.getChannel(), BLANK_CHANNEL);
    Validate.notBlank(qcMaskInfoDao.getStation(), BLANK_STATION);
    Validate.notNull(qcMaskInfoDao.getStartTime(), NULL_START_TIME);
    Validate.notNull(qcMaskInfoDao.getEndTime(), NULL_END_TIME);
    Validate.notNaN(qcMaskInfoDao.getSampleRate(), NAN_SAMPLE_RATE);
    Validate.notBlank(qcMaskSegDao.getAuthor(), BLANK_AUTHOR);
    Validate.notNull(qcMaskSegDao.getLoadDate(), NULL_LOAD_DATE);

    var qcDaoObject = new QcDaoObject();
    qcDaoObject.setChannel(qcMaskInfoDao.getChannel());
    qcDaoObject.setStation(qcMaskInfoDao.getStation());
    qcDaoObject.setStartTime(qcMaskInfoDao.getStartTime());
    qcDaoObject.setEndTime(qcMaskInfoDao.getEndTime());
    qcDaoObject.setSampleRate(qcMaskInfoDao.getSampleRate());
    qcDaoObject.setQcMaskId(qcMaskInfoDao.getQcMaskId());

    qcDaoObject.setStartSample(qcMaskSegDao.getQcMaskSegKey().getStartSample());
    qcDaoObject.setEndSample(qcMaskSegDao.getEndSample());
    qcDaoObject.setMaskType(qcMaskSegDao.getMaskType());
    qcDaoObject.setAuthor(qcMaskSegDao.getAuthor());
    qcDaoObject.setLoadDate(qcMaskSegDao.getLoadDate());

    return qcDaoObject;
  }

  private static void validateNotNullQcMaskSegKey(
      Collection<QcMaskSegDao> qcMaskSegDaos, String message) {
    qcMaskSegDaos.stream()
        .forEach(qcmaskSegDao -> Validate.notNull(qcmaskSegDao.getQcMaskSegKey(), message));
  }

  public QcSegmentType getSegmentTypeOfDao(QcDaoObject qcDaoObject) {
    return qcSegmentCategoryTypeMap.get(qcDaoObject.getMaskType()).getRight();
  }

  /**
   * Create QcSegmentCategoryType map that maps ids to category and type
   *
   * @return map of ids to QcSegmentCategoryAndType
   */
  private static Map<QcMaskType, Pair<QcSegmentCategory, QcSegmentType>>
      createQcSegmentCategoryTypeMap() {
    return ImmutableMap.<QcMaskType, Pair<QcSegmentCategory, QcSegmentType>>builder()
        .put(QcMaskType.UNPROCESSED, Pair.of(QcSegmentCategory.UNPROCESSED, null))
        .put(QcMaskType.MISSING, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.GAP))
        .put(QcMaskType.FLAT, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.FLAT))
        .put(QcMaskType.NOISY, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY))
        .put(QcMaskType.BAD_SINGLE_POINT, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE))
        .put(
            QcMaskType.MULTIPLE_DATA_SPIKE,
            Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE))
        .put(QcMaskType.SINGLE_DATA_SPIKE, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE))
        .put(QcMaskType.TOS_SPIKE, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.SPIKE))
        .put(QcMaskType.AGGREGATE, Pair.of(QcSegmentCategory.WAVEFORM, QcSegmentType.AGGREGATE))
        .put(QcMaskType.CHANNEL, Pair.of(QcSegmentCategory.LONG_TERM, null))
        .put(QcMaskType.ANALYST_DELETED, Pair.of(null, null))
        .put(QcMaskType.ANALYST, Pair.of(QcSegmentCategory.ANALYST_DEFINED, null))
        .put(
            QcMaskType.CALIBRATION,
            Pair.of(QcSegmentCategory.STATION_SOH, QcSegmentType.CALIBRATION))
        .build();
  }
}
