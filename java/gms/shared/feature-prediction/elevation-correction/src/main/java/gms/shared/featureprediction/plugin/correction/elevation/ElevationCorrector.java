package gms.shared.featureprediction.plugin.correction.elevation;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.featureprediction.plugin.api.correction.elevation.mediumvelocity.MediumVelocityEarthModelPlugin;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.stationdefinition.coi.channel.Location;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Component;

/** Springified utility for calculating arrival time corrections based on elevation. */
@Component
@ComponentScan(basePackages = {"gms.shared.featureprediction.utilities.elevationcorrector.plugins"})
public class ElevationCorrector {

  private static final double KM_PER_DEGREE = 111.949;

  private final ElevationCorrectorConfiguration elevationCorrectorConfiguration;
  private final Map<String, MediumVelocityEarthModelPlugin> modelPluginMap;

  @Autowired
  public ElevationCorrector(
      ElevationCorrectorConfiguration elevationCorrectorConfiguration,
      Map<String, MediumVelocityEarthModelPlugin> modelPluginMap) {
    this.elevationCorrectorConfiguration = elevationCorrectorConfiguration;
    this.modelPluginMap = Map.copyOf(modelPluginMap);
  }

  /** Initialize the utility. Called by spring after construction. */
  @PostConstruct
  public void init() {
    elevationCorrectorConfiguration
        .getCurrentElevationCorrectorDefinition()
        .getMediumVelocityEarthModelPluginNameByModelNameMap()
        .forEach(
            (model, pluginName) ->
                Optional.ofNullable(modelPluginMap.get(pluginName))
                    .orElseThrow(
                        () ->
                            new IllegalStateException(
                                "A plugin named "
                                    + pluginName
                                    + " is configured for earth model "
                                    + model
                                    + ", but no plugin was found"))
                    .initialize());
  }

  /**
   * Calculate an elevation-based arrival time correction
   *
   * @param mediumVelocityEarthModel Which medium velocity model to use.
   * @param receiverLocation Location of the receiver
   * @param horizontalSlowness Slowness used in calculation
   * @param phaseType Phase to calculate for
   * @return A FeaturePredictionComponent which contains the correction, in the form of a duration
   *     to be added to the arrival time.
   */
  public Optional<FeaturePredictionComponent<DurationValue>> correct(
      String mediumVelocityEarthModel,
      Location receiverLocation,
      double horizontalSlowness,
      PhaseType phaseType) {

    // Cant get a medium velocity if we don't have P or S final phase.
    if (phaseType.getFinalPhase() != PhaseType.P && phaseType.getFinalPhase() != PhaseType.S) {
      return Optional.empty();
    }

    var stationVelocityOptional =
        Optional.ofNullable(
                elevationCorrectorConfiguration
                    .getCurrentElevationCorrectorDefinition()
                    .getPluginNameForEarthModel(mediumVelocityEarthModel))
            .map(pluginName -> Optional.ofNullable(modelPluginMap.get(pluginName)))
            .flatMap(mediumVelocityEarthModelPlugin -> mediumVelocityEarthModelPlugin)
            .map(plugin -> plugin.getValue(phaseType.getFinalPhase(), receiverLocation));

    if (stationVelocityOptional.isEmpty()) {
      return Optional.empty();
    }

    double stationVelocity = stationVelocityOptional.get();

    var x = horizontalSlowness * stationVelocity / KM_PER_DEGREE;

    var rawCorrectionInSeconds =
        (receiverLocation.getElevationKm() / stationVelocity) * Math.sqrt(1 - x * x);

    return Optional.of(
        FeaturePredictionComponent.from(
            DurationValue.from(
                Duration.ofNanos((long) (1_000_000_000 * rawCorrectionInSeconds)), null),
            false,
            FeaturePredictionComponentType.ELEVATION_CORRECTION));
  }
}
