import { ConfigurationTypes } from '@gms/common-model';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import {
  addDerivedColorsToTheme,
  getCssVarsFromTheme,
  UIThemeWrapper
} from '../../../../src/ts/app/initializers/ui-theme-wrapper';

const store = getStore();

describe('UIThemeWrapper', () => {
  test('is defined', () => {
    expect(UIThemeWrapper).toBeDefined();
  });

  test('matches snapshot', () => {
    const { container } = render(
      <Provider store={store}>
        <UIThemeWrapper>arbitrary children for wrapper</UIThemeWrapper>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  test('convert color theme to css', () => {
    expect(getCssVarsFromTheme(ConfigurationTypes.defaultColorTheme)).toMatchSnapshot();
  });
  describe('addDerivedColorsToTheme', () => {
    const derivedColorDefinitions = {
      waveformRaw: { darken: 0.2 },
      openEventSDColor: { lighten: 0.1 },
      gmsSelection: { darken: 0.1, lighten: 0.1 }
    };
    it('adds darkened and lightened colors to a theme', () => {
      const themeWithDerived = addDerivedColorsToTheme(
        ConfigurationTypes.defaultColorTheme,
        derivedColorDefinitions
      );
      expect(themeWithDerived.waveformRawDark).toBeDefined();
      expect(themeWithDerived.openEventSDColorLight).toBeDefined();
      expect(themeWithDerived.openEventSDColorLight).toBeDefined();
      expect(themeWithDerived).toMatchSnapshot();
    });
  });
});
