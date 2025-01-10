import type { WorkflowTypes } from '@gms/common-model';
import { toOSDTime } from '@gms/common-util';
import { analystInitialState, exportWaveformStore, getStore } from '@gms/ui-state';
import cloneDeep from 'lodash/cloneDeep';

import type { GmsExport } from './types';

const context = typeof window === 'undefined' ? global : window;

/**
 * A string indicating that an object serialized to JSON is a TypedArray, and not a normal array
 */
export const FLAG_TYPED_ARRAY = 'FLAG_TYPED_ARRAY';

/**
 * ! This needs to be updated whenever a change is made that would make an old redux store or waveform store invalid
 * This version gets added to all .gms files that are saved.
 * On load, this will be checked against the file version of the running application
 */
export const GMS_FILE_VERSION = `0.2`;

export const acceptedFileTypes = [
  {
    description: 'GMS file',
    accept: { 'application/json': ['.gms'] }
  }
];

/**
 * Serialize an object, handling TypedArrays
 *
 * @see {@link deserialize}
 *
 * @param obj any object
 * @returns A JSON serialized version of the object that can handle TypedArrays
 */
export const serialize = (obj: unknown) =>
  `${JSON.stringify(obj, function serializeWithTypedArray(key, value) {
    // the replacer function is looking for some typed arrays.
    // If found, it replaces it
    if (
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Uint8ClampedArray ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Float32Array ||
      value instanceof Float64Array
    ) {
      const replacement = {
        constructor: value.constructor.name,
        data: Array.from(value),
        flag: FLAG_TYPED_ARRAY
      };
      return replacement;
    }
    return value;
    // Append \n to the read process so readGmsExport will know where the end of
    // this chunk of json is
  })}\n`;

/**
 * Serialize an object, handling TypedArrays
 *
 * @see {@link deserialize }
 *
 * @param obj any object
 * @returns A JSON serialized version of the object that can handle TypedArrays
 */
export const deserialize = (jsonStr: string) => {
  return JSON.parse(jsonStr, function deserializeWithTypedArrays(key, value) {
    // the reviver function looks for the typed array flag
    try {
      if ('flag' in value && value.flag === FLAG_TYPED_ARRAY) {
        // if found, we convert it back to a typed array
        return new context[value.constructor](value.data);
      }
    } catch (e) {
      // no-op
    }

    // if flag not found no conversion is done
    return value;
  });
};

/**
 * @param stage A workflow stage interval ID used to generate the filename
 * @returns a filename string, in the format `<workflow id>-<start time as date>.<file version>.gms`
 */
export function buildGmsFileName(stage: WorkflowTypes.IntervalId | undefined) {
  const dateStr = stage?.startTime ? `-${toOSDTime(stage?.startTime)}` : '';
  return `${stage?.definitionId.name ?? ''}${dateStr}.${GMS_FILE_VERSION}.gms`;
}

/**
 * parse major and minor numbers out of a potential version number string
 *
 * @throws if the version number string is not separated by `.` and not of length 2.
 *
 * @param versionString a string representing a GMS version number, such as `1.2`
 * @returns the version number
 */
export function parseVersionNumber(versionString: string): { major: number; minor: number } {
  const splitStr = versionString.split('.');
  if (splitStr.length !== 2) {
    throw new Error(
      `Invalid version number ${versionString}. Version number should be of the format X.X`
    );
  }
  return {
    major: Number.parseInt(splitStr[0], 10),
    minor: Number.parseInt(splitStr[1], 10)
  };
}

/**
 * Returns true if the version string provided is supported by this version of GMS
 *
 * @param versionString a version string from a GMS file
 */
export function isSupportedVersion(versionString: string) {
  const versionInfo = parseVersionNumber(versionString);
  const currentVersionInfo = parseVersionNumber(GMS_FILE_VERSION);
  if (versionInfo.major >= currentVersionInfo.major) {
    return true;
  }
  return false;
}

/**
 * @returns Returns a help string from an invalid version number string.
 * @throws if we don't know how to handle this type of invalid version info string.
 */
export function getInvalidVersionHelpString(versionInfo: string) {
  if (versionInfo == null) {
    return 'No version number found. Is this a supported .gms file?';
  }
  try {
    if (!isSupportedVersion(versionInfo)) {
      return `Version ${versionInfo} is lower than the current supported version: ${GMS_FILE_VERSION}`;
    }
  } catch (e) {
    return 'Version is in an invalid format. File may be corrupted';
  }
  throw new Error(
    'Invalid version. Cannot get an invalid version help string for a valid version number'
  );
}

/**
 * Reads a .gms file from disk and returns the data in the {@link GmsExport} format
 *
 * @param fileHandle the file handle used to read the content
 * @returns the results of the read operation as a {@link GmsExport} object
 */
export async function readGmsExport(fileHandle: FileSystemFileHandle): Promise<GmsExport> {
  const textDecoder = new TextDecoder();
  const file = await fileHandle.getFile();
  const reader = file.stream().getReader();

  // Unprocessed contiguous string chunks of data
  const chunks: string[] = [''];

  // Process a chunk read
  const processRead = async ({ done, value }: ReadableStreamReadResult<Uint8Array>) => {
    // Decode the Uint8Array as a string value
    const chunk = textDecoder.decode(value);

    if (!chunk.includes('\n')) {
      // If the chunk does not include \n there are no breaks in the data, just add it to the last chunk
      chunks[chunks.length - 1] += chunk;
    } else {
      const startsWithNewline = chunk.startsWith('\n');
      const endsWithNewline = chunk.endsWith('\n');
      const parts = chunk.split('\n');

      // If the chunk does not start with a new line, shift the first part to the last chunk
      // as its the end of that data chunk
      if (!startsWithNewline) {
        chunks[chunks.length - 1] += parts.shift();
      }

      // Push all parts to chunks
      chunks.push(...parts);

      // If the chunk ends with a newline, push an empty string so we know the next chunk is the start
      if (endsWithNewline) {
        chunks.push('');
      }
    }

    // If were not done, process another read
    if (!done) {
      await reader.read().then(processRead);
    }
  };

  // Begin processing read
  await reader.read().then(processRead);

  // Deserialize all the chunks into JSON
  const [primary, ...waveformData] = chunks.filter(value => value !== '').map(deserialize);

  return {
    versionInfo: primary.versionInfo,
    reduxStore: primary.reduxStore,
    // Take the array of objects, and reduce them into a single object
    waveformStore: waveformData.reduce((result, value) => {
      return {
        ...result,
        ...value
      };
    }, {})
  };
}

/**
 * Saves the redux store and waveform data into a GMS readable file format. The GMS file format
 * writes a primary json block to the first line of the file. The primary block contains
 * { versionInfo, reduxStore }. All subsequent lines contain a waveform data entry, which consists
 * of { claimCheckID: Float64Array }. The reason for this is to avoid issues hitting the max
 * string length when serializing or deserializing JSON.
 *
 * @param fileHandle the file handle we will use to save the content
 */
export async function saveGmsExport(fileHandle: FileSystemFileHandle): Promise<void> {
  const reduxStore = cloneDeep(getStore().getState());

  // Sanitize some values out of the reduxStore
  reduxStore.app.analyst.requestTracker = analystInitialState.requestTracker;

  // Create blob of redux store
  const primaryBlob = new Blob(
    [serialize({ versionInfo: GMS_FILE_VERSION, reduxStore: getStore().getState() })],
    {
      type: 'application/json; charset=utf-8'
    }
  );

  // Get the waveform store to export
  const waveformStore = await exportWaveformStore();

  // Create the writable stream
  const writableStream = await fileHandle.createWritable();

  // Write the redux primary blob (includes versionInfo and reduxStore) on the first line
  await writableStream.write(primaryBlob);

  Object.entries(waveformStore).forEach(async ([key, waveforms]) => {
    // Write each waveform store entry to new lines in the file
    await writableStream.write(
      new Blob([serialize({ [key]: waveforms })], {
        type: 'application/json; charset=utf-8'
      })
    );
  });

  // Close the stream
  await writableStream.close();
}
