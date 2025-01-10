package gms.shared.event.api;

import com.google.common.base.Preconditions;
import com.google.common.collect.Table;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.Map;

/**
 * Value class that maps {@link PhaseType}s to pairs of {@link Channel}s and {@link
 * DefiningFeatureByFeatureMeasurementType}s
 */
public record DefiningFeatureMapByChannelAndPhaseType(
    Table<PhaseType, String, Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>>
        definingFeatureMapByChannelAndPhaseType) {

  /**
   * Value class that maps {@link PhaseType}s to pairs of {@link Channel}s and {@link
   * DefiningFeatureByFeatureMeasurementType}s
   *
   * @param definingFeatureMapByChannelAndPhaseType a {@link Table} with rows of {@link PhaseType}s,
   *     columns of {@link Channel} names, cell values of {@link
   *     DefiningFeatureByFeatureMeasurementType}s
   */
  public DefiningFeatureMapByChannelAndPhaseType {
    Preconditions.checkNotNull(definingFeatureMapByChannelAndPhaseType);
  }
}
