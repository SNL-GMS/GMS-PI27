import { QcSegmentCategory, QcSegmentType } from '@gms/common-model/lib/qc-segment';

import {
  getQCSegmentCategoryOrTypeString,
  getQCSegmentSwatchColor,
  getTableContainerHeight
} from '~analyst-ui/components/waveform/quality-control';

describe('QC Segment Util functions', () => {
  it('exists', () => {
    expect(getQCSegmentCategoryOrTypeString).toBeDefined();
    expect(getQCSegmentSwatchColor).toBeDefined();
    expect(getTableContainerHeight).toBeDefined();
  });

  it('can get the dialog swatch color', () => {
    let theme: any = {
      colors: {
        qcMaskColors: {
          analystDefined: undefined,
          dataAuthentication: undefined,
          stationSOH: undefined,
          unprocessed: undefined,
          waveform: undefined,
          rejected: undefined
        }
      }
    };

    expect(getQCSegmentSwatchColor(QcSegmentCategory.ANALYST_DEFINED, theme, false)).toEqual(
      '#EB06C8'
    );
    expect(getQCSegmentSwatchColor(QcSegmentCategory.DATA_AUTHENTICATION, theme, false)).toEqual(
      '#8A57FF'
    );
    expect(getQCSegmentSwatchColor(QcSegmentCategory.LONG_TERM, theme, false)).toEqual('#0E9B96');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.STATION_SOH, theme, false)).toEqual('#B58400');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.UNPROCESSED, theme, false)).toEqual('#FFFFFF');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.WAVEFORM, theme, false)).toEqual('#00E22B');
    expect(getQCSegmentSwatchColor('Unknown', theme, false)).toEqual('#000000');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.WAVEFORM, theme, true)).toEqual('#FF0000');

    theme = {
      colors: {
        qcMaskColors: {
          analystDefined: '#EB06C8',
          dataAuthentication: '#00E22B',
          longTerm: '#0E9B96',
          stationSOH: '#FFFFFF',
          unprocessed: '#B58400',
          waveform: '#8A57FF',
          rejected: '#FF0000'
        }
      }
    };

    expect(getQCSegmentSwatchColor(QcSegmentCategory.ANALYST_DEFINED, theme, false)).toEqual(
      '#EB06C8'
    );
    expect(getQCSegmentSwatchColor(QcSegmentCategory.DATA_AUTHENTICATION, theme, false)).toEqual(
      '#00E22B'
    );
    expect(getQCSegmentSwatchColor(QcSegmentCategory.LONG_TERM, theme, false)).toEqual('#0E9B96');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.STATION_SOH, theme, false)).toEqual('#FFFFFF');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.UNPROCESSED, theme, false)).toEqual('#B58400');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.WAVEFORM, theme, false)).toEqual('#8A57FF');
    expect(getQCSegmentSwatchColor('Unknown', theme, false)).toEqual('#000000');
    expect(getQCSegmentSwatchColor(QcSegmentCategory.WAVEFORM, theme, true)).toEqual('#FF0000');
  });

  it('can get the dialog category or type string', () => {
    expect(getQCSegmentCategoryOrTypeString(QcSegmentCategory.ANALYST_DEFINED, false)).toEqual(
      'Analyst Defined'
    );
    expect(getQCSegmentCategoryOrTypeString(QcSegmentCategory.DATA_AUTHENTICATION, false)).toEqual(
      'Data Authentication'
    );
    expect(getQCSegmentCategoryOrTypeString(QcSegmentCategory.STATION_SOH, false)).toEqual(
      'Station SOH'
    );
    expect(getQCSegmentCategoryOrTypeString(QcSegmentCategory.UNPROCESSED, false)).toEqual(
      'Unprocessed'
    );
    expect(getQCSegmentCategoryOrTypeString(QcSegmentCategory.WAVEFORM, false)).toEqual('Waveform');
    expect(getQCSegmentCategoryOrTypeString(QcSegmentType.AGGREGATE, false)).toEqual('Aggregate');
    expect(getQCSegmentCategoryOrTypeString('Unknown', false)).toEqual('Unknown');
    expect(getQCSegmentCategoryOrTypeString('Unknown', true)).toEqual('N/A');
  });

  it('can calculate table height', () => {
    const expectedEmptyTableHeight = '47px';
    const expectedTableHeight = '147px';
    const expectedMaxTableHeight = '172px';

    expect(getTableContainerHeight(0).height).toEqual(expectedEmptyTableHeight);
    expect(getTableContainerHeight(4, 5).height).toEqual(expectedTableHeight);
    expect(getTableContainerHeight(0, 5).maxHeight).toEqual(expectedMaxTableHeight);
  });
});
