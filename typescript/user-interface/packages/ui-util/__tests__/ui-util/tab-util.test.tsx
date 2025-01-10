import {
  focusToFirstTabbableElementByClassname,
  getTabbableElementsByClassname,
  handleTabOrArrows,
  isPreviousTabbableKey,
  isTabbableKey
} from '../../src/ts/ui-util';

describe('Tab Utils', () => {
  test('exists', () => {
    expect(getTabbableElementsByClassname).toBeDefined();
    expect(focusToFirstTabbableElementByClassname).toBeDefined();
    expect(isTabbableKey).toBeDefined();
    expect(isPreviousTabbableKey).toBeDefined();
    expect(handleTabOrArrows).toBeDefined();
  });

  test('is tabbable key', () => {
    const up: React.KeyboardEvent<HTMLElement> = { key: 'ArrowUp' } as any;
    expect(isTabbableKey(up)).toBeTruthy();

    const down: React.KeyboardEvent<HTMLElement> = { key: 'ArrowDown' } as any;
    expect(isTabbableKey(down)).toBeTruthy();

    const tab: React.KeyboardEvent<HTMLElement> = { key: 'Tab' } as any;
    expect(isTabbableKey(tab)).toBeTruthy();

    const other: React.KeyboardEvent<HTMLElement> = { key: 'a' } as any;
    expect(isTabbableKey(other)).toBeFalsy();
  });

  test('is previous tabbable key', () => {
    const up: React.KeyboardEvent<HTMLElement> = { key: 'ArrowUp' } as any;
    expect(isPreviousTabbableKey(up)).toBeTruthy();

    const down: React.KeyboardEvent<HTMLElement> = { key: 'ArrowDown' } as any;
    expect(isPreviousTabbableKey(down)).toBeFalsy();

    const tab: React.KeyboardEvent<HTMLElement> = { key: 'Tab' } as any;
    expect(isPreviousTabbableKey(tab)).toBeFalsy();

    const tabWithShift: React.KeyboardEvent<HTMLElement> = { key: 'Tab', shiftKey: true } as any;
    expect(isPreviousTabbableKey(tabWithShift)).toBeTruthy();

    const other: React.KeyboardEvent<HTMLElement> = { key: 'a' } as any;
    expect(isPreviousTabbableKey(other)).toBeFalsy();
  });

  test('get tabbable elements', () => {
    // Set up our document body
    document.body.innerHTML =
      '<div class="container"><div id="item1" tabIndex=1 class="tabbable">item 1</div><div id="item2" tabIndex=1 class="tabbable">item 2</div><button id="button" /></div>';
    expect(getTabbableElementsByClassname('container', 'tabbable')).toHaveLength(2);
    expect(getTabbableElementsByClassname('container', 'tabbable')).toMatchInlineSnapshot(`
      [
        <div
          class="tabbable"
          id="item1"
          tabindex="1"
        >
          item 1
        </div>,
        <div
          class="tabbable"
          id="item2"
          tabindex="1"
        >
          item 2
        </div>,
      ]
    `);
  });

  test('set focus to first item', () => {
    // Set up our document body
    document.body.innerHTML =
      '<div class="container"><div id="item1" tabIndex=1 class="tabbable">item 1</div><div id="item2" tabIndex=1 class="tabbable">item 2</div><button id="button" /></div>';
    document.getElementById('button')?.focus();
    expect(document.activeElement).toMatchInlineSnapshot(`
      <button
        id="button"
      />
    `);
    focusToFirstTabbableElementByClassname('container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item1"
        tabindex="1"
      >
        item 1
      </div>
    `);
  });

  test('can handle tab event', () => {
    // Set up our document body
    document.body.innerHTML =
      '<div class="container"><div id="item1" tabIndex=1 class="tabbable">item 1</div><div id="item2" tabIndex=1 class="tabbable">item 2</div><button id="button" /></div>';

    focusToFirstTabbableElementByClassname('container', 'tabbable');

    const up: React.KeyboardEvent<HTMLElement> = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
    handleTabOrArrows(up, 'container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item2"
        tabindex="1"
      >
        item 2
      </div>
    `);

    const down: React.KeyboardEvent<HTMLElement> = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
    handleTabOrArrows(down, 'container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item1"
        tabindex="1"
      >
        item 1
      </div>
    `);

    const tab: React.KeyboardEvent<HTMLElement> = {
      key: 'Tab',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
    handleTabOrArrows(tab, 'container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item2"
        tabindex="1"
      >
        item 2
      </div>
    `);

    const tabWithShift: React.KeyboardEvent<HTMLElement> = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
    handleTabOrArrows(tabWithShift, 'container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item1"
        tabindex="1"
      >
        item 1
      </div>
    `);

    const other: React.KeyboardEvent<HTMLElement> = {
      key: 'a',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as any;
    handleTabOrArrows(other, 'container', 'tabbable');
    expect(document.activeElement).toMatchInlineSnapshot(`
      <div
        class="tabbable"
        id="item1"
        tabindex="1"
      >
        item 1
      </div>
    `);
  });
});
