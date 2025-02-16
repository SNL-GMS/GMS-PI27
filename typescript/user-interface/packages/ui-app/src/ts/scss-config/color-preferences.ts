import variables from '~css/gms-colors.scss';

export interface GMSColors {
  gmsMain: string;
  gmsRecessed: string;
  gmsProminent: string;
  gmsSoft: string;
  gmsBackground: string;
  gmsProminentBackground: string;
  gmsPopoverBackground: string;
  gmsTransparent: string;

  gmsChartTickLabelDisabled: string;

  gmsInputHighlight: string;
  gmsTableLabelDisabled: string;
  gmsTableWarningOddRow: string;
  gmsTableWarningEvenRow: string;
  gmsTableRequiresReviewOddRow: string;
  gmsTableRequiresReviewEvenRow: string;
  gmsTableSelection: string;
  gmsTableHighlightSelected: string;
  gmsTableWarningSelected: string;
  gmsTableRequiresReviewSelected: string;
  gmsTableChangeMarker: string;
  gmsTableSubsetSelected: string;
  mapVisibleStation: string;
  mapStationDefault: string;

  gmsOk: string;
  gmsWarning: string;
  gmsStrongWarning: string;

  gmsSelection: string;
}
export const gmsColors: GMSColors = {
  gmsMain: variables.gmsMain,
  gmsRecessed: variables.gmsRecessed,
  gmsSoft: variables.gmsSoft,
  gmsProminent: variables.gmsProminent,
  gmsBackground: variables.gmsBackground,
  gmsProminentBackground: variables.gmsProminentBackground,
  gmsPopoverBackground: variables.gmsPopoverBackground,
  gmsTransparent: variables.gmsTransparent,

  gmsChartTickLabelDisabled: variables.gmsChartTickLabelDisabled,

  gmsInputHighlight: variables.gmsInputHighlight,
  gmsTableLabelDisabled: variables.gmsTableLabelDisabled,
  gmsTableWarningOddRow: variables.gmsTableWarningOddRow,
  gmsTableWarningEvenRow: variables.gmsTableWarningEvenRow,
  gmsTableRequiresReviewOddRow: variables.gmsTableRequiresReviewOddRow,
  gmsTableRequiresReviewEvenRow: variables.gmsTableRequiresReviewEvenRow,
  gmsTableSelection: variables.gmsTableSelection,
  gmsTableHighlightSelected: variables.gmsTableHighlightSelected,
  gmsTableWarningSelected: variables.gmsTableWarningSelected,
  gmsTableRequiresReviewSelected: variables.gmsTableRequiresReviewSelected,
  gmsTableChangeMarker: variables.gmsTableChangeMarker,
  gmsTableSubsetSelected: variables.gmsTableSubsetSelected,
  gmsOk: variables.gmsOk,
  gmsWarning: variables.gmsWarning,
  gmsStrongWarning: variables.gmsStrongWarning,
  gmsSelection: variables.gmsSelection,
  mapVisibleStation: variables.mapVisibleStation,
  mapStationDefault: variables.mapStationDefault
};

export interface SemanticColors {
  analystOpenEvent: string;
  analystUnassociated: string;
  analystComplete: string;
  waveformIntervalBoundary: string;
  waveformRaw: string;
  qcAnalystDefined: string;
  qcChannelProcessing: string;
  qcDataAuthentication: string;
  qcRejected: string;
  qcStationSOH: string;
  qcWaveformQuality: string;
}

export const semanticColors: SemanticColors = {
  analystOpenEvent: variables.analystOpenEvent,
  analystUnassociated: variables.analystUnassociated,
  analystComplete: variables.analystComplete,
  waveformIntervalBoundary: variables.waveformIntervalBoundary,
  waveformRaw: variables.waveformRaw,
  qcAnalystDefined: variables.qcAnalystDefined,
  qcChannelProcessing: variables.qcChannelProcessing,
  qcDataAuthentication: variables.qcDataAuthentication,
  qcRejected: variables.qcRejected,
  qcStationSOH: variables.qcStationSOH,
  qcWaveformQuality: variables.qcWaveformQuality
};
