package gms.shared.waveform.testfixture;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

/** Holds constants used for unit testing */
public final class QcSegmentTestFixtures {

  public static final String UUID_STRING = "505c377a-b6a4-478f-b3cd-5c934ee6b876";
  public static final String UUID_STRING_TWO = "575c377a-b6a4-478f-b3cd-5c934ee6b876";

  public static final UUID ID_UUID = UUID.fromString(UUID_STRING);
  public static final UUID ID_UUID_TWO = UUID.fromString(UUID_STRING_TWO);

  public static final Channel CHANNEL_ONE =
      ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
  public static final Channel CHANNEL_TWO =
      ChannelSegmentTestFixtures.getTestChannel("TEST.TEST2.BHN");

  public static final String DEFAULT_STATION_STRING = "TEST1";

  public static final String DEFAULT_CHANNEL_STRING = "BHZ";

  public static final QcSegmentCategory DEFAULT_QC_SEGMENT_CATEGORY = QcSegmentCategory.WAVEFORM;

  public static final QcSegmentType DEFAULT_SEGMENT_TYPE = QcSegmentType.SPIKE;

  public static final QcMaskType DEFAULT_MASK_TYPE = QcMaskType.MULTIPLE_DATA_SPIKE;

  public static final String DEFAULT_AUTHOR = "al2:user4";

  public static final Instant DEFAULT_START = Instant.parse("2000-02-21T05:59:35.680Z");

  public static final Instant DEFAULT_END = Instant.parse("2000-02-22T05:59:35.680Z");

  public static final ChannelSegment<Waveform> CHANNEL_SEGMENT =
      ChannelSegmentTestFixtures.createChannelSegment(
          CHANNEL_ONE, List.of(WaveformTestFixtures.WAVEFORM_1));

  public static final QcSegmentVersionId QCSEG_VERSIONID_ONE =
      QcSegmentVersionId.instanceBuilder()
          .setEffectiveAt(Instant.MIN)
          .setParentQcSegmentId(ID_UUID)
          .build();

  public static final QcSegmentVersion QCSEG_VERSION_ONE =
      QcSegmentVersion.instanceBuilder()
          .setId(QCSEG_VERSIONID_ONE)
          .setData(
              QcSegmentVersion.Data.instanceBuilder()
                  .setStageId(WorkflowDefinitionId.from("My Workflow"))
                  .setChannels(List.of(CHANNEL_ONE))
                  .setDiscoveredOn(List.of(CHANNEL_SEGMENT))
                  .setCreatedBy("The Creator")
                  .setRationale("Seemed like a good idea")
                  .setStartTime(Instant.MIN)
                  .setEndTime(Instant.MIN.plusSeconds(1))
                  .setRejected(false)
                  .setCategory(QcSegmentCategory.WAVEFORM)
                  .setType(QcSegmentType.FLAT)
                  .build())
          .build();

  private QcSegmentTestFixtures() {
    // private default constructor to hide implicit public one.
  }

  /**
   * Returns a {@link QcSegmentVersion} that has test channel "TEST.TEST1.BHZ", category {@link
   * QcSegmentCategory.WAVEFORM}, and type {@link QcSegmentType.FLAT}, with a user-defined UUID,
   * duration, and start time. The effective time is set to the start time.
   *
   * @param duration the duration of the segment in seconds
   * @param timeOffset the number of seconds after Instant.MIN that the segment starts
   * @param uuid the UUID for the {@link QcSegmentVersion}
   * @return the QcSegmentVersion
   */
  public static QcSegmentVersion getQcSegmentVersion(long duration, long timeOffset, UUID uuid) {

    return getQcSegmentVersion(duration, timeOffset, CHANNEL_ONE, uuid);
  }

  /**
   * Returns a {@link QcSegmentVersion} that has category {@link QcSegmentCategory.WAVEFORM} and
   * type {@link QcSegmentType.FLAT}, with a user-defined UUID, channel, duration, and start
   * time.The effective time is set to the start time.
   *
   * @param duration the duration of the segment in seconds
   * @param timeOffset the number of seconds after Instant.MIN that the segment starts
   * @param channel the {@link Channel} for the {@link QcSegmentVersion}
   * @param uuid the UUID for the {@link QcSegmentVersion}
   * @return the QcSegmentVersion
   */
  public static QcSegmentVersion getQcSegmentVersion(
      long duration, long timeOffset, Channel channel, UUID uuid) {

    return getQcSegmentVersion(
        duration, timeOffset, channel, QcSegmentCategory.WAVEFORM, QcSegmentType.FLAT, uuid);
  }

  /**
   * Returns a {@link QcSegmentVersion} that has category {@link QcSegmentCategory.WAVEFORM} and
   * test channel "TEST.TEST1.BHZ", with a user-defined UUID, category, type, duration, and start
   * time. The effective time is set to the start time.
   *
   * @param duration the duration of the segment in seconds
   * @param timeOffset the number of seconds after Instant.MIN that the segment starts
   * @param category the {@link QcSegementCategory} for the {@link QcSegementVersion}
   * @param type the {@link QcSegmentType} for the {@link QcSegmentVersion}
   * @param uuid the UUID for the {@link QcSegmentVersion}
   * @return the QcSegmentVersion
   */
  public static QcSegmentVersion getQcSegmentVersion(
      long duration, long timeOffset, QcSegmentCategory category, QcSegmentType type, UUID uuid) {

    return getQcSegmentVersion(duration, timeOffset, CHANNEL_ONE, category, type, uuid);
  }

  /**
   * Returns a {@link QcSegmentVersion} with a user-defined UUID, channel, waveform category, type,
   * duration, and start time. The effective time is set to the start time.
   *
   * @param duration the duration of the segment in seconds
   * @param timeOffset the number of seconds after Instant.MIN that the segment starts
   * @param channel the {@link Channel} for the {@link QcSegmentVersion}
   * @param category the {@link QcSegementCategory} for the {@link QcSegementVersion}
   * @param type the {@link QcSegementType} for the {@link QcSegmentVersion}
   * @param uuid the UUID for the {@link QcSegmentVersion}
   * @return the QcSegmentVersion
   */
  public static QcSegmentVersion getQcSegmentVersion(
      long duration,
      long timeOffset,
      Channel channel,
      QcSegmentCategory category,
      QcSegmentType type,
      UUID uuid) {

    var qcId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN.plusSeconds(timeOffset))
            .setParentQcSegmentId(uuid)
            .build();

    var qcData =
        QcSegmentVersion.Data.instanceBuilder()
            .setStageId(WorkflowDefinitionId.from("Auto Workflow"))
            .setChannels(List.of(channel))
            .setDiscoveredOn(List.of(CHANNEL_SEGMENT))
            .setCreatedBy("Beethoven")
            .setRationale("A sublime interpretation of the human condition")
            .setStartTime(Instant.MIN.plusSeconds(timeOffset))
            .setEndTime(Instant.MIN.plusSeconds(timeOffset + duration))
            .setRejected(false)
            .setCategory(category)
            .setType(type)
            .build();

    return QcSegmentVersion.instanceBuilder().setId(qcId).setData(qcData).build();
  }

  public static QcSegment getDefaultQcSegment() {

    var segVersion = getDefaultQcSegmentVersion(ID_UUID);
    var olderVersion = getDefaultQcSegmentVersionEntity(ID_UUID);

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(CHANNEL_ONE)
            .setVersionHistory(new TreeSet<>(Set.of(segVersion, olderVersion)))
            .build();

    return QcSegment.instanceBuilder().setId(ID_UUID).setData(data).build();
  }

  public static QcSegment getGenericQcSegment(
      UUID uuid, Instant startTime, Instant endTime, Instant effectiveAt) {

    var segVersion = getGenericQcSegmentVersion(uuid, startTime, endTime, effectiveAt);
    var olderVersion =
        getGenericQcSegmentVersionEntity(uuid, effectiveAt.minus(1, ChronoUnit.SECONDS));

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(CHANNEL_ONE)
            .setVersionHistory(new TreeSet<>(Set.of(segVersion, olderVersion)))
            .build();

    return QcSegment.instanceBuilder().setId(uuid).setData(data).build();
  }

  public static QcSegment getQcSegmentTwo() {
    var segVersion = getDefaultQcSegmentVersion(ID_UUID_TWO);
    var dataOptional = segVersion.getData();
    var segVersionData =
        dataOptional.isPresent()
            ? dataOptional.get().toBuilder().setChannels(List.of(CHANNEL_TWO)).build()
            : null;
    var newSegVersion = segVersion.toBuilder().setData(segVersionData).build();

    var data =
        QcSegment.Data.instanceBuilder()
            .setChannel(CHANNEL_TWO)
            .setVersionHistory(new TreeSet<>(Set.of(newSegVersion)))
            .build();

    return QcSegment.instanceBuilder().setId(ID_UUID_TWO).setData(data).build();
  }

  public static QcSegmentVersion getDefaultQcSegmentVersion(UUID parentQcSegmentId) {
    return getGenericQcSegmentVersion(parentQcSegmentId, DEFAULT_START, DEFAULT_END, DEFAULT_END);
  }

  public static QcSegmentVersion getGenericQcSegmentVersion(
      UUID parentQcSegmentId, Instant startTime, Instant endTime, Instant effectiveAt) {

    // create version id from parent and load date
    var versionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(effectiveAt)
            .setParentQcSegmentId(parentQcSegmentId)
            .build();

    var createdBy = DEFAULT_AUTHOR;
    var rejected = false;
    var rationale = "N/A (bridged)";

    // query for raw channels using station def accessor
    var rawChannels = List.of(CHANNEL_ONE);

    QcSegmentCategory category = DEFAULT_QC_SEGMENT_CATEGORY;
    QcSegmentType type = DEFAULT_SEGMENT_TYPE;

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

  public static QcSegmentVersion getDefaultQcSegmentVersionEntity(UUID parentQcSegmentId) {
    return getGenericQcSegmentVersionEntity(parentQcSegmentId, DEFAULT_START);
  }

  public static QcSegmentVersion getGenericQcSegmentVersionEntity(
      UUID parentQcSegmentId, Instant effectiveAt) {
    // create version id from parent and load date
    var versionId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(effectiveAt)
            .setParentQcSegmentId(parentQcSegmentId)
            .build();

    return QcSegmentVersion.instanceBuilder().setId(versionId).build();
  }
}
