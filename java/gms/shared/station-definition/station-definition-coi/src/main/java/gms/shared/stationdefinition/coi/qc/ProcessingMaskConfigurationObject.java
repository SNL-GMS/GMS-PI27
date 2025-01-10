package gms.shared.stationdefinition.coi.qc;

import com.google.common.base.Preconditions;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;

/**
 * Lowest level data container used for retrieval from the ConfigurationConsumerUtility
 *
 * @param maskedSegmentMergeThreshold - duration between adjacent {@link QcSegmentVersions}
 * @param appliedQcSegmentCategoryAndTypes - set of {@link QcSegmentCategoryAndType}
 * @param taperDefinition - Optional {@link TaperDefinition}
 */
public record ProcessingMaskConfigurationObject(
    Duration maskedSegmentMergeThreshold,
    Set<QcSegmentCategoryAndType> appliedQcSegmentCategoryAndTypes,
    Optional<TaperDefinition> taperDefinition) {

  public ProcessingMaskConfigurationObject {

    Preconditions.checkNotNull(maskedSegmentMergeThreshold);
    Preconditions.checkNotNull(appliedQcSegmentCategoryAndTypes);
    Preconditions.checkNotNull(taperDefinition);
  }
}
