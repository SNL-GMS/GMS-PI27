import type { SignalDetectionTypes } from '@gms/common-model';
import { LegacyEventTypes } from '@gms/common-model';
import { setDecimalPrecision } from '@gms/common-util';
import type { ColumnGroupDefinition } from '@gms/ui-core-components';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';

import {
  MagDefiningStates,
  magnitudeColumnRepeatedArguments
} from '~analyst-ui/components/magnitude/types';
import { messageConfig } from '~analyst-ui/config/message-config';
import { systemConfig } from '~analyst-ui/config/system-config';
import { gmsColors } from '~scss-config/color-preferences';

import { MagDefiningCheckBoxCellRenderer, ToolTipRenderer } from './cell-renderer-frameworks';
import { DefiningHeader } from './header-group-renderer-frameworks';

const historicalColor = gmsColors.gmsSoft;

// Apply a highlight to the selected cell. Will color it conditionally based on whether it is selected or not.
const applyHighlightToCell = (params: any): any => {
  const { magnitudeType } = params.colDef;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const signalDetectionId = getValueFromParams(params, magnitudeType, 'signalDetectionId');
  const isSelected = params.data.selectedSdIds.find(sdId => sdId === signalDetectionId);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const magTypeHasError = getValueFromParams(params, magnitudeType, 'hasMagnitudeCalculationError');
  const isSelectedMagTypeHasError = magTypeHasError
    ? gmsColors.gmsTableWarningSelected
    : gmsColors.gmsTableHighlightSelected;

  // TODO review colors
  const evenMagType = magTypeHasError ? gmsColors.gmsTableWarningEvenRow : '#FF007F';
  const evenValue = isSelected ? isSelectedMagTypeHasError : evenMagType;
  const oddMagType = magTypeHasError ? gmsColors.gmsTableWarningOddRow : '#FF007F';
  const oddValue = isSelected ? isSelectedMagTypeHasError : oddMagType;

  return {
    'text-align': 'right',
    'background-color': params.node.rowIndex % 2 === 0 ? evenValue : oddValue
  };
};

const applyHistoricalToHeader = params => ({
  'text-align': 'right',
  color: params.data.historicalMode ? historicalColor : undefined
});

/**
 * Gets data from the row parameters based off of magnitude type and access key
 *
 * @param params ag grid params
 * @param magnitudeType mag type to get data for
 * @param key key of the data in the object
 */
function getValueFromParams(params, magnitudeType: LegacyEventTypes.MagnitudeType, key: string) {
  return params.data.dataForMagnitude.get(magnitudeType)[key];
}

function getCellStyleFromParams(
  params,
  magnitudeType: LegacyEventTypes.MagnitudeType,
  hasNoneChecked: boolean
) {
  const hasNoneCheckedValue = hasNoneChecked
    ? gmsColors.gmsTableWarningSelected
    : gmsColors.gmsTableSelection;
  const evenOddRowIndexValue =
    params.node.rowIndex % 2 === 0
      ? gmsColors.gmsTableWarningOddRow
      : gmsColors.gmsTableWarningEvenRow;
  const hasCheckedValue = hasNoneChecked ? evenOddRowIndexValue : 'auto';

  return {
    display: 'flex',
    'justify-content': 'center',
    'padding-left': '9px',
    'padding-top': '3px',
    color: params.data.historicalMode ? historicalColor : undefined,
    'background-color':
      !params.data.historicalMode &&
      params.data.selectedSdIds.find(
        sdId => sdId === getValueFromParams(params, magnitudeType, 'signalDetectionId')
      )
        ? hasNoneCheckedValue
        : hasCheckedValue
  };
}

function generateMagnitudeColumn(
  magnitudeType: LegacyEventTypes.MagnitudeType,
  amplitudeType: SignalDetectionTypes.AmplitudeType,
  defStates: MagDefiningStates,
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes,
  stationIds: string[],
  definingCallback: (
    magnitudeType: LegacyEventTypes.MagnitudeType,
    stationIds: string[],
    defining: boolean
  ) => void
) {
  const hasNoneChecked = defStates === MagDefiningStates.NONE;
  return {
    headerName: magnitudeType,
    headerGroupComponentFramework: DefiningHeader,
    headerGroupComponentParams: {
      definingState: defStates,
      callback: definingCallback,
      magnitudeType,
      stationIds
    },
    children: [
      {
        headerName: 'Channel',
        valueGetter: params => getValueFromParams(params, magnitudeType, 'channel'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        magnitudeType,
        cellStyle: params => ({
          'text-align': 'left',
          color: params.data.historicalMode ? historicalColor : undefined,
          'background-color':
            !params.data.historicalMode &&
            params.data.selectedSdIds.find(
              sdId => sdId === getValueFromParams(params, magnitudeType, 'signalDetectionId')
            )
              ? gmsColors.gmsTableSelection
              : 'auto',
          'padding-left': '2px'
        }),
        width: 71,
        ...magnitudeColumnRepeatedArguments
      },
      {
        headerName: 'Phase',
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'phase'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        cellStyle: params => ({
          'text-align': 'left',
          color: params.data.historicalMode ? historicalColor : undefined,
          'background-color':
            !params.data.historicalMode &&
            params.data.selectedSdIds.find(
              sdId => sdId === getValueFromParams(params, magnitudeType, 'signalDetectionId')
            )
              ? gmsColors.gmsTableSelection
              : 'auto'
        }),
        width: 60,
        ...magnitudeColumnRepeatedArguments
      },
      {
        headerName: systemConfig.amplitudeTypeToDisplayName.get(amplitudeType),
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'amplitudeValue'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        cellStyle: params => {
          const flagForReview = getValueFromParams(params, magnitudeType, 'flagForReview');
          const signalDetectionId = getValueFromParams(params, magnitudeType, 'signalDetectionId');
          const isSelected = params.data.selectedSdIds.find(sdId => sdId === signalDetectionId);
          const colorNotFlaggedForReview = params.data.historicalMode ? historicalColor : undefined;
          const colorValue = flagForReview ? gmsColors.gmsRecessed : colorNotFlaggedForReview;
          const evenBGFlaggedForReview = isSelected
            ? gmsColors.gmsTableRequiresReviewSelected
            : gmsColors.gmsTableRequiresReviewEvenRow;
          const oddBGFlaggedForReview = isSelected
            ? gmsColors.gmsTableRequiresReviewSelected
            : gmsColors.gmsTableRequiresReviewOddRow;
          const bgFlaggedForReview =
            params.node.rowIndex % 2 === 0 ? evenBGFlaggedForReview : oddBGFlaggedForReview;

          const bgNotFlaggedForReview =
            !params.data.historicalMode && isSelected ? gmsColors.gmsTableSelection : 'auto';
          const backgroundColorValue = flagForReview ? bgFlaggedForReview : bgNotFlaggedForReview;

          return {
            'text-align': 'right',
            color: colorValue,
            'background-color': backgroundColorValue
          };
        },
        width: 60,
        ...magnitudeColumnRepeatedArguments,
        valueFormatter: params =>
          setDecimalPrecision(getValueFromParams(params, magnitudeType, 'amplitudeValue'))
      },
      {
        headerName: 'Period (s)',
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'amplitudePeriod'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        cellStyle: params => ({
          'text-align': 'right',
          color: params.data.historicalMode ? historicalColor : undefined,
          'background-color':
            !params.data.historicalMode &&
            params.data.selectedSdIds.find(
              sdId => sdId === getValueFromParams(params, magnitudeType, 'signalDetectionId')
            )
              ? gmsColors.gmsTableSelection
              : 'auto'
        }),
        width: 80,
        ...magnitudeColumnRepeatedArguments,
        valueFormatter: params =>
          setDecimalPrecision(getValueFromParams(params, magnitudeType, 'amplitudePeriod'))
      },
      {
        headerName: 'Def',
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'defining'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        cellStyle: (params: any) => getCellStyleFromParams(params, magnitudeType, hasNoneChecked),
        cellRenderer: MagDefiningCheckBoxCellRenderer,
        width: 50,
        ...magnitudeColumnRepeatedArguments,
        cellRendererParams: {
          padding: 25,
          magnitudeType,
          tooltip: hasNoneChecked
            ? messageConfig.tooltipMessages.magnitude.noStationsSetToDefiningMessage
            : undefined
        }
      },
      {
        headerName: 'Mag',
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'mag'),
        cellStyle: applyHighlightToCell,
        width: 60,
        hide: !displayedMagnitudeTypes[magnitudeType],
        ...magnitudeColumnRepeatedArguments,
        valueFormatter: params =>
          setDecimalPrecision(getValueFromParams(params, magnitudeType, 'mag'), 2),
        cellRenderer: ToolTipRenderer,
        cellRendererParams: params => ({
          tooltip: getValueFromParams(params, magnitudeType, 'hasMagnitudeCalculationError')
            ? getValueFromParams(params, magnitudeType, 'computeNetworkMagnitudeSolutionStatus')
            : undefined
        })
      },
      {
        headerName: 'Res',
        magnitudeType,
        valueGetter: params => getValueFromParams(params, magnitudeType, 'res'),
        hide: !displayedMagnitudeTypes[magnitudeType],
        cellStyle: applyHighlightToCell,
        width: 60,
        ...magnitudeColumnRepeatedArguments,
        cellRenderer: ToolTipRenderer,
        cellRendererParams: params => ({
          tooltip: getValueFromParams(params, magnitudeType, 'hasMagnitudeCalculationError')
            ? getValueFromParams(params, magnitudeType, 'computeNetworkMagnitudeSolutionStatus')
            : undefined
        }),
        valueFormatter: params =>
          setDecimalPrecision(getValueFromParams(params, magnitudeType, 'res'), 2)
      }
    ]
  };
}

/**
 * Generates column defs
 */
export function generateStationMagnitudeColumnDefs(
  defStatesForMagnitudeType: Map<LegacyEventTypes.MagnitudeType, MagDefiningStates>,
  stationIdsForMagnitudeType: Map<LegacyEventTypes.MagnitudeType, string[]>,
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes,
  historicalMode: boolean,
  definingCallback: (
    magnitudeType: LegacyEventTypes.MagnitudeType,
    stationIds: string[],
    defining: boolean
  ) => void
): ColumnGroupDefinition[] {
  const pinnedColumns = {
    headerName: historicalMode ? 'Station magnitude (readonly)' : 'Station magnitude',
    children: [
      {
        headerName: 'Station',
        field: 'station',
        cellStyle: () => ({ 'text-align': 'left' }),
        width: 70,
        ...magnitudeColumnRepeatedArguments,
        pinned: true
      },
      {
        headerName: 'Dist (\u00B0)',
        field: 'dist',
        cellStyle: applyHistoricalToHeader,
        width: 80,
        ...magnitudeColumnRepeatedArguments,
        pinned: true,
        valueFormatter: e => setDecimalPrecision(e.data.dist)
      },
      {
        headerName: 'S-R Azimuth (\u00B0)',
        field: 'azimuth',
        cellStyle: applyHistoricalToHeader,
        width: 120,
        tooltipValueGetter: () =>
          messageConfig.tooltipMessages.magnitude.sourceToReceiverAzimuthMessage,
        pinned: true,
        ...magnitudeColumnRepeatedArguments,
        valueFormatter: e => setDecimalPrecision(e.data.azimuth)
      }
    ]
  };
  const magnitudeHeaderGroups: ColumnGroupDefinition[] = Object.keys(
    LegacyEventTypes.MagnitudeType
  ).map(key =>
    generateMagnitudeColumn(
      LegacyEventTypes.MagnitudeType[key],
      systemConfig.amplitudeTypeForMagnitude.get(LegacyEventTypes.MagnitudeType[key]),
      defStatesForMagnitudeType.get(LegacyEventTypes.MagnitudeType[key]),
      displayedMagnitudeTypes,
      stationIdsForMagnitudeType.get(LegacyEventTypes.MagnitudeType[key]),
      definingCallback
    )
  );

  const columnDefs: ColumnGroupDefinition[] = [pinnedColumns, ...magnitudeHeaderGroups];
  return columnDefs;
}
