import { IanDisplays, isValidDisplayName, toDisplayTitle } from '../../src/ts/displays/types';

describe('display types', () => {
  test('exists', () => {
    expect(isValidDisplayName).toBeDefined();
    expect(toDisplayTitle).toBeDefined();
  });

  test('can check for valid display name', () => {
    [...Object.values(IanDisplays)].forEach(d => {
      expect(isValidDisplayName(d)).toBeTruthy();
    });

    expect(isValidDisplayName('not valid')).toBeFalsy();
  });

  test('can get display title', () => {
    // IAN
    expect(toDisplayTitle(IanDisplays.EVENTS)).toMatchInlineSnapshot(`"Events"`);
    expect(toDisplayTitle(IanDisplays.MAP)).toMatchInlineSnapshot(`"Map"`);
    expect(toDisplayTitle(IanDisplays.SIGNAL_DETECTIONS)).toMatchInlineSnapshot(
      `"Signal Detections List"`
    );
    expect(toDisplayTitle(IanDisplays.STATION_PROPERTIES)).toMatchInlineSnapshot(
      `"Station Properties"`
    );
    expect(toDisplayTitle(IanDisplays.WAVEFORM)).toMatchInlineSnapshot(`"Waveform"`);
    expect(toDisplayTitle(IanDisplays.WORKFLOW)).toMatchInlineSnapshot(`"Workflow"`);
    expect(toDisplayTitle(IanDisplays.FILTERS)).toMatchInlineSnapshot(`"Filters"`);
    expect(toDisplayTitle(IanDisplays.AZIMUTH_SLOWNESS)).toMatchInlineSnapshot(
      `"Azimuth Slowness"`
    );
    expect(toDisplayTitle(IanDisplays.HISTORY)).toMatchInlineSnapshot(`"Undo/Redo"`);
  });
});
