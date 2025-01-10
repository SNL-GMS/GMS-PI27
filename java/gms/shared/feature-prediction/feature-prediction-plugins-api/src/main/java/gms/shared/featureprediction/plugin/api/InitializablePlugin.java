package gms.shared.featureprediction.plugin.api;

/**
 * Interface for plugins that need some sort of initialization before being used and after being
 * constructed.
 *
 * <p>TODO: Analyze code to see how necessary this interface actually is since the removal of
 * PluginRegistry.
 */
public interface InitializablePlugin {

  /**
   * Function that allows for a Plugin to do anything specific it needs before being used. Will be
   * called by the class that contains the Registry most likely once the config of active plugins
   * has been read.
   */
  void initialize();
}
