import { useHotkeys } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import { buildHotkeyConfigArray, useGetProcessingAnalystConfigurationQuery } from '@gms/ui-state';
import { useMemo } from 'react';

/**
 * @returns the prevent default configuration from processing config, or undefined if the query
 * has not returned data
 */
export const useGlobalPreventDefaultsConfigurations = ():
  | ConfigurationTypes.PreventDefaultConfig
  | undefined => {
  return useGetProcessingAnalystConfigurationQuery().data?.preventBrowserDefaults;
};

/**
 * Enables the prevent global defaults browser config using blueprint hotkeys.
 */
export function useGlobalPreventDefault() {
  const preventBrowserDefaultsConfig = useGlobalPreventDefaultsConfigurations();
  // Build the config array
  const configs = useMemo(() => {
    return Object.values(preventBrowserDefaultsConfig || {})
      .map(config => {
        return buildHotkeyConfigArray(
          {
            combos: config.combos,
            description: config?.description ?? 'Used to prevent default browser action'
          },
          e => e.preventDefault(),
          undefined,
          false,
          true
        );
      })
      .flatMap(item => item);
  }, [preventBrowserDefaultsConfig]);

  useHotkeys(configs);
}
