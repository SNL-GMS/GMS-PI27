package gms.shared.signalfeaturemeasurement.api;

import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplate;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;
import java.util.Optional;

/**
 * SignalFeatureMeasurementUtility defining SignalFeatureMeasurementConfigurationResolver for
 * configuration resolver operations
 */
public interface SignalFeatureMeasurementUtility {

  /**
   * Resolve the default {@link Station} for the given {@link AmplitudeMeasurementType}
   *
   * @param amplitudeMeasurementType input {@link AmplitudeMeasurementType}
   * @return list of applicable {@link AmplitudeMeasurementDefinition}s
   */
  Collection<Station> getDefaultStationsToMeasure(
      AmplitudeMeasurementType amplitudeMeasurementType);

  /**
   * Resolve the canonical {@link AmplitudeMeasurementDefinition} for the given {@link
   * AmplitudeMeasurementType}.
   *
   * @param amplitudeMeasurementType input {@link AmplitudeMeasurementType}
   * @return applicable {@link AmplitudeMeasurementDefinition}
   */
  AmplitudeMeasurementDefinition getAmplitudeMeasurementDefinition(
      AmplitudeMeasurementType amplitudeMeasurementType);

  /**
   * Resolve the {@link AmplitudeMeasurementConditioningTemplate} for the given {@link Station} and
   * {@link AmplitudeMeasurementDefinition}
   *
   * @param station applicable {@link Station}
   * @param amplitudeMeasurementType applicable {@link AmplitudeMeasurementDefinition}
   * @return applicable {@link AmplitudeMeasurementConditioningTemplate}
   */
  Optional<AmplitudeMeasurementConditioningTemplate> getAmplitudeMeasurementConditioningTemplate(
      Station station, AmplitudeMeasurementType amplitudeMeasurementType);
}
