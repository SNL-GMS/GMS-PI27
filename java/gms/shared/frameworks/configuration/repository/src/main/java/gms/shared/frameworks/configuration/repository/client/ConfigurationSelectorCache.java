package gms.shared.frameworks.configuration.repository.client;

import gms.shared.frameworks.configuration.Selector;
import java.util.List;
import java.util.Map;

/**
 * Defines a cache for storing previously resolved configuration options given a list of {@link
 * Selector}s
 */
public interface ConfigurationSelectorCache {

  /**
   * Resolve the configuration FieldMap given a list of {@link Selector}s
   *
   * @param selectors selectors to resolve the FieldMap for a particular configuration option
   * @return A FieldMap containing the configuration option's parameters
   */
  Map<String, Object> resolveFieldMap(List<? extends Selector<?>> selectors);
}
