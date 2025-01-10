import { Menu, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import type { ToolbarTypes } from '@gms/ui-core-components';
import {
  ButtonToolbarItem,
  DropdownToolbarItem,
  PopoverButtonToolbarItem,
  Toolbar
} from '@gms/ui-core-components';
import {
  FkThumbnailsFilterType,
  selectCurrentFkThumbnailFilter,
  useAppSelector,
  useGetFkMeasuredValues,
  useIsFkAccepted,
  useSetCurrentFkThumbnailFilter,
  useSignalDetections,
  useUpdateSignalDetectionAcceptFk
} from '@gms/ui-state';
import React from 'react';

import { useNextFk } from '../fk-hooks';

const MARGINS_FOR_TOOLBAR_PX = 0;
/**
 * Fk Thumbnails Controls Props
 */
export interface FkThumbnailsControlsProps {
  readonly fkThumbnailColumnSizePx: number;
  readonly anyDisplayedFksNeedReview: boolean;
  readonly setFkThumbnailSizePx: (px: number) => void;
  /** hidden thumbnail state */
  readonly hiddenThumbnails: string[];
  /** hidden thumbnail state setter */
  readonly setHiddenThumbnails: React.Dispatch<React.SetStateAction<string[]>>;
  readonly selectedSdIds: string[];
  readonly filteredSignalDetections: SignalDetectionTypes.SignalDetection[];
}

/**
 * Pixels widths of available thumbnail sizes
 */
export enum FkThumbnailSize {
  SMALL = 70,
  MEDIUM = 110,
  LARGE = 150
}

/**
 * FK Thumbnails Controls Component
 * Filtering / review controls for the FK
 */
export function FkThumbnailsControls({
  fkThumbnailColumnSizePx,
  anyDisplayedFksNeedReview,
  setFkThumbnailSizePx,
  hiddenThumbnails,
  setHiddenThumbnails,
  selectedSdIds,
  filteredSignalDetections
}: FkThumbnailsControlsProps) {
  const currentFkThumbnailFilter: FkThumbnailsFilterType = useAppSelector(
    selectCurrentFkThumbnailFilter
  );

  const getFkMeasuredValues = useGetFkMeasuredValues();
  const nextFk = useNextFk();
  const setCurrentFkThumbnailFilter = useSetCurrentFkThumbnailFilter();
  const acceptFk = useUpdateSignalDetectionAcceptFk();
  const signalDetections = useSignalDetections();
  const isAccepted = useIsFkAccepted();

  const handleFkThumbnailFilterChange = React.useCallback(
    value => {
      setCurrentFkThumbnailFilter(value);
      setHiddenThumbnails([]);
    },
    [setCurrentFkThumbnailFilter, setHiddenThumbnails]
  );

  const handleHideSelectedClick = React.useCallback(() => {
    setHiddenThumbnails(prev => [...prev, ...selectedSdIds]);
  }, [selectedSdIds, setHiddenThumbnails]);

  /** Accept selected FK thumbnails */
  const handleAcceptSelected = React.useCallback(() => {
    // Filter out FKs that do not need acceptance
    // and build map for acceptFk
    const sdIdsAndMeasuredValuesForAcceptFK: FkTypes.FkMeasuredValues[] = selectedSdIds
      .filter(sdId => !isAccepted(signalDetections[sdId]))
      .map(sdId => {
        const analystMeasuredValue = getFkMeasuredValues(signalDetections[sdId]);
        return {
          signalDetectionId: sdId,
          measuredValues: {
            azimuth: analystMeasuredValue.azimuth,
            slowness: analystMeasuredValue.slowness
          }
        };
      });
    acceptFk(sdIdsAndMeasuredValuesForAcceptFK);
  }, [acceptFk, getFkMeasuredValues, isAccepted, selectedSdIds, signalDetections]);

  /** Accept all visible (filtered) selected FK thumbnails */
  const handleAcceptVisible = React.useCallback(() => {
    // Filter out FKs that do not need acceptance
    // and build map for acceptFk
    const sdIdsAndMeasuredValuesForAcceptFK: FkTypes.FkMeasuredValues[] = filteredSignalDetections
      .filter(sd => !isAccepted(sd))
      .map(sd => {
        const analystMeasuredValue = getFkMeasuredValues(sd);
        return {
          signalDetectionId: sd.id,
          measuredValues: {
            azimuth: analystMeasuredValue.azimuth,
            slowness: analystMeasuredValue.slowness
          }
        };
      });
    acceptFk(sdIdsAndMeasuredValuesForAcceptFK);
  }, [acceptFk, filteredSignalDetections, getFkMeasuredValues, isAccepted]);

  const toolbarItemsLeft = React.useMemo<ToolbarTypes.ToolbarItemElement[]>(() => {
    return [
      <DropdownToolbarItem<typeof FkThumbnailsFilterType>
        key="fkthumbnailsfilter"
        label="Filter"
        tooltip={`Filter the fks by: ${
          hiddenThumbnails.length > 0 ? 'Custom' : currentFkThumbnailFilter
        }`}
        dropDownItems={FkThumbnailsFilterType}
        custom={hiddenThumbnails.length > 0}
        widthPx={163}
        value={hiddenThumbnails.length > 0 ? 'UNSELECTED_CUSTOM_VALUE' : currentFkThumbnailFilter}
        onChange={handleFkThumbnailFilterChange}
      />
    ];
  }, [currentFkThumbnailFilter, hiddenThumbnails.length, handleFkThumbnailFilterChange]);

  const toolbarItemsRight = React.useMemo<ToolbarTypes.ToolbarItemElement[]>(() => {
    const thumbnailSizeMenuPopup = (
      <Menu>
        <MenuItem
          icon={IconNames.SMALL_SQUARE}
          onClick={() => setFkThumbnailSizePx(FkThumbnailSize.SMALL)}
          text="Small"
        />
        <MenuItem
          icon={
            // TODO: This should be created into a separate svg file and used
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <path
                id="med-square"
                d="M2.067,10.06H10.06V2.067H2.067ZM1.213,0A1.146,1.146,0,0,0,0,1.213v9.7a1.146,1.146,0,0,0,1.213,1.213h9.7a1.146,1.146,0,0,0,1.212-1.213v-9.7A1.146,1.146,0,0,0,10.915,0Z"
                transform="translate(1.75 1.75)"
                fill="#bfccd6"
                fillRule="evenodd"
              />
            </svg>
          }
          onClick={() => setFkThumbnailSizePx(FkThumbnailSize.MEDIUM)}
          text="Medium"
        />
        <MenuItem
          icon={IconNames.SQUARE}
          onClick={() => setFkThumbnailSizePx(FkThumbnailSize.LARGE)}
          text="Large"
        />
      </Menu>
    );

    const acceptanceMenuPopup = (
      <Menu>
        <MenuItem onClick={handleAcceptSelected} text="Selected" />
        <MenuItem onClick={handleAcceptVisible} text="Visible" />
      </Menu>
    );

    return [
      <ButtonToolbarItem
        key="fkthumbnailnextfk"
        label="Next"
        tooltip="Selected next fk that needs review"
        onButtonClick={nextFk}
        disabled={!anyDisplayedFksNeedReview}
        widthPx={50}
      />,
      <PopoverButtonToolbarItem
        key="fkthumbnailsize"
        label="Thumbnail size"
        tooltip="Options for fk thumbnails sizes"
        popoverContent={thumbnailSizeMenuPopup}
        widthPx={130}
      />,
      <ButtonToolbarItem
        key="fkhideselected"
        label="Hide selected"
        onButtonClick={handleHideSelectedClick}
        widthPx={110}
      />,
      <PopoverButtonToolbarItem
        key="fkthumbnailapproval"
        label="Accept"
        iconLeft={IconNames.CONFIRM}
        tooltip="Options for approving fk thumbnails"
        popoverContent={acceptanceMenuPopup}
        widthPx={105}
      />
    ];
  }, [
    anyDisplayedFksNeedReview,
    handleAcceptSelected,
    handleAcceptVisible,
    handleHideSelectedClick,
    nextFk,
    setFkThumbnailSizePx
  ]);

  return (
    <div className="azimuth-slowness-thumbnails-controls__wrapper">
      <Toolbar
        itemsLeft={toolbarItemsLeft}
        itemsRight={toolbarItemsRight}
        toolbarWidthPx={fkThumbnailColumnSizePx - MARGINS_FOR_TOOLBAR_PX}
        parentContainerPaddingPx={0}
      />
    </div>
  );
}
