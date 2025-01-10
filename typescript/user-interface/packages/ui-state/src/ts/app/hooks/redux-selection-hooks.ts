import { Displays } from '@gms/common-model';
import React from 'react';
import { batch } from 'react-redux';

import { analystActions, commonActions, selectSelectedStationsAndChannelIds } from '../state';
import { useAppDispatch, useAppSelector } from './react-redux-hooks';

/**
 * Hook to handle deselection of everything
 *
 * @returns a stable function to deselect everything
 */
export const useDeselectAll = () => {
  const dispatch = useAppDispatch();
  return React.useCallback(() => {
    batch(() => {
      dispatch(analystActions.setSelectedWaveforms([]));
      dispatch(analystActions.setSelectedSdIds([]));
      dispatch(analystActions.setSelectedEventIds([]));
      dispatch(commonActions.setSelectedStationIds([]));
    });
  }, [dispatch]);
};

/**
 * Hook that handles deselection of all per display
 *
 * @param displayName name of the display
 * @returns stable callback that handles deselection per display
 */
export const useDeselect = (displayName: string) => {
  const dispatch = useAppDispatch();
  const deselectAll = useDeselectAll();
  const selectedStationsAndChannels = useAppSelector(selectSelectedStationsAndChannelIds);
  const selectedChannels = selectedStationsAndChannels.filter(name => name.includes('.'));

  const waveformDeselectAll = React.useCallback(() => {
    batch(() => {
      dispatch(analystActions.setSelectedSdIds([]));
      dispatch(analystActions.setSelectedWaveforms([]));
      dispatch(commonActions.setSelectedStationIds([]));
    });
  }, [dispatch]);
  const mapDeselectAll = React.useCallback(() => {
    batch(() => {
      dispatch(analystActions.setSelectedSdIds([]));
      dispatch(analystActions.setSelectedEventIds([]));
      dispatch(commonActions.setSelectedStationIds(selectedChannels));
    });
  }, [dispatch, selectedChannels]);
  const eventsDeselectAll = React.useCallback(() => {
    dispatch(analystActions.setSelectedEventIds([]));
  }, [dispatch]);
  const signalDetectionsDeselectAll = React.useCallback(() => {
    dispatch(analystActions.setSelectedSdIds([]));
  }, [dispatch]);
  switch (displayName) {
    case Displays.IanDisplays.WAVEFORM:
      return waveformDeselectAll;
    case Displays.IanDisplays.MAP:
      return mapDeselectAll;
    case Displays.IanDisplays.EVENTS:
      return eventsDeselectAll;
    case Displays.IanDisplays.SIGNAL_DETECTIONS:
      return signalDetectionsDeselectAll;
    default:
      return deselectAll;
  }
};
