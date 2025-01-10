package gms.shared.stationdefinition.coi.qc;

import com.google.common.base.Preconditions;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;

/**
 * Data container {@link ProcessingMaskDefinition}
 *
 * @param maskedSegmentMergeThreshold - duration specifying the time range between adjacent {@link
 *     QcSegmentVersions} included in a {@link ProcessingMask}
 * @param processingOperation - {@link ProcessingOperation} used to create {@link ProcessingMask}
 * @param appliedQcSegmentCategoryAndTypes - set of {@link QcSegmentCategoryAndType}
 * @param taperDefinition - Optional {@link TaperDefinition}
 */
public record ProcessingMaskDefinition(
    Duration maskedSegmentMergeThreshold,
    ProcessingOperation processingOperation,
    Set<QcSegmentCategoryAndType> appliedQcSegmentCategoryAndTypes,
    Optional<TaperDefinition> taperDefinition) {

  public ProcessingMaskDefinition {

    Preconditions.checkNotNull(maskedSegmentMergeThreshold);
    Preconditions.checkNotNull(processingOperation);
    Preconditions.checkNotNull(appliedQcSegmentCategoryAndTypes);
    Preconditions.checkNotNull(taperDefinition);
  }

  public ProcessingMaskDefinition(
      Duration maskedSegmentMergeThreshold,
      ProcessingOperation processingOperation,
      Set<QcSegmentCategoryAndType> appliedQcSegmentCategoryAndTypes,
      TaperDefinition taperDefinition) {

    this(
        maskedSegmentMergeThreshold,
        processingOperation,
        appliedQcSegmentCategoryAndTypes,
        Optional.ofNullable(taperDefinition));
  }

  public ProcessingMaskDefinition(
      ProcessingMaskConfigurationObject obj, ProcessingOperation processingOperation) {

    this(
        obj.maskedSegmentMergeThreshold(),
        processingOperation,
        obj.appliedQcSegmentCategoryAndTypes(),
        obj.taperDefinition());
  }
}
