package gms.shared.featureprediction.plugin.api.lookuptable;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.featureprediction.plugin.api.InitializablePlugin;
import gms.shared.stationdefinition.coi.channel.Location;
import java.util.Set;

/**
 * General interface for earth models that depend on location.
 *
 * @param <T> Type that is returned by the earth model for a location
 * @param <U> Type that indicates the units of the returned value
 */
public interface EarthModelLocationDependentPlugin<T, U> extends InitializablePlugin {

  /**
   * @return Units of returned value
   */
  U getUnits();

  /**
   * @return Phases that are valid for the model calculation
   */
  Set<PhaseType> getAvailablePhaseTypes();

  /**
   * Get the value calculated from the model for the given phase and location
   *
   * @param phaseType Phase, indicated by {@link PhaseType}
   * @param location {@link Location} to calculate for
   * @return The calculated value
   */
  T getValue(PhaseType phaseType, Location location);

  /**
   * Get the standard deviation due to uncertainty in the model.
   *
   * @param phaseType Phase, indicated by {@link PhaseType}
   * @param location {@link Location} to calculate for
   * @return Standard deviation, which is the same type (T) as the value.
   */
  T getStandardDeviation(PhaseType phaseType, Location location);
}
