package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.waveform.qc.coi.QcData;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Generates Canned Qc Data */
@Service
public class QcDataGenerator {

  private static final Logger LOGGER = LoggerFactory.getLogger(QcDataGenerator.class);
  private static final double DELTA = 0.00001;
  private static final Instant offsetTimeSeconds = Instant.ofEpochSecond(1_546_704_000);

  private ArrayList<QcConversionData> qcMapping;

  public QcDataGenerator() {
    if (qcMapping == null || qcMapping.isEmpty()) {
      qcMapping = buildData();
    }
  }

  /**
   * Shifts the provided myTime + offset value from baseTime to newBaseTime, maintaining the
   * duration interval during the shift
   *
   * @param shiftTimeFloor The time reference point serving as the established start for all
   *     records.
   * @param inputDataTime The input data time to shift. The shift will be the duration between
   *     shiftTimeFloor and this and
   * @param sampleNum Sample number value to apply to offset calculation
   * @param sampleRate Sample rate value to apply to offset calculation
   * @param myTime The configured interval to reset as the new floor
   * @return Updated Instant with shifted time
   */
  protected static Instant timeShift(
      Instant shiftTimeFloor,
      Instant inputDataTime,
      double sampleNum,
      double sampleRate,
      Instant myTime) {

    var durationAfterMyTime = Duration.between(shiftTimeFloor, inputDataTime);

    myTime = myTime.plusNanos(durationAfterMyTime.toNanos());

    var offsetModifier = (long) ((sampleNum) / (sampleRate) * 1_000_000_000L);
    myTime = myTime.plusNanos(offsetModifier);

    return myTime;
  }

  /**
   * Create the Channel Name from the associated {@link QcData}
   *
   * @param data {@link QcData} containing the data necessary to generate the channel name.
   * @return The channel name from the canned {@link QcData}
   */
  private static String createChannelName(QcData data) {
    return data.getSta() + "." + data.getChan();
  }

  /**
   * Creates canned data for the QcSegment canned data endpoint
   *
   * @param data QcSegment data values needed to create a QcSegment.
   * @param originTime The new floor time used to offset all startTimes.
   * @param extraVersions number of additional versions beyond the initial default of 1.
   * @return QcSegment with shifted time interval with 1 or more version
   */
  public QcSegment createCannedQcSegmentWithVersions(
      QcData data, Instant originTime, int extraVersions) {

    var channelName = createChannelName(data);
    LOGGER.debug(
        "Creating QcCannedData for - Channel: {} StartTime: {} Extra Versions: {}",
        channelName,
        data.getStartTime(),
        extraVersions);

    if (Math.abs(data.getSampRate()) < DELTA) {
      throw new IllegalArgumentException("Qc sample rate must not be 0");
    }

    var id =
        Arrays.toString(Long.toString(data.getQcmaskid()).getBytes())
            + Arrays.toString(Integer.toString(data.getStartSample()).getBytes());
    var uuid = UUID.nameUUIDFromBytes(id.getBytes());

    var versionedSet = new TreeSet<>(createVersions(data, originTime, extraVersions));
    if (versionedSet.size() != (extraVersions + 1)) {
      LOGGER.warn("Invalid version set size.");
    }

    var qcSegmentData =
        QcSegment.Data.instanceBuilder()
            .setChannel(Channel.createEntityReference(channelName))
            .setVersionHistory(versionedSet)
            .build();

    return QcSegment.instanceBuilder().setId(uuid).setData(qcSegmentData).build();
  }

  /**
   * The method will create 1 or more versions of the
   *
   * @param data QcSegment data values needed to create a QcSegment.
   * @param originTime The new floor time used to offset all startTimes.
   * @param extraVersions number of versions beyond the original, if provided a number less than 0,
   *     it will default 0
   * @return QcSegment with shifted time interval with 1 or more version
   */
  public Set<QcSegmentVersion> createVersions(QcData data, Instant originTime, int extraVersions) {
    if (extraVersions < 0) {
      extraVersions = 0;
    }

    var versionSet = new HashSet<QcSegmentVersion>();
    for (var offsetShift = 0; offsetShift <= extraVersions; offsetShift++) {
      var startTime =
          timeShift(
              offsetTimeSeconds,
              data.getStartTime(),
              (double) data.getStartSample() + offsetShift,
              data.getSampRate(),
              originTime);

      var endTimeRef = data.getStartTime();
      // Use exact end time if endsample is 0
      if (data.getEndSample() == 0) {
        endTimeRef = data.getEndTime();
      }
      var endTime =
          timeShift(
              offsetTimeSeconds, endTimeRef, data.getEndSample(), data.getSampRate(), originTime);

      var mappedEntry =
          qcMapping.stream()
              .filter(id -> Integer.toString(data.getMaskType()).equals(id.getMapping()))
              .findFirst()
              .orElseThrow(
                  () ->
                      new IllegalStateException(
                          "Missing mapping type for mask: " + data.getMaskType()));

      var isRejected = false;
      if ("300".equals(mappedEntry.mapping)) {
        isRejected = true;
      }

      Optional<QcSegmentCategory> category = mappedEntry.getCategory();
      Optional<QcSegmentType> type = mappedEntry.getType();

      var id =
          Arrays.toString(Long.toString(data.getQcmaskid()).getBytes())
              + Arrays.toString(Integer.toString(data.getStartSample()).getBytes());
      var uuid = UUID.nameUUIDFromBytes(id.getBytes());
      var qcSegmentVersionId =
          QcSegmentVersionId.instanceBuilder()
              // canned data using end time instead of lddate and shift if multiple versions used
              .setEffectiveAt(endTime.plusNanos(offsetShift))
              .setParentQcSegmentId(uuid)
              .build();

      var channelName = createChannelName(data);
      var channelEffectiveTime = data.getStartTime();
      var versionData =
          QcSegmentVersion.Data.instanceBuilder()
              .setCreatedBy(data.getCreatedBy())
              .setChannels(
                  List.of(Channel.createVersionReference(channelName, channelEffectiveTime)))
              .setStartTime(startTime)
              .setEndTime(endTime)
              .setCategory(category.isPresent() ? category.get() : null)
              .setType(type.isPresent() ? type.get() : null)
              .setDiscoveredOn(List.of())
              .setRejected(isRejected)
              .setRationale("N/A (bridged)")
              .build();

      var versionHistory =
          QcSegmentVersion.instanceBuilder().setId(qcSegmentVersionId).setData(versionData).build();
      versionSet.add(versionHistory);
    }

    return versionSet;
  }

  protected static final ArrayList<QcConversionData> buildData() {

    var qcConversionData = new ArrayList<QcConversionData>();

    qcConversionData.add(new QcConversionData("0", null, QcSegmentCategory.UNPROCESSED));
    qcConversionData.add(new QcConversionData("10", QcSegmentType.GAP, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("20", QcSegmentType.FLAT, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("30", QcSegmentType.NOISY, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("40", QcSegmentType.SPIKE, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("50", QcSegmentType.SPIKE, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("60", QcSegmentType.SPIKE, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("70", QcSegmentType.SPIKE, QcSegmentCategory.WAVEFORM));
    qcConversionData.add(
        new QcConversionData("100", QcSegmentType.AGGREGATE, QcSegmentCategory.WAVEFORM));

    qcConversionData.add(new QcConversionData("200", null, QcSegmentCategory.LONG_TERM));
    qcConversionData.add(new QcConversionData("300", null, null));
    qcConversionData.add(new QcConversionData("400", null, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("500", QcSegmentType.CALIBRATION, QcSegmentCategory.STATION_SOH));

    // rework 600 use case in future
    qcConversionData.add(new QcConversionData("600", null, QcSegmentCategory.DATA_AUTHENTICATION));

    qcConversionData.add(
        new QcConversionData("2000", QcSegmentType.AGGREGATE, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2010", QcSegmentType.CALIBRATION, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2020", QcSegmentType.FLAT, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2030", QcSegmentType.GAP, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2040", QcSegmentType.NOISY, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData(
            "2050", QcSegmentType.SENSOR_PROBLEM, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2060", QcSegmentType.SPIKE, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData(
            "2070", QcSegmentType.STATION_PROBLEM, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData(
            "2080", QcSegmentType.STATION_SECURITY, QcSegmentCategory.ANALYST_DEFINED));
    qcConversionData.add(
        new QcConversionData("2090", QcSegmentType.TIMING, QcSegmentCategory.ANALYST_DEFINED));

    qcConversionData.add(
        new QcConversionData("3000", QcSegmentType.NOISY, QcSegmentCategory.STATION_SOH));
    qcConversionData.add(
        new QcConversionData("3010", QcSegmentType.SENSOR_PROBLEM, QcSegmentCategory.STATION_SOH));
    qcConversionData.add(
        new QcConversionData("3020", QcSegmentType.STATION_PROBLEM, QcSegmentCategory.STATION_SOH));
    qcConversionData.add(
        new QcConversionData(
            "3030", QcSegmentType.STATION_SECURITY, QcSegmentCategory.STATION_SOH));
    qcConversionData.add(
        new QcConversionData("3040", QcSegmentType.TIMING, QcSegmentCategory.STATION_SOH));

    return qcConversionData;
  }

  private static class QcConversionData {

    private String mapping;
    private Optional<QcSegmentType> type;
    private Optional<QcSegmentCategory> category;

    public QcConversionData(String mapping, QcSegmentType type, QcSegmentCategory category) {
      this.mapping = mapping;
      this.type = Optional.ofNullable(type);
      this.category = Optional.ofNullable(category);
    }

    public String getMapping() {
      return mapping;
    }

    public void setMapping(String mapping) {
      this.mapping = mapping;
    }

    public Optional<QcSegmentType> getType() {
      return type;
    }

    public void setType(QcSegmentType type) {
      this.type = Optional.ofNullable(type);
    }

    public Optional<QcSegmentCategory> getCategory() {
      return category;
    }

    public void setCategory(QcSegmentCategory category) {
      this.category = Optional.ofNullable(category);
    }
  }
}
