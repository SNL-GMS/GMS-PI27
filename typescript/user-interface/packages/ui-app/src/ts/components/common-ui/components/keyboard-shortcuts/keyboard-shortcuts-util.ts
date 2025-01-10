import { ConfigurationTypes } from '@gms/common-model';
import { doTagsMatch, Logger } from '@gms/common-util';
import { getOS, OSTypes } from '@gms/ui-util';

const logger = Logger.create('GMS_LOG_KEYBOARD_SHORTCUTS', process.env.GMS_LOG_KEYBOARD_SHORTCUTS);

/**
 * Does a literal check of search terms against hotkey combos with no attempts at
 * handling abbreviations, such as control/ctrl. Case insensitive.
 *
 * @param combos a combo string to check, such as 'shift+a, shift+left'
 * @param term a search term to check against the combo, such as `shift'
 * @returns whether the combo is a match for the term
 */
export const isSearchTermFoundInCombo = (combo: string, term: string): boolean => {
  if (combo.toLowerCase().includes(term)) {
    return true;
  }
  let isFound = false;
  if (combo.toLowerCase().replace(`+`, ' ').includes(term)) {
    isFound = true;
  }
  return isFound;
};

/**
 * Does a check of search terms against hotkey combos.
 * Attempts to handle abbreviations, such as control/ctrl, or command/cmd.
 * Case insensitive.
 *
 * @param combo a combo string to check, such as 'ctrl+a, command+left'
 * @param term a search term to check against the combo, such as `control'
 * @returns whether the combo is a match for the term
 */
export const doHotkeyCombosMatch = (combos: string[], term: string): boolean => {
  let isFound = false;
  combos.forEach(combo => {
    isFound = isFound || isSearchTermFoundInCombo(combo, term);
    if (!isFound && combo.includes('command')) {
      isFound = isSearchTermFoundInCombo(combo.replace(/command/g, 'cmd'), term);
    }
    if (!isFound && combo.includes('cmd')) {
      isFound = isSearchTermFoundInCombo(combo.replace(/cmd/g, 'command'), term);
    }
    if (!isFound && combo.includes('control')) {
      isFound = isSearchTermFoundInCombo(combo.replace(/control/g, 'ctrl'), term);
    }
    if (!isFound && combo.includes('ctrl')) {
      isFound = isSearchTermFoundInCombo(combo.replace(/ctrl/g, 'control'), term);
    }
  });

  return isFound;
};

/**
 * Checks if a search term is a match for a hotkey.
 * It's considered a match if any words in the search term match a hokey's display text, category, or tags
 *
 * @param hotkey a HotkeyConfiguration object to determine if it matches
 * @param term a string to check against the hotkey
 */
export const hotkeyMatchesSearchTerm: (
  hotkey: ConfigurationTypes.HotkeyConfiguration,
  term: string
) => boolean = (hotkey, term) => {
  const cleanTerm = term.replace(/\s\s+/g, ' ').trim().toLowerCase();
  return (
    hotkey &&
    (hotkey.description.toLowerCase().includes(cleanTerm) ||
      doTagsMatch(hotkey.tags, cleanTerm) ||
      hotkey.categories
        ?.map(cat => cat.toLowerCase().includes(cleanTerm))
        .reduce((a, b) => a || b, false) ||
      doHotkeyCombosMatch(hotkey.combos, cleanTerm))
  );
};

/**
 * Merges two hotkey configurations and assigns them to a given category.
 * The merged config will have a merged description and merged help text if the two configs have
 * different descriptions/help text.
 * The merged config will have a deduplicated list of all combos provided, and all tags provided.
 * The merged config will have only the category provided.
 *
 * @param config1 A hotkey configuration to be merged
 * @param config2 A different hotkey configuration to be merged
 * @param category the category to which to assign these configurations
 * @returns a merged hotkey configuration for the designated category
 */
function mergeCategorizedConfigs(
  config1: ConfigurationTypes.HotkeyConfiguration,
  config2: ConfigurationTypes.HotkeyConfiguration,
  category: string
): ConfigurationTypes.HotkeyConfiguration {
  if (config1 == null) {
    return { ...config2, categories: [category] };
  }
  if (config2 == null) {
    return { ...config1, categories: [category] };
  }

  const delimiter = config1.description.match(/;$/) ? '' : ';';

  const description =
    config1.description !== config2.description
      ? `${config1.description}${delimiter} ${config2.description}`
      : config1.description;
  const helpText =
    config1.helpText !== config2.helpText
      ? `${config1.helpText}\n${config2.helpText}`
      : config1.helpText;

  return {
    description,
    categories: [category],
    combos: Array.from(new Set([...config1.combos, ...config2.combos])),
    helpText,
    tags: Array.from(new Set([...(config1.tags ?? []), ...(config2.tags ?? [])]))
  };
}

/**
 * Merges a list of hotkey configs into a categorized record.
 *
 * @param configs a list of hotkey configs to merge
 * @returns a record of categories to hotkeyConfigs.
 */
function mergeAndCategorizeHotkeyConfigs(
  configs: ConfigurationTypes.HotkeyConfiguration[]
): Record<string, ConfigurationTypes.HotkeyConfiguration> {
  // create record of categories
  const categorizedShortcuts: Record<string, ConfigurationTypes.HotkeyConfiguration> = {};
  // for each config, merge it with the existing config for each category
  configs.forEach(config => {
    config.categories?.forEach(category => {
      categorizedShortcuts[category] = mergeCategorizedConfigs(
        categorizedShortcuts[category],
        config,
        category
      );
    });
  });
  return categorizedShortcuts;
}

/**
 * Sorts the hotkey configurations by description.
 *
 * @param shortcuts a record mapping category strings to unsorted shortcuts
 * @returns a record mapping category strings to sorted shortcuts
 */
function sortShortcuts(
  shortcuts: Record<string, ConfigurationTypes.HotkeyConfiguration[]>
): Record<string, ConfigurationTypes.HotkeyConfiguration[]> {
  return Object.entries(shortcuts).reduce((sortedShortcuts, [category, shortcutList]) => {
    return {
      ...sortedShortcuts,
      [category]: shortcutList.sort((shortcut1, shortcut2) =>
        // sort by description since that is what is displayed
        shortcut1.description.localeCompare(shortcut2.description)
      )
    };
  }, {});
}

/**
 * Returns the hotkey string describing the action, including the provided impliedAction if any.
 *
 * @param combo a hotkey combo string
 * @param impliedAction the implied action, such as click or drag, or an empty string if a plain hotkey
 */
function addImpliedUserActionsToShortcut(combo: string, impliedAction: string) {
  if (!combo) {
    return impliedAction;
  }
  return impliedAction ? `${combo} + ${impliedAction}` : combo;
}

/**
 * Returns an array of hotkey strings with the added implied actions for display.
 *
 * @param hotkeyConfig The hotkey configuration from which to get the hotkey strings
 * @param impliedAction The implied action for this hotkey configuration, such as click, or drag,
 * or an empty string if a plain hotkey
 */
function keyboardShortcutCombosWithImpliedAction(
  hotkeyConfig: ConfigurationTypes.HotkeyConfiguration,
  impliedAction: string
) {
  if (hotkeyConfig.combos.length === 0) {
    return [impliedAction];
  }
  return [
    ...hotkeyConfig.combos.map(combo => addImpliedUserActionsToShortcut(combo, impliedAction))
  ].filter(c => !!c);
}

/**
 * Search hotkey configurations to find which implied action is associated
 *
 * @param targetHotkeyConfig hotkey config associated to implied action
 * @param hotkeyConfigs configurations to search thru
 * @returns implied action string
 */
function getImpliedActionForHotkeyConfig(
  targetHotkeyConfig: ConfigurationTypes.HotkeyConfiguration,
  hotkeyConfigs: ConfigurationTypes.KeyboardShortcutConfigurations
): string {
  const impliedTypeEntry = Object.entries(hotkeyConfigs).find(([, hotkeyConfigsOfType]) => {
    const hotkeyFound = Object.values(hotkeyConfigsOfType).find(
      (hotkeyConfig: ConfigurationTypes.HotkeyConfiguration) => targetHotkeyConfig === hotkeyConfig
    );
    return hotkeyFound !== undefined;
  });
  return impliedTypeEntry ? impliedTypeEntry[0] : '';
}

/**
 * Return hotkey combos strings with any implied actions
 *
 * @param targetHotkeyConfig
 * @param hotkeyConfigs
 * @returns string[]
 */
export function getKeyboardShortcutCombos(
  targetHotkeyConfig: ConfigurationTypes.HotkeyConfiguration,
  hotkeyConfigs: ConfigurationTypes.KeyboardShortcutConfigurations
): string[] {
  const impliedAction = getImpliedActionForHotkeyConfig(targetHotkeyConfig, hotkeyConfigs);
  if (!impliedAction) {
    return targetHotkeyConfig?.combos;
  }
  return keyboardShortcutCombosWithImpliedAction(
    targetHotkeyConfig,
    ConfigurationTypes.ImpliedUserActions[impliedAction]
  );
}

/**
 * Merges keyboard shortcuts from different group, such as `clickEvents` and `hotkeys`, so that
 * they only take up one line in the display.
 *
 * @param hotkeyConfigs The hotkey configuration from the service
 * @returns a record mapping category strings to merged, sorted hotkey configurations
 */
export function mergeKeyboardShortcutsByCategory(
  hotkeyConfigs: ConfigurationTypes.KeyboardShortcutConfigurations
): Record<string, ConfigurationTypes.HotkeyConfiguration[]> {
  const shortcutsToMerge: Record<string, ConfigurationTypes.HotkeyConfiguration[]> = {};
  Object.entries(hotkeyConfigs).forEach(([impliedUserActionType, hotkeyConfigsOfType]) => {
    Object.entries(hotkeyConfigsOfType).forEach(
      ([shortcutType, hotkeyConfig]: [string, ConfigurationTypes.HotkeyConfiguration]) => {
        // build a collection of all shortcuts for a particular key
        if (!shortcutsToMerge[shortcutType]) {
          shortcutsToMerge[shortcutType] = [];
        }
        shortcutsToMerge[shortcutType].push({
          ...hotkeyConfig,
          combos: keyboardShortcutCombosWithImpliedAction(
            hotkeyConfig,
            ConfigurationTypes.ImpliedUserActions[impliedUserActionType]
          )
        });
      }
    );
  });
  // merge all shortcuts for that key
  const categorizedShortcuts: Record<string, ConfigurationTypes.HotkeyConfiguration[]> = {};
  Object.values(shortcutsToMerge).forEach(shortcuts => {
    Object.entries(mergeAndCategorizeHotkeyConfigs(shortcuts)).forEach(([category, shortcut]) => {
      if (!categorizedShortcuts[category]) {
        categorizedShortcuts[category] = [];
      }
      if (!categorizedShortcuts[category].some(s => s.description === shortcut.description)) {
        categorizedShortcuts[category].push(shortcut);
      } else {
        logger.warn(
          'Found duplicate hotkeys for the same category with the same exact description. Discarding all but the first hotkey.',
          shortcut.description
        );
      }
    });
  });
  return sortShortcuts(categorizedShortcuts);
}

/**
 * Sorts a list of keyboard shortcuts into a record of shortcut arrays
 * with a key equal to the category name.
 */
export const categorizeKeyboardShortcuts = (
  shortcuts: ConfigurationTypes.HotkeyConfiguration[] | undefined
): Record<string, ConfigurationTypes.HotkeyConfiguration[]> => {
  if (!shortcuts) return {};
  const shortcutRecord: Record<string, ConfigurationTypes.HotkeyConfiguration[]> = {};
  shortcuts.forEach(shortcut => {
    if (shortcut.categories) {
      shortcut.categories.forEach(category => {
        if (shortcutRecord[category]) {
          shortcutRecord[category].push(shortcut);
        } else {
          shortcutRecord[category] = [shortcut];
        }
      });
    }
  });
  return shortcutRecord;
};

/**
 * @returns true if it is a key combo containing a mac-only key such as command or option
 */
export const isMacKeyCombo = (combo: string): boolean =>
  combo.includes('cmd') || combo.includes('command') || combo.includes('option');

/**
 * @returns true if the key combo contains non-mac hotkeys, such as `alt`, which is not on Mac keyboards.
 */
export const isNonMacKeyCombo = (combo: string): boolean => combo.includes('alt');

/**
 * @returns true if the key combo contains no hotkeys that are OS specific.
 */
export const isNonOSSpecificKeyCombo = (combo: string): boolean =>
  !(isMacKeyCombo(combo) || isNonMacKeyCombo(combo));

/**
 * Translates `mod` and `meta` keys into `ctrl`, and `alt` into `option`
 *
 * @param hotkeyStr a hotkey string that may have non-mac key names
 * @returns a hotkey string with mac key names
 */
function formatMacHotkeys(hotkeyStr: string) {
  return hotkeyStr.replace('alt', 'option').replace('mod', 'cmd').replace('meta', 'cmd');
}

/**
 * Translates `mod` and `meta` keys into `ctrl`
 *
 * @param hotkeyStr a hotkey string that may have non-mac key names
 * @returns a hotkey string with non-mac key names
 */
function formatNonMacHotkeys(hotkeyStr: string) {
  return hotkeyStr.replace('mod', 'ctrl').replace('meta', 'ctrl');
}

/**
 * Formats keys to match the expected operating system specific keys
 * for example, `mod` becomes `cmd` on a Mac, and `ctrl` on other operating systems.
 *
 * @param hotkeyStr a hotkey or hotkey combo
 */
export function formatHotkeysForOs(hotkeyStr: string | undefined) {
  if (hotkeyStr === undefined) return '';
  const os = getOS();
  let formattedCombo = hotkeyStr.toLowerCase();
  if (os === OSTypes.MAC) {
    formattedCombo = formatMacHotkeys(formattedCombo);
  } else {
    formattedCombo = formatNonMacHotkeys(formattedCombo);
  }
  return formattedCombo;
}

/**
 * Formats a key as a fully spelled out word
 */
function formatKeyLongForm(key: string): string {
  switch (key) {
    case 'ctrl':
      return 'control';
    case 'cmd':
      return 'command';
    default:
      return key;
  }
}

/**
 * Gets alternate versions of key names, such as `control` and `ctrl`
 * for use as searchable tags.
 */
function getAlternateTags(keys: string[]): string[] {
  const tagsToElaborate = keys
    .map(key => key.trim())
    .filter(
      key =>
        key === 'alt' ||
        key === 'option' ||
        key === 'mod' ||
        key === 'cmd' ||
        key === 'command' ||
        key === 'meta' ||
        key === 'control' ||
        key === 'ctrl'
    );
  const osTags = tagsToElaborate.map(formatHotkeysForOs);
  const longFormTags = [...tagsToElaborate, ...osTags].map(formatKeyLongForm);
  return Array.from(new Set([...osTags, ...longFormTags]));
}

/**
 * Adds alternate tags, so if a hotkey includes a key like `mod`
 * then it is searchable with `control` and `ctrl` on windows, or
 * `cmd` and `command` on a mac
 *
 * @param configs a list of hotkey configurations
 */
export function addAlternateKeyNameTagsToHotkeyConfiguration(
  configs: ConfigurationTypes.HotkeyConfiguration[]
) {
  return configs.map(shortcut => ({
    ...shortcut,
    tags: [
      ...(shortcut.tags || []),
      ...getAlternateTags(shortcut.combos.map(combo => combo.split('+')).flat())
    ]
  }));
}

/**
 * Formats a hotkey string to be in parenthesis, with the first character capitalized,
 * replacing `ctrl` with `control`, and with spaces around the + delimiter.
 *
 * @example control+alt+delete becomes (Ctrl + alt + delete)
 *
 * @param hotkeyStr {String} the hotkey string to parse
 * @returns a formatted string for display
 */
export function formatHotkeyString(hotkeyStr: string) {
  return `(${formatHotkeysForOs(hotkeyStr)
    .replace(/control/g, 'ctrl')
    .replace(/ ?\+ ?/g, ' + ')})`;
}
