import type { HotkeyConfiguration } from '@gms/common-model/lib/ui-configuration/types';

import { getStore } from '../../../../src/ts/app';
import {
  buildHotkeyConfigArray,
  getUiTheme
} from '../../../../src/ts/app/api/processing-configuration';

const store = getStore();
describe('Processing Configuration Util', () => {
  it('can retrieve ui theme configuration', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(getUiTheme(store.getState)).toMatchSnapshot();
  });
  it('can convert a HotkeyConfiguration to a blueprint HotkeyConfig', () => {
    const shortcutConfig: HotkeyConfiguration = {
      description: 'Test description',
      combos: ['ctrl+x', 'alt+x'],
      helpText: 'help text',

      categories: ['category', 'category2']
    };

    const mockCallback = jest.fn();

    const result = buildHotkeyConfigArray(shortcutConfig, mockCallback);

    // Global and disabled default to false
    expect(result[0].global).toBeFalsy();
    expect(result[0].disabled).toBeFalsy();

    // Records are built for both combinations
    expect(result).toHaveLength(2);
    expect(result[0].combo).toEqual('ctrl+x');
    expect(result[1].combo).toEqual('alt+x');

    // Disabled can be set to true
    const result2 = buildHotkeyConfigArray(shortcutConfig, mockCallback, undefined, true);
    expect(result2[0].global).toBeFalsy();
    expect(result2[0].disabled).toBeTruthy();

    // Global can be set to true
    const result3 = buildHotkeyConfigArray(shortcutConfig, mockCallback, undefined, false, true);
    expect(result3[0].global).toBeTruthy();
    expect(result3[0].disabled).toBeFalsy();
  });
});
