package gms.shared.signaldetection.util;

import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import java.util.Map;

/**
 * Interim container object to maintain the relation between a mapping of filter IDs by their {@link
 * FilterDefinitionUsage} and their associated {@link SignalDetectionHypothesis}
 */
@AutoValue
public abstract class FilterRecordIdsByUsage {

  public abstract Map<FilterDefinitionUsage, Long> getIdsByUsage();

  public abstract SignalDetectionHypothesis getHypothesis();

  public static FilterRecordIdsByUsage create(
      Map<FilterDefinitionUsage, Long> idsByUsage, SignalDetectionHypothesis hypothesis) {
    return new AutoValue_FilterRecordIdsByUsage(idsByUsage, hypothesis);
  }
}
