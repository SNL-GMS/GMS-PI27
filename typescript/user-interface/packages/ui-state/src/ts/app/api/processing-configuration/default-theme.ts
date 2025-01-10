import { Colors } from '@blueprintjs/core';
import type { ConfigurationTypes } from '@gms/common-model';

export const defaultTheme: ConfigurationTypes.UITheme = {
  name: 'GMS Default (dark)',
  isDarkMode: true,
  display: {
    edgeEventOpacity: 0.5,
    edgeSDOpacity: 0.2,
    predictionSDOpacity: 0.1
  },
  colors: {
    gmsMain: '#f5f8fa',
    gmsMainInverted: '#10161a',
    gmsBackground: '#182026',
    gmsSelection: '#1589d1',
    gmsTableSelection: '#f5f8fa',
    mapVisibleStation: '#D9822B',
    mapStationDefault: '#6F6E74',
    mapArraySiteLines: '#182026',
    waveformDimPercent: 0.75,
    waveformRaw: Colors.CERULEAN4,
    waveformSelected: '#A4BAE1',
    waveformFilterLabel: Colors.LIGHT_GRAY5,
    waveformMaskLabel: '#EB06C8',
    unassociatedSDColor: '#C23030',
    openEventSDColor: '#C87619',
    completeEventSDColor: '#62D96B',
    completeEventSDHoverColor: '#BBFFBC',
    conflict: '#FF0000',
    otherEventSDColor: '#FFFFFF',
    predictionSDColor: '#C58C1B',
    deletedEventColor: '#ff6347',
    fkNeedsReview: '#EBFF00',
    fkDisplayed: '#00FFFF',
    rejectedEventColor: '#ab83f1',
    deletedSdColor: '#ff6347',
    qcMaskColors: {
      analystDefined: '#EB06C8',
      dataAuthentication: '#8A57FF',
      longTerm: '#0E9B96',
      processingMask: '#F87C2E',
      rejected: '#FF0000',
      stationSOH: '#B58400',
      unprocessed: '#FFFFFF',
      waveform: '#00E22B'
    },
    weavessOutOfBounds: '#10161a',
    popover: {
      background: '#30404d',
      header: '#30404d',
      input: '303d46',
      invalidInput: '#1c2127',
      gridBackground: '#3d4b58'
    },
    gmsActionTarget: '#ffffff'
  }
};
