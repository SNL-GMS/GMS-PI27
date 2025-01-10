import { getStore } from '@gms/ui-state';

import {
  GMS_FILE_VERSION,
  readGmsExport,
  saveGmsExport,
  serialize
} from '~analyst-ui/common/save-load/save-load-util';

const mockWrite = jest.fn();

const mockCreateWritable = jest.fn().mockImplementation(() => {
  return {
    write: mockWrite,
    close: jest.fn()
  };
});

const mockGetReader = jest.fn().mockImplementation(() => {
  const textEncoder = new TextEncoder();
  const chunks = [
    `{"version`,
    `Info":"${GMS_FILE_VERSION}","re`,
    `duxStore":{}}\n`,
    `{"a":[1,2`,
    `,3,4,5,6,7,8,9]}\n`,
    `{"b":[1,2,3,4,5,6,7,8,9]}\n`,
    `{"c":[1,2,3,4,5,6,7,8,9]}\n{"d":[1,2,3,4,5,6,7,8,9]}`,
    `\n\n`
  ];
  return {
    read: jest.fn(async () => {
      const done = chunks.length === 1;
      const chunk = chunks.shift();

      return Promise.resolve({
        done,
        value: textEncoder.encode(chunk)
      });
    })
  };
});

const mockGetStream = jest.fn().mockImplementation(() => {
  return {
    getReader: mockGetReader
  };
});

const mockGetFile = jest.fn().mockImplementation(() => {
  return {
    stream: mockGetStream
  };
});

const FileSystemFileHandle = jest.fn().mockImplementation(() => {
  return {
    createWritable: mockCreateWritable,
    getFile: mockGetFile
  };
});

const arrayLen = 9;
const arrayMatch = Array(arrayLen)
  .fill(0)
  .map((val, index) => index + 1);

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');

  return {
    ...actual,
    exportWaveformStore: async (): Promise<Record<string, Float64Array>> => {
      return Promise.resolve({
        a: new Float64Array(arrayMatch),
        b: new Float64Array(arrayMatch),
        c: new Float64Array(arrayMatch),
        d: new Float64Array(arrayMatch)
      });
    }
  };
});

describe('save and load utils', () => {
  it('saveGmsExport', async () => {
    const a = new FileSystemFileHandle();
    await saveGmsExport(a);
    expect(mockWrite).toHaveBeenCalled();
    const primaryBlob = new Blob(
      [serialize({ versionInfo: GMS_FILE_VERSION, reduxStore: getStore().getState() })],
      {
        type: 'application/json; charset=utf-8'
      }
    );
    expect(mockWrite).toHaveBeenCalledWith(expect.objectContaining(primaryBlob));
    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining(
        new Blob([serialize({ a: new Float64Array(arrayMatch) })], {
          type: 'application/json; charset=utf-8'
        })
      )
    );
    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining(
        new Blob([serialize({ b: new Float64Array(arrayMatch) })], {
          type: 'application/json; charset=utf-8'
        })
      )
    );
    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining(
        new Blob([serialize({ c: new Float64Array(arrayMatch) })], {
          type: 'application/json; charset=utf-8'
        })
      )
    );
    expect(mockWrite).toHaveBeenCalledWith(
      expect.objectContaining(
        new Blob([serialize({ d: new Float64Array(arrayMatch) })], {
          type: 'application/json; charset=utf-8'
        })
      )
    );
  });

  it('readGmsExport', async () => {
    const a = new FileSystemFileHandle();
    const gmsExport = await readGmsExport(a);

    expect(gmsExport).toMatchObject({
      versionInfo: GMS_FILE_VERSION,
      reduxStore: {},
      waveformStore: {
        a: arrayMatch,
        b: arrayMatch,
        c: arrayMatch,
        d: arrayMatch
      }
    });
  });
});
