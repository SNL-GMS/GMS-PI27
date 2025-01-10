package gms.shared.processingmask.utility;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategoryAndType;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Builds {@link ProcessingMask}s from {@link QcSegmentVersion}s for creating masked waveform {@link
 * ChannelSegment}s.
 */
public final class WaveformMaskingUtility {

  public static final String QC_DATA_MISSING_MSG = "QcSegment Data not populated";
  public static final String QC_CATEGORY_MISSING_MSG =
      QC_DATA_MISSING_MSG + ": Category is missing";

  private WaveformMaskingUtility() {
    // private default constructor to hide implicit public one
  }

  /**
   * Groups the {@link QcSegmentVersion}s by time and creates a {@link ProcessingMask} for each
   * group.
   *
   * <p>Each {@link QcSegmentVersion} group will be separated from other groups by at least the
   * maskedSegementMergeThreshold defined in the {@link ProcessingMaskDefinition}.
   *
   * @param versions a non-null, non-empty collection of QcSegmentVersions with data
   * @param pmDefinition the processing mask definition to be applied to each time group of
   *     QcSegmentVersions
   * @return a {@link ProcessingMask} for each time group of {@link QcSegmentVersion}s
   */
  public static Collection<ProcessingMask> createProcessingMasksFromQcSegmentVersions(
      Collection<QcSegmentVersion> versions, ProcessingMaskDefinition pmDefinition) {

    // Sanitize the inputs
    Preconditions.checkNotNull(versions, "QcSegmentVersions must not be null");
    Preconditions.checkNotNull(pmDefinition, "ProcessingMaskDefinition must not be null");

    if (versions.isEmpty()) {
      return List.of();
    }

    Preconditions.checkState(
        versions.stream().map(QcSegmentVersion::getData).allMatch(Optional::isPresent),
        QC_DATA_MISSING_MSG);

    Preconditions.checkState(
        versions.stream()
            .map(QcSegmentVersion::getData)
            .flatMap(Optional::stream)
            .map(QcSegmentVersion.Data::getCategory)
            .allMatch(Optional::isPresent),
        QC_CATEGORY_MISSING_MSG);

    var channelNames =
        versions.stream()
            .map(QcSegmentVersion::getData)
            .flatMap(Optional::stream)
            .map(QcSegmentVersion.Data::getChannels)
            .flatMap(List::stream)
            .map(Channel::getName)
            .distinct()
            .toList();
    Preconditions.checkArgument(
        channelNames.size() == 1,
        "Channel Count Mismatch [Expected]: 1 [Found]:" + channelNames.size());

    // Downselect to QcSegmentVersions that match the ProcessingMaskDefinition
    var verifyQcAttributeSet = pmDefinition.appliedQcSegmentCategoryAndTypes();

    var applicableVersions =
        versions.stream().filter(qsv -> filterCategoryAndType(qsv, verifyQcAttributeSet)).toList();

    // Create the time-grouped processing masks
    var groupedVersions =
        createGroupedVersions(applicableVersions, pmDefinition.maskedSegmentMergeThreshold());

    return groupedVersions.stream()
        .map(group -> createProcessingMask(group, pmDefinition.processingOperation()))
        .toList();
  }

  /**
   * Determines if a {@link QcSegmentVersion} has a category/type pair that matches with one of the
   * {@link ProcessingMaskDefinition} category/type pairs
   *
   * @param qsv the {@link QcSegmentVersion} being tested
   * @param verifyQcAttributeSet the set of category/type pairs that are allowed
   * @return true if the {@link QcSegmentVersion}'s category and type (if present) match; false
   *     otherwise
   */
  private static boolean filterCategoryAndType(
      QcSegmentVersion qsv, Set<QcSegmentCategoryAndType> verifyQcAttributeSet) {

    // The existence of Data and Category has already been checked
    var data = qsv.getData().orElseThrow(() -> new IllegalStateException(QC_DATA_MISSING_MSG));
    var category =
        data.getCategory().orElseThrow(() -> new IllegalStateException(QC_CATEGORY_MISSING_MSG));

    return data.getType()
        .map(type -> verifyQcAttributeSet.contains(QcSegmentCategoryAndType.create(category, type)))
        .orElseGet(() -> verifyQcAttributeSet.contains(QcSegmentCategoryAndType.create(category)));
  }

  /**
   * Finds groups of {@link QcSegmentVersion}s within the maskedSegmentMergeThreshold (inclusive)
   * duration of each other. Each group of {@link QcSegmentVersion}s will be included in the same
   * {@link ProcessingMask}.
   *
   * @param versions the collection of {@link QcSegmentVersion}s
   * @param threshold the maximum allowable time gap beyond which a new group of {@link
   *     QcSegmentVersion}s is created
   * @return a collection of time-grouped {@link QcSegmentVersion}s
   */
  private static ArrayList<ArrayList<QcSegmentVersion>> createGroupedVersions(
      Collection<QcSegmentVersion> versions, Duration threshold) {
    ArrayList<ArrayList<QcSegmentVersion>> groupedVersions = new ArrayList<>();

    versions.stream()
        .sorted(
            (a, b) -> a.getData().get().getStartTime().compareTo(b.getData().get().getStartTime()))
        .forEach(version -> addToGroupedVersions(version, groupedVersions, threshold));

    return groupedVersions;
  }

  /**
   * Adds a {@link QcSegmentVersion} to the correct time bucket
   *
   * @param version the {@link QcSegmentVersion} being added
   * @param groupedVersions the collection of time-grouped {@link QcSegmentVersion}s
   * @param threshold the maximum amount of time gap allowed before creating a new bucket
   */
  private static void addToGroupedVersions(
      QcSegmentVersion version,
      ArrayList<ArrayList<QcSegmentVersion>> groupedVersions,
      Duration threshold) {

    if (groupedVersions.isEmpty()) {
      groupedVersions.add(new ArrayList<>(List.of(version)));
      return;
    }

    // Since the segments are sorted by start time, the version will either go into the last bucket
    // or a new bucket
    var currentGroup = groupedVersions.get(groupedVersions.size() - 1);

    var currentEndTime =
        currentGroup.stream()
            .map(QcSegmentVersion::getData)
            .map(Optional::get)
            .map(QcSegmentVersion.Data::getEndTime)
            .max(Instant::compareTo)
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));
    var cutoffTime = currentEndTime.plus(threshold);

    var startTime =
        version
            .getData()
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG))
            .getStartTime();

    // At the cutoff => in the same segment
    if (startTime.isAfter(cutoffTime)) {
      groupedVersions.add(new ArrayList<>(List.of(version)));
    } else {
      currentGroup.add(version);
    }
  }

  /**
   * Creates a {@link ProcessingMask} for a time-grouped collection of {@link QcSegmentVersion}s
   *
   * @param versionCollection the time-grouped collection of {@link QcSegmentVersion}s
   * @param processingOperation the {@link ProcessingOperation} used by the {@link Processing Mask}
   * @return the associated {@link ProcessingMask}
   */
  private static ProcessingMask createProcessingMask(
      Collection<QcSegmentVersion> versionCollection, ProcessingOperation processingOperation) {

    var localData =
        versionCollection.stream().map(QcSegmentVersion::getData).map(Optional::get).toList();

    var startTime =
        localData.stream()
            .map(QcSegmentVersion.Data::getStartTime)
            .min(Instant::compareTo)
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

    var endTime =
        localData.stream()
            .map(QcSegmentVersion.Data::getEndTime)
            .max(Instant::compareTo)
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

    var channel =
        localData.stream()
            .map(QcSegmentVersion.Data::getChannels)
            .flatMap(Collection::stream)
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(QC_DATA_MISSING_MSG));

    var pmData =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(Instant.now())
            .setStartTime(startTime)
            .setEndTime(endTime)
            .setProcessingOperation(processingOperation)
            .setAppliedToRawChannel(channel)
            .setMaskedQcSegmentVersions(versionCollection);

    var uuid = UUID.randomUUID();

    return ProcessingMask.instanceBuilder().setId(uuid).setData(pmData.build()).build();
  }
}
