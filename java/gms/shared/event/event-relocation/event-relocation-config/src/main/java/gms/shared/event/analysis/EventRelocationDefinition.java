package gms.shared.event.analysis;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.coi.featureprediction.MasterEventCorrectionDefinition;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.Nullable;

/**
 * Contains information needed to relocate a single EventHypothesis.
 *
 * @param definingFeatureDefinitionMap - a map from SignalDetectionHypothesis to
 *     DefininingFeatureByFeatureMeasurementType. This specifies the difining, anylist-overridable,
 *     and system-overidable paramters for the the feature measurements inside each SDH.
 * @param masterEventCorrectionDefinition - the "master event" to use when correcting the feature
 *     predctions that are made as part of relocation. Can be null.
 */
public record EventRelocationDefinition(
    @JsonSerialize(converter = EventRelocationDefinition.MapToJsonConverter.class)
        @JsonDeserialize(converter = EventRelocationDefinition.JsonToMapConverter.class)
        Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType>
            definingFeatureDefinitionMap,
    @Nullable MasterEventCorrectionDefinition masterEventCorrectionDefinition) {

  public record DefiningFeatureMapKeyValuePair(
      SignalDetectionHypothesis signalDetectionHypothesis,
      DefiningFeatureByFeatureMeasurementType definingFeatureByFeatureMeasurementType) {}

  /**
   * Converts the definingFeatureDefinitionMap to a set of entries that can be converted into JSON
   */
  static class MapToJsonConverter
      extends StdConverter<
          Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType>,
          Set<DefiningFeatureMapKeyValuePair>> {
    public Set<DefiningFeatureMapKeyValuePair> convert(
        Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType> map) {
      return map.entrySet().stream()
          .map(entry -> new DefiningFeatureMapKeyValuePair(entry.getKey(), entry.getValue()))
          .collect(Collectors.toSet());
    }
  }

  /** Convertes a set of entries in JSON to the definingFeatureDefinitionMap. */
  static class JsonToMapConverter
      extends StdConverter<
          Set<DefiningFeatureMapKeyValuePair>,
          Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType>> {
    public Map<SignalDetectionHypothesis, DefiningFeatureByFeatureMeasurementType> convert(
        Set<DefiningFeatureMapKeyValuePair> pairs) {
      return pairs.stream()
          .map(
              pair ->
                  Map.entry(
                      pair.signalDetectionHypothesis, pair.definingFeatureByFeatureMeasurementType))
          .collect(Collectors.toMap(Entry::getKey, Entry::getValue));
    }
  }
}
