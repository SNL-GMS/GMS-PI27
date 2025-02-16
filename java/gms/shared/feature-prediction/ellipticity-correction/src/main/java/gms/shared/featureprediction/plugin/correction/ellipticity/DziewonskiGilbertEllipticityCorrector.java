package gms.shared.featureprediction.plugin.correction.ellipticity;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.featureprediction.plugin.api.correction.ellipticity.EllipticityCorrectorPlugin;
import gms.shared.featureprediction.plugin.api.lookuptable.DziewonskiGilbertEllipticityCorrectionLookupTablePlugin;
import gms.shared.featureprediction.utilities.math.EarthModelUtility;
import gms.shared.featureprediction.utilities.math.GeoMath;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.stationdefinition.coi.channel.Location;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Generate correction to travel time using Gziewonsiki Gilber model. */
@Service
public class DziewonskiGilbertEllipticityCorrector implements EllipticityCorrectorPlugin {

  private final DziewonskiGilbertEllipticityCorrectorConfiguration configuration;

  private final Map<String, DziewonskiGilbertEllipticityCorrectionLookupTablePlugin> lookupTableMap;

  @Autowired
  public DziewonskiGilbertEllipticityCorrector(
      DziewonskiGilbertEllipticityCorrectorConfiguration configuration,
      Map<String, DziewonskiGilbertEllipticityCorrectionLookupTablePlugin> lookupTableMap) {
    this.configuration = configuration;
    this.lookupTableMap = Map.copyOf(lookupTableMap);
  }

  /**
   * Calculate correction
   *
   * @param earthModel earth model to use
   * @param sourceLocation location of source
   * @param receiverLocation location of receiver
   * @param phaseType phase to calculate for
   * @return FeaturePredictionComponent containing correction, or empty if correction could not be
   *     made
   */
  @Override
  public Optional<FeaturePredictionComponent<DurationValue>> correct(
      String earthModel,
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phaseType) {

    var optionalPluginName =
        Optional.ofNullable(
            configuration
                .getCurrentDziewonskiGilbertEllipticityCorrectorDefinition()
                .getCorrectionModelPluginNameByModelNameMap()
                .get(earthModel));

    var tablePlugin =
        optionalPluginName.flatMap(
            pluginName -> Optional.ofNullable(lookupTableMap.get(pluginName)));

    return tablePlugin
        //
        // If our plugin doesnt support supplied phase, do nothing and return Optional.empty
        //
        .filter(plugin -> plugin.getAvailablePhaseTypes().contains(phaseType))
        //
        // Do the calculation
        //
        .map(
            plugin ->
                generateTauInterpolations(plugin, sourceLocation, receiverLocation, phaseType))
        .map(
            (List<Double> tauInterpolations) -> {
              double colatitude =
                  GeoMath.toColatitudeDeg(
                      GeoMath.normalizeLatitude(sourceLocation.getLatitudeDegrees()));

              double azimuth =
                  GeoMath.azimuth(
                      sourceLocation.getLatitudeDegrees(),
                      sourceLocation.getLongitudeDegrees(),
                      receiverLocation.getLatitudeDegrees(),
                      receiverLocation.getLongitudeDegrees());

              return travelTimeEllipticityCorrection(
                  colatitude,
                  azimuth,
                  tauInterpolations.get(0),
                  tauInterpolations.get(1),
                  tauInterpolations.get(2));
            })
        .map(
            correction ->
                FeaturePredictionComponent.from(
                    DurationValue.from(
                        Duration.ofNanos((long) (correction * 1_000_000_000)), Duration.ZERO),
                    true,
                    FeaturePredictionComponentType.ELLIPTICITY_CORRECTION));
  }

  private static List<Double> generateTauInterpolations(
      DziewonskiGilbertEllipticityCorrectionLookupTablePlugin plugin,
      EventLocation sourceLocation,
      Location receiverLocation,
      PhaseType phaseType) {
    var distances = plugin.getDistancesDegForData(phaseType);
    var depths = plugin.getDepthsKmForData(phaseType);
    var tauTableTriple = plugin.getValues(phaseType);

    double distance =
        GeoMath.greatCircleAngularSeparation(
            receiverLocation.getLatitudeDegrees(),
            receiverLocation.getLongitudeDegrees(),
            sourceLocation.getLatitudeDegrees(),
            sourceLocation.getLongitudeDegrees());

    return Stream.of(
            tauTableTriple.getLeft(), tauTableTriple.getMiddle(), tauTableTriple.getRight())
        .map(
            tauTable ->
                tauTable.stream()
                    .map(subList -> subList.stream().mapToDouble(Double::valueOf).toArray())
                    .toArray(double[][]::new))
        .map(
            (double[][] array) -> {
              var earthModelUtility =
                  new EarthModelUtility(distances.toArray(), depths.toArray(), array, true);

              return earthModelUtility
                  .interpolateEarthModel(distance, sourceLocation.getDepthKm())[0];
            })
        .toList();
  }

  @Override
  public void initialize() {
    this.configuration
        .getCurrentDziewonskiGilbertEllipticityCorrectorDefinition()
        .getCorrectionModelPluginNameByModelNameMap()
        .values()
        .stream()
        .distinct()
        .forEach(
            pluginName ->
                Optional.ofNullable(lookupTableMap.get(pluginName))
                    .ifPresent(
                        DziewonskiGilbertEllipticityCorrectionLookupTablePlugin::initialize));
  }

  /**
   * Calculate travel time correction given tau values, colatitude and azimuth
   *
   * @param colatitudeDegrees colatitude in degrees
   * @param azimuthDegrees azimuth in degrees
   * @param tau0 first value in correction table
   * @param tau1 second value in correction table
   * @param tau2 third value in correction table
   * @return value to add to predicted travel time
   */
  private static double travelTimeEllipticityCorrection(
      double colatitudeDegrees, double azimuthDegrees, double tau0, double tau1, double tau2) {
    double colatitudeRadians = Math.toRadians(colatitudeDegrees);
    double azimuthRadians = Math.toRadians(azimuthDegrees);

    double sqrt3over2 = Math.sqrt(0.75);
    double sinColat = Math.sin(colatitudeRadians);

    return 0.25 * (1.0 + 3.0 * Math.cos(2.0 * colatitudeRadians)) * tau0
        + sqrt3over2 * Math.sin(2.0 * colatitudeRadians) * Math.cos(azimuthRadians) * tau1
        + sqrt3over2 * sinColat * sinColat * Math.cos(2.0 * azimuthRadians) * tau2;
  }
}
