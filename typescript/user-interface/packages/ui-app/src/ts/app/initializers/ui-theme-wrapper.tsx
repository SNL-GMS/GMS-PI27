import { Classes } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import type { ColorTheme } from '@gms/common-model/lib/ui-configuration/types';
import {
  useLegibleColorsForEventAssociations,
  useUiTheme,
  useUpdateReduxWithConfigDefaults
} from '@gms/ui-state';
import { darkenColor, getLegibleHexColor, isHexColor, lightenColor } from '@gms/ui-util';
import upperFirst from 'lodash/upperFirst';
import * as React from 'react';

export interface DerivedColorModifier {
  /**
   * A number between 0 and 1. 0 has no effect, 1 will be solid black
   */
  darken?: number;
  /**
   * A number between 0 and 1. 0 has no effect, 1 will be solid white
   */
  lighten?: number;
}

export interface DerivedColorDefinitions {
  [colorName: string]: DerivedColorModifier;
}

type AddColorSuffix<T, P extends 'Dark' | 'Light'> = {
  // eslint-disable-next-line prettier/prettier
  [K in keyof T as K extends string ? `${K}${P}` : never]?: T[K]
};

/**
 * Colors derived from the default colors.
 */
const DerivedColorDefs: DerivedColorDefinitions = {
  analystOpenEvent: { darken: 0.1 },
  analystUnassociated: { darken: 0.1 },
  analystComplete: { darken: 0.1 },
  gmsProminentBackground: { darken: 0.1 },
  gmsRecessedBackground: { darken: 0.1 },
  deletedEventColor: { darken: 0.1 },
  deletedSdColor: { darken: 0.1 }
} as const;

export function addDerivedColorsToTheme(
  colorTheme: Partial<ColorTheme>,
  derivedColors = DerivedColorDefs
): AddColorSuffix<ColorTheme, 'Dark' | 'Light'> {
  const darkerColors: AddColorSuffix<ColorTheme, 'Dark'> = {};
  const lighterColors: AddColorSuffix<ColorTheme, 'Light'> = {};
  Object.entries(derivedColors).forEach(([colorName, colorAction]) => {
    if (colorAction.darken && colorTheme[colorName] != null) {
      darkerColors[`${colorName}Dark`] = darkenColor(colorTheme[colorName], colorAction.darken);
    }
    if (colorAction.lighten && colorTheme[colorName] != null) {
      lighterColors[`${colorName}Light`] = lightenColor(colorTheme[colorName], colorAction.lighten);
    }
  });
  return { ...colorTheme, ...darkerColors, ...lighterColors };
}

/**
 * Note: This will sanitize the variable using encodeURI.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI
 *
 * @param colorThemeProperty the camelCase string to convert into the css variable syntax
 * @returns a string in the form `--first-second-third` (that was originally in the format firstSecondThird).
 */
export const convertCamelCaseToCssVar = (colorThemeProperty: string): string => {
  const splitCssVariable = char => `-${char.toLowerCase()}`;
  return `--${window.encodeURI(colorThemeProperty).replace(/[A-Z]/g, splitCssVariable)}`;
};

/**
 * Flattens the theme class names so that nested colors are correctly serialized into css variables
 */
const flattenTheme = (
  ob: ColorTheme | Record<string, unknown>,
  prefix = ''
): Partial<ColorTheme> => {
  // The object which contains the
  // final result
  let result: Partial<ColorTheme> = {};

  // loop through the object "ob"
  Object.entries(ob).forEach(([key, val]: [string, Record<string, unknown>]) => {
    // We check the type of the i using
    // typeof() function and recursively
    // call the function again
    if (typeof val === 'object') {
      result = { ...result, ...flattenTheme(val, key) };
    } else if (prefix) {
      result[`${prefix}${upperFirst(key)}`] = val;
    } else {
      result[key] = val;
    }
  });
  return result;
};

/**
 * @param colorTheme is the color theme, consisting of string color names in camelCase, and values,
 * which are valid hex codes or alphanumeric color strings.
 *
 * Note, variable names will be sanitized using encodeURI.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI
 *
 * @returns an object of the form: {
 *   '--waveform-raw': colorTheme.waveformRaw,
 *   '--waveform-filter-label': colorTheme.waveformFilterLabel
 * }
 */
export const getCssVarsFromTheme = (
  colorTheme: ConfigurationTypes.ColorTheme
): Record<string, string> => {
  const flatTheme = flattenTheme(colorTheme);
  const extendedTheme = addDerivedColorsToTheme(flatTheme);
  return Object.keys(extendedTheme).reduce(
    (cssVars: Record<string, string>, colorThemeKey: string) => {
      const updatedTheme = { ...cssVars };
      updatedTheme[convertCamelCaseToCssVar(colorThemeKey)] = window.encodeURI(
        extendedTheme[colorThemeKey]
      );
      return updatedTheme;
    },
    {}
  );
};

/**
 * Injects the blueprint `.bp5-dark` dark mode class into the html element. Uses imperative query selector to get
 * a handle on the html, since we don't have a ref to it.
 * For light mode, we add a `.gms-light-mode` class instead.
 *
 * @param className the class name to add
 */
const injectBlueprintThemeClass = (className: 'gms-light-mode' | typeof Classes.DARK): void => {
  const html = document.querySelector('html');
  if (html) {
    html.className = className;
  }

  const body = document.querySelector('body');
  if (body) {
    body.className = className;
  }
};

const clearTheme = (targetElement: HTMLElement | null = document.querySelector('html')) => {
  targetElement?.attributeStyleMap?.clear();
};

export const injectTheme = (
  uiTheme: ConfigurationTypes.UITheme,
  targetElement: HTMLElement | null = document.querySelector('html')
): void => {
  const cssVars = getCssVarsFromTheme(uiTheme.colors);
  localStorage.setItem('uiTheme', JSON.stringify(uiTheme));
  Object.keys(cssVars).forEach(varName => {
    targetElement?.style.setProperty(varName, cssVars[varName]);
  });
  if (uiTheme.isDarkMode) {
    injectBlueprintThemeClass(Classes.DARK);
  } else {
    injectBlueprintThemeClass('gms-light-mode');
  }
};

export interface UIThemeWrapperProps {
  children: React.ReactNode;
  theme?: ConfigurationTypes.UITheme;
}

/**
 * A component that will read in the current UI Theme from Redux, and inject it into the html element
 * `style` as css variables.
 */
export function UIThemeWrapper({ children, theme }: UIThemeWrapperProps) {
  const [uiTheme] = useUiTheme();
  const cssCustomAssociationProperties = useLegibleColorsForEventAssociations();
  const tableSelectionTextColor = isHexColor(uiTheme.colors.gmsTableSelection)
    ? getLegibleHexColor(uiTheme.colors.gmsTableSelection)
    : uiTheme.colors.gmsMain;

  // TODO: ui.processing-config is invoked and loaded first here (useUiTheme above) so this is a convenient place to put these config to redux updates,
  // TODO: however should loading the config for the first time happen higher up in the app?
  useUpdateReduxWithConfigDefaults();

  React.useEffect(() => {
    clearTheme();
    injectTheme(theme ?? uiTheme);
  }, [theme, uiTheme]);

  return (
    <div
      className={`gms-theme-provider ${uiTheme.isDarkMode ? Classes.DARK : ''}`}
      key={theme?.name}
      style={
        {
          ...cssCustomAssociationProperties,
          '--table-selection-text-color': tableSelectionTextColor
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
