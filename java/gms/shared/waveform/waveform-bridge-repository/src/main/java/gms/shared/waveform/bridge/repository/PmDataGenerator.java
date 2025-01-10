package gms.shared.waveform.bridge.repository;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.processingmask.coi.PMData;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcData;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Generates Canned ProcessingMask Data */
public class PmDataGenerator {

  private static final Logger LOGGER = LoggerFactory.getLogger(PmDataGenerator.class);

  private static final String PMLIST_NULL_MSG = "pmDataList list must not be null";
  private static final String PMLIST_EMPTY_MSG = "pmDataList list must not be empty";
  private static final String QC_DATA_MISSING_MSG = "QcSegment Data not populated";
  private static final String QCLIST_NULL_MSG = "qcDataList list must not be null";
  private static final String QCLIST_EMPTY_MSG = "qcDataList list must not be empty";
  private static final String TIME_CHECK_MSG = "A valid time must be provided";

  private static final int AUTHENTICATION = 600;
  private static final int NUM_ADDITIONAL_VERSIONS = 9;

  /**
   * Create the Channel Name from the associated {@link PMData}
   *
   * @param data {@link PMData} containing the data necessary to generate the channel name.
   * @return The channel name from the canned {@link PMData}
   */
  private static String createChannelName(PMData data) {
    return data.getSta() + "." + data.getChan();
  }

  /**
   * Create QcSegements from the provided {@link QcData}
   *
   * @param qcDataList List of QcData items to convert to a QcSegment
   * @param originTime Time to map ProcessingMask and QcSegments
   * @return List of {@link cSegement}
   */
  public List<QcSegment> convertToQcSegment(List<QcData> qcDataList, Instant originTime) {

    Preconditions.checkNotNull(qcDataList, QCLIST_NULL_MSG);
    Preconditions.checkArgument(!qcDataList.isEmpty(), QCLIST_EMPTY_MSG);
    Preconditions.checkNotNull(originTime, TIME_CHECK_MSG);

    var qcDataGenerator = new QcDataGenerator();

    return qcDataList.stream()
        .map(
            (var data) -> {
              if ((data.getMaskType() == AUTHENTICATION)
                  && "ASAR.AS01".equals(data.getSta())
                  && "SHZ".equals(data.getChan())) {
                return qcDataGenerator.createCannedQcSegmentWithVersions(
                    data, originTime, NUM_ADDITIONAL_VERSIONS);
              } else {
                return qcDataGenerator.createCannedQcSegmentWithVersions(data, originTime, 0);
              }
            })
        .toList();
  }

  /**
   * Creates ProcessingMasks from input data
   *
   * @param pmDataList List of relevant PMData items to convert to ProcessingMasks
   * @param qcDataList List of QcData items associated with PMData items
   * @param originTime Time to map ProcessingMask and QcSegments
   * @return List of relevant ProcessingMasks
   */
  public List<ProcessingMask> createProcessingMasks(
      List<PMData> pmDataList, List<QcData> qcDataList, Instant originTime) {

    Preconditions.checkNotNull(pmDataList, PMLIST_NULL_MSG);
    Preconditions.checkArgument(!pmDataList.isEmpty(), PMLIST_EMPTY_MSG);
    Preconditions.checkNotNull(qcDataList, QCLIST_NULL_MSG);
    Preconditions.checkArgument(!qcDataList.isEmpty(), QCLIST_EMPTY_MSG);
    Preconditions.checkNotNull(originTime, TIME_CHECK_MSG);

    var pmGrouping = new PmDataGenerator().convertPmDataToGroup(pmDataList);

    var processingMaskList =
        pmGrouping.entrySet().stream()
            .map(
                (var mapper) -> {
                  LOGGER.debug(
                      "Looking at Group: {} Count:({}) {}",
                      mapper.getKey(),
                      mapper.getValue().size(),
                      mapper.getValue());
                  return new PmDataGenerator()
                      .convertGroupToProcessingMask(mapper.getValue(), qcDataList, originTime);
                })
            .toList();

    if (pmGrouping.size() != processingMaskList.size()) {
      LOGGER.debug(
          "Invalid number of processing masks created.  Expected:[{}] Actual:[{}]",
          pmGrouping.size(),
          processingMaskList.size());
    }

    return processingMaskList;
  }

  /**
   * Maps the similar PMData items together.
   *
   * @param pmDataList List of {@link PMData} items to map into groups
   * @return PMData items mapped by group
   */
  public Map<Long, List<PMData>> convertPmDataToGroup(Collection<PMData> pmDataList) {

    return pmDataList.stream()
        .collect(Collectors.groupingBy(PMData::getPmGroup, Collectors.toList()));
  }

  /**
   * Converts the grouped {@link PMData} items into a Processing Mask.
   *
   * @param pmDataList List of relevant PMData items of the same grouping to convert to
   *     ProcessingMask
   * @param qcDataList List of QcData items associated with PMData items
   * @param originTime Time to map ProcessingMask and QcSegments
   * @return
   */
  public ProcessingMask convertGroupToProcessingMask(
      List<PMData> pmDataList, List<QcData> qcDataList, Instant originTime) {
    // ensure groupId and ProcessingOperation are the same

    Preconditions.checkNotNull(pmDataList, PMLIST_NULL_MSG);
    Preconditions.checkArgument(!pmDataList.isEmpty(), PMLIST_EMPTY_MSG);
    Preconditions.checkNotNull(qcDataList, QCLIST_NULL_MSG);
    Preconditions.checkArgument(!qcDataList.isEmpty(), QCLIST_EMPTY_MSG);
    Preconditions.checkNotNull(originTime, TIME_CHECK_MSG);
    // could try all match
    var matchingConditions =
        pmDataList.stream()
            .map(
                match ->
                    List.of(
                        match.getChan(),
                        match.getSta(),
                        match.getPmGroup(),
                        match.getProcessingOperation()))
            .distinct()
            .toList();
    Preconditions.checkArgument(matchingConditions.size() == 1);

    var localQcSegments =
        pmDataList.stream()
            .map(
                (var pmField) -> {
                  var qcDataRef = generateDataReferenceList(qcDataList, pmField);
                  if (qcDataRef.size() != 1) {
                    LOGGER.debug(
                        "Expected Qc data to match pm data {} {} {} {} {}",
                        pmField.getChan(),
                        pmField.getSta(),
                        pmField.getStartSample(),
                        pmField.getQcmaskid(),
                        pmField.getQcMaskType());
                    throw new IllegalStateException(
                        "One QcSegment expected, found " + qcDataRef.size());
                  }
                  return this.convertToQcSegment(qcDataRef, originTime);
                })
            .flatMap(List::stream)
            .toList();

    if (localQcSegments.isEmpty()) {
      throw new IllegalStateException("ProcessingMask must have QcSegments");
    }

    var localQcVersionsList =
        localQcSegments.stream()
            .map(mapper -> mapper.getData().get().getVersionHistory().last())
            .toList();
    // create qc segments
    var pmProperties = pmDataList.get(0);

    var startTime =
        localQcVersionsList.stream()
            .map(QcSegmentVersion::getData)
            .flatMap(Optional::stream)
            .map(QcSegmentVersion.Data::getStartTime)
            .min(Instant::compareTo)
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

    var endTime =
        localQcVersionsList.stream()
            .map(QcSegmentVersion::getData)
            .flatMap(Optional::stream)
            .map(QcSegmentVersion.Data::getEndTime)
            .max(Instant::compareTo)
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

    var pmData =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(endTime)
            // set effective at to match start time (or should it be end time - match Qc
            // methodology??
            .setStartTime(startTime)
            .setEndTime(endTime)
            .setProcessingOperation(pmProperties.getProcessingOperation())
            .setAppliedToRawChannel(Channel.createEntityReference(createChannelName(pmProperties)))
            .setMaskedQcSegmentVersions(localQcVersionsList);

    var idArray =
        Arrays.toString(Long.toString(pmProperties.getQcmaskid()).getBytes())
            + Arrays.toString(Long.toString(pmProperties.getStartSample()).getBytes())
            + pmProperties.getProcessingOperation()
            + createChannelName(pmProperties);
    var uuid = UUID.nameUUIDFromBytes(idArray.getBytes());

    return ProcessingMask.instanceBuilder().setId(uuid).setData(pmData.build()).build();
  }

  private static List<QcData> generateDataReferenceList(List<QcData> qcDataList, PMData pmField) {
    return qcDataList.stream()
        .filter(qcData -> qcData.getChan().equals(pmField.getChan()))
        .filter(qcData -> qcData.getSta().equals(pmField.getSta()))
        .filter(qcData -> qcData.getStartSample() == pmField.getStartSample())
        .filter(qcData -> qcData.getQcmaskid() == pmField.getQcmaskid())
        .filter(qcData -> qcData.getMaskType() == pmField.getQcMaskType())
        .toList();
  }
}
