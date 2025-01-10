package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/**
 * Contains information needed to properly setup the {@link LibCorrSettings} object.
 *
 * @param pathCorrectionsRoot - path that points to the volume mounted files in the container
 * @param pathCorrectionsRelativePath - path that points to the relative location of the volume
 *     mounted files in the container.
 * @param preloadModels - asserts if the models has been previously loaded.
 * @param maxModels - maximum number of models being loaded.
 * @param interpolatorType - determines the type of interpolation being done.
 * @param maxSiteSeparation - denotes the maximun separation encounter between stations.
 * @param matchOnRefsta - asserts if the initialization settings matches on a referenced station.
 */
public record LibCorrInitializationSettings(
    String pathCorrectionsRoot,
    String pathCorrectionsRelativePath,
    boolean preloadModels,
    int maxModels,
    LibCorrInterpolatorType interpolatorType,
    double maxSiteSeparation,
    boolean matchOnRefsta) {

  /**
   * Return the properties {@link Properties} for {@link LibCorrInitializationSettings} settings
   *
   * @param properties the {@link Properties} to be set for new {@link
   *     LibCorrInitializationSettings} properties
   * @return the modified {@link Properties} properties to the corresponding {@link
   *     LibCorrInitializationSettings} settings
   */
  public Properties setProperties(String predictor, Properties properties) {
    properties.setProperty(predictor + "LibCorrPathCorrectionsRoot", pathCorrectionsRoot);
    properties.setProperty(
        predictor + "LibCorrpathCorrectionsRelativeGridPath", pathCorrectionsRelativePath);
    properties.setProperty(predictor + "LibCorrPreloadModels", Boolean.toString(preloadModels));
    properties.setProperty(predictor + "??", Integer.toString(maxModels));
    properties.setProperty(
        predictor + "LibCorrMaxSiteSeparation", Double.toString(maxSiteSeparation));
    properties.setProperty(predictor + "LibCorrMatchOnRefsta", Boolean.toString(matchOnRefsta));

    interpolatorType.setProperties(predictor, properties);

    return properties;
  }
}
