package gms.shared.featureprediction.plugin.api.correction.ellipticity;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.featureprediction.plugin.api.InitializablePlugin;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.stationdefinition.coi.channel.Location;
import java.util.Optional;

/** Specifies interface for generic ellipticity corrections to travel time predictios. */
public interface EllipticityCorrectorPlugin extends InitializablePlugin {

  /**
   * Perform an ellepticity correction.
   *
   * @param earthModel The earth model to use when calculating the correction
   * @param sourceLocation The {@link EventLocation} indicating the location of the source
   * @param receiverLocation The {@link Location} indicating the location of the receiver
   * @param phaseType The phase, indicated by {@link PhaseType}
   * @return {@link FeaturePredictionComponent} containing the correction
   */
  Optional<FeaturePredictionComponent<DurationValue>> correct(
      String earthModel,
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phaseType);
}
