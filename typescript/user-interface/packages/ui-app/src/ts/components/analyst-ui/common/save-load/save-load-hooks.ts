import type { HotkeyConfig, UseHotkeysReturnValue } from '@blueprintjs/core';
import { useHotkeys } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import {
  analystActions,
  buildHotkeyConfigArray,
  importWaveformStore,
  loadStore,
  selectFileId,
  selectWorkflowIntervalUniqueId,
  useAppDispatch,
  useAppSelector,
  useKeyboardShortcutConfigurations,
  useStageId
} from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import * as React from 'react';
import { toast } from 'react-toastify';

import {
  acceptedFileTypes,
  buildGmsFileName,
  getInvalidVersionHelpString,
  isSupportedVersion,
  readGmsExport,
  saveGmsExport
} from './save-load-util';
import type { GmsExport } from './types';

const logger = UILogger.create('GMS_SAVE_LOAD', process.env.GMS_SAVE_LOAD);

/**
 * @returns a suggested GMS file name based on the info in the workflow stage id
 */
export function useGmsFileName() {
  const stage = useStageId();
  return buildGmsFileName(stage);
}

/**
 * @see {@link GmsExport}
 * @returns a function which imports a GmsExport object (the data from a saved file)
 */
export function useImportGms(): (gmsExport: GmsExport) => Promise<void> {
  const dispatch = useAppDispatch();
  return React.useCallback(
    async (gmsExport: GmsExport) => {
      await importWaveformStore(gmsExport.waveformStore);
      dispatch(loadStore(gmsExport.reduxStore));
    },
    [dispatch]
  );
}

/**
 * @param suggestedFileName a suggested file name from which to get a file handle
 * Note, the user may choose a different name.
 * @returns a file handle
 */
function getNewFileHandle(suggestedFileName: string) {
  const opts = {
    suggestedName: suggestedFileName,
    types: acceptedFileTypes,
    create: true
  };
  return (window as any).showSaveFilePicker(opts);
}

/**
 * Creates a function for loading a gms file from disc. Prompts the user for the file name,
 * and stores the file handle in redux. Updates the loading indicator before/after, including
 * with error states.
 *
 * @returns a function to load GMS from a file
 */
function useLoadGmsFromFile(): () => Promise<void> {
  const dispatch = useAppDispatch();
  const importGms = useImportGms();
  const workflowUniqueId = useAppSelector(selectWorkflowIntervalUniqueId);

  const loadGmsFromFile = React.useCallback(async () => {
    let fileHandleForInterval: {
      workflowUniqueId: string;
      fileHandle: FileSystemFileHandle;
    };

    try {
      const fileHandles: FileSystemFileHandle[] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: acceptedFileTypes
      });
      fileHandleForInterval = {
        workflowUniqueId,
        // bug in typescript types means we have to use any
        fileHandle: fileHandles[0]
      };
    } catch (e) {
      return; // no-op if the user cancels
    }

    const fileName = fileHandleForInterval.fileHandle.name;

    const gmsExport = await readGmsExport(fileHandleForInterval.fileHandle);

    const id = uuid.asString();
    dispatch(
      analystActions.trackPendingRequests([
        {
          id,
          message: 'REQUEST_INITIATED',
          clientAction: `File ${fileName}`,
          actionType: 'CLIENT_SIDE_ACTION'
        }
      ])
    );

    let isSupported;

    try {
      isSupported = isSupportedVersion(gmsExport.versionInfo ?? '0.0');
    } catch (e) {
      isSupported = false;
    }

    if (!isSupported) {
      toast.warn(
        `Unsupported file version. ${getInvalidVersionHelpString(
          gmsExport.versionInfo
        )} Attempting to load file...`,
        {
          toastId: 'toast-invalid-file-version'
        }
      );
    }

    try {
      await importGms(gmsExport);

      fileHandleForInterval = {
        workflowUniqueId: selectWorkflowIntervalUniqueId(gmsExport.reduxStore),
        fileHandle: fileHandleForInterval.fileHandle
      };
      dispatch(analystActions.setFileId(fileHandleForInterval));
      dispatch(
        analystActions.trackCompletedRequests([
          {
            id,
            message: 'REQUEST_COMPLETED',
            clientAction: `File ${fileName}`,
            actionType: 'CLIENT_SIDE_ACTION'
          }
        ])
      );
    } catch (errorLoadingFileData) {
      logger.error(errorLoadingFileData);

      dispatch(
        analystActions.trackCompletedRequests([
          {
            id,
            message: 'REQUEST_COMPLETED',
            clientAction: `File ${fileName}`,
            actionType: 'CLIENT_SIDE_ACTION',
            error: `Unexpected Error: There was a problem loading the file: ${
              errorLoadingFileData?.message ?? JSON.stringify(errorLoadingFileData)
            }}`
          }
        ])
      );
      toast.error(
        `Error loading file ${fileName}. Attempting to revert to previous application state.`,
        {
          toastId: 'toast-failed-to-load-file'
        }
      );
    }
  }, [dispatch, importGms, workflowUniqueId]);

  return loadGmsFromFile;
}

/**
 * A function to determine if files may be saved or not
 */
function useIsSaveEnabled() {
  const stage = useStageId();
  return stage?.startTime != null;
}

/**
 * Creates a function to save files. Prompt for the user to choose a file name if we don't have a file handle,
 * or if the interval has changed, or if the flag `true` is passed in (indicating that this is a "save as" action)
 *
 * @returns a function to save the state of the app to a .gms file
 */
function useSaveGmsToFile() {
  const dispatch = useAppDispatch();
  const suggestedFileName = useGmsFileName();
  const isSaveEnabled = useIsSaveEnabled();
  const workflowUniqueId = useAppSelector(selectWorkflowIntervalUniqueId);
  const fileId = useAppSelector(selectFileId);

  return React.useCallback(
    async (saveAs = false) => {
      let fileHandleForInterval = fileId;
      if (!isSaveEnabled) {
        toast.warn('No interval open. Did you really mean to save?', {
          toastId: 'toast-no-interval-open'
        });
      }
      try {
        // update file handle if it needs to change
        if (
          saveAs ||
          fileId == null ||
          fileId.workflowUniqueId == null ||
          fileId.workflowUniqueId !== workflowUniqueId ||
          !fileId.fileHandle?.name
        ) {
          fileHandleForInterval = {
            workflowUniqueId,
            fileHandle: await getNewFileHandle(fileId?.fileHandle?.name ?? suggestedFileName)
          };
          dispatch(analystActions.setFileId(fileHandleForInterval));
        }
        try {
          if (fileHandleForInterval.fileHandle) {
            dispatch(
              analystActions.trackPendingRequests([
                {
                  id: `save: ${workflowUniqueId}`,
                  message: 'REQUEST_INITIATED',
                  clientAction: `Saving file ${fileHandleForInterval.fileHandle.name}`,
                  actionType: 'CLIENT_SIDE_ACTION'
                }
              ])
            );

            await saveGmsExport(fileHandleForInterval.fileHandle);

            dispatch(
              analystActions.trackCompletedRequests([
                {
                  id: `save: ${workflowUniqueId}`,
                  message: 'REQUEST_COMPLETED',
                  clientAction: `Saving file ${fileHandleForInterval.fileHandle.name}`,
                  actionType: 'CLIENT_SIDE_ACTION'
                }
              ])
            );
          }
        } catch (e) {
          logger.error(e);
          toast.error('There was a problem saving the file', {
            toastId: 'toast-error-saving-file'
          });
          dispatch(
            analystActions.trackCompletedRequests([
              {
                id: `save: ${workflowUniqueId}`,
                message: 'REQUEST_COMPLETED',
                clientAction: `Saving file ${fileHandleForInterval.fileHandle?.name}`,
                actionType: 'CLIENT_SIDE_ACTION',
                error: `Unexpected Error: There was a problem saving the file: ${
                  e?.message ?? JSON.stringify(e)
                }}`
              }
            ])
          );
        }
      } catch (e) {
        // simply do nothing if user aborts the request
      }
    },
    [dispatch, fileId, isSaveEnabled, suggestedFileName, workflowUniqueId]
  );
}

/**
 * @returns an object containing
 * `isSaveEnabled` boolean indicating whether save is currently supported
 * `saveGmsToFile` a function save the GMS state to a file
 * `loadGmsFromFile` a function to load the GMS from a file
 */
export function useFileSaveLoad() {
  return {
    isSaveEnabled: useIsSaveEnabled(),
    saveGmsToFile: useSaveGmsToFile(),
    loadGmsFromFile: useLoadGmsFromFile()
  };
}

/**
 * @returns the {@link KeyboardShortcutConfig} for file save, save as, and load
 */
export const useSaveLoadKeyboardShortcutConfig = (
  key: 'saveGmsToFile' | 'saveGmsToFileAs' | 'loadGmsFromFile'
): ConfigurationTypes.HotkeyConfiguration => {
  const keyboardShortcutConfig = useKeyboardShortcutConfigurations();
  return keyboardShortcutConfig && keyboardShortcutConfig.hotkeys
    ? keyboardShortcutConfig.hotkeys[key]
    : undefined;
};

/**
 * @returns the {@link HotkeyConfig} for saving a .gms file
 */
export const useSaveHotkeyConfig = (): HotkeyConfig[] => {
  const config = useSaveLoadKeyboardShortcutConfig('saveGmsToFile');
  const { saveGmsToFile, isSaveEnabled } = useFileSaveLoad();
  const saveHotkeyHandler = React.useCallback(async () => {
    await saveGmsToFile(false);
  }, [saveGmsToFile]);
  return React.useMemo(() => {
    return buildHotkeyConfigArray(config, saveHotkeyHandler, undefined, !isSaveEnabled, true);
  }, [config, isSaveEnabled, saveHotkeyHandler]);
};

/**
 * @returns the {@link HotkeyConfig} for save as (of a .gms file)
 */
export const useSaveAsHotkeyConfig = (): HotkeyConfig[] => {
  const config = useSaveLoadKeyboardShortcutConfig('saveGmsToFileAs');
  const { saveGmsToFile, isSaveEnabled } = useFileSaveLoad();
  const saveAsHotkeyHandler = React.useCallback(async () => {
    await saveGmsToFile(true);
  }, [saveGmsToFile]);
  return React.useMemo(() => {
    return buildHotkeyConfigArray(config, saveAsHotkeyHandler, undefined, !isSaveEnabled, true);
  }, [config, isSaveEnabled, saveAsHotkeyHandler]);
};

/**
 * @returns the {@link HotkeyConfig} for loading a .gms file
 */
export const useLoadHotkeyConfig = (): HotkeyConfig[] => {
  const config = useSaveLoadKeyboardShortcutConfig('loadGmsFromFile');
  const { loadGmsFromFile } = useFileSaveLoad();
  return React.useMemo(() => {
    return buildHotkeyConfigArray(config, loadGmsFromFile, undefined, false, true);
  }, [config, loadGmsFromFile]);
};

/**
 * Creates three hotkey config arrays:
 * [loadHotkeyConfig, saveAsHotkeyConfig, saveHotkeyConfig]
 *
 * @returns an array of {@link HotkeyConfig} for save/save-as/load
 */
export const useSaveLoadHotkeyConfig = (): HotkeyConfig[] => {
  const saveHotkeyConfig = useSaveHotkeyConfig();
  const saveAsHotkeyConfig = useSaveAsHotkeyConfig();
  const loadHotkeyConfig = useLoadHotkeyConfig();
  return React.useMemo(() => {
    const config: HotkeyConfig[] = [];
    if (saveHotkeyConfig) {
      config.push(...saveHotkeyConfig);
    }
    if (saveAsHotkeyConfig) {
      config.push(...saveAsHotkeyConfig);
    }
    if (loadHotkeyConfig) {
      config.push(...loadHotkeyConfig);
    }
    return config;
  }, [loadHotkeyConfig, saveAsHotkeyConfig, saveHotkeyConfig]);
};

/**
 * Sets up and configures the hotkeys for save/load.
 * Includes: save, save as, load
 *
 * @returns the {@link UseHotkeysReturnValue} for save/load
 */
export const useSaveLoadHotKeys = (): UseHotkeysReturnValue => {
  return useHotkeys(useSaveLoadHotkeyConfig());
};
