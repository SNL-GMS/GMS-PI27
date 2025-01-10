package gms.shared.featureprediction.plugin.api;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionCorrectionDefinition;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.FeaturePredictionValue;
import gms.shared.stationdefinition.coi.channel.Location;
import java.util.List;
import java.util.Optional;

/** Specifies the interface for creating generic feature predictions. */
public interface FeaturePredictorPlugin extends InitializablePlugin {

  /**
   * Get the Optional value of the FeaturePrediction value
   *
   * @param featurePredictionType Type of the FeaturePrediction to retrieve
   * @param <T> Class that extend FeaturePredictionValue, which is tightly matched to
   *     FeaturePredictionType
   * @param sourceLocation location of source
   * @param receiverLocation location of receiver
   * @param phase phase to calculate for
   * @param earthModel earth model to use
   * @param featurePredictionCorrectionDefinitions a list of corrections to apply to the basemodel
   *     prediction
   * @return The FeaturePrediction with the given type Optional.
   */
  <T extends FeaturePredictionValue<?, ?, ?>> Optional<FeaturePrediction<T>> predict(
      FeaturePredictionType<T> featurePredictionType,
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phase,
      String earthModel,
      List<FeaturePredictionCorrectionDefinition> featurePredictionCorrectionDefinitions);
}
