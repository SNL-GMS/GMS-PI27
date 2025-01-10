import { ChannelTypes, CommonTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import type { StationGroup } from '@gms/common-model/lib/workflow/types';

import { AnalystWaveformOperations, waveformSlice } from '../../../../src/ts/app/state/waveform';
import type { StationVisibilityChangesDictionary } from '../../../../src/ts/app/state/waveform/types';

jest.mock(
  '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      processingConfigurationApiSlice: {
        endpoints: {
          getProcessingAnalystConfiguration: {
            select: jest.fn(() =>
              jest.fn(() => ({
                data: processingAnalystConfigurationData
              }))
            )
          }
        }
      }
    };
  }
);

jest.mock('../../../../src/ts/app/api/station-definition/station-definition-api-slice', () => {
  const actual = jest.requireActual(
    '../../../../src/ts/app/api/station-definition/station-definition-api-slice'
  );
  return {
    ...actual,
    stationDefinitionSlice: {
      endpoints: {
        getStationGroupsByNames: {
          ...actual.stationDefinitionSlice.endpoints.getStationGroupsByNames,
          select: jest.fn(() =>
            jest.fn(() => ({
              data: [
                {
                  name: 'mockStationGroup',
                  stations: [{ name: 'station 1' }, { name: 'station 2' }]
                }
              ]
            }))
          )
        }
      }
    }
  };
});

describe('Waveform operations', () => {
  const station = {
    allRawChannels: [
      {
        name: 'testChannel',
        canonicalName: 'testChannel',
        description: 'test channel to help test operations',
        effectiveAt: 0,
        effectiveUntil: 1,
        station: undefined,
        channelDataType: ChannelTypes.ChannelDataType.SEISMIC,
        channelBandType: ChannelTypes.ChannelBandType.LONG_PERIOD,
        channelInstrumentType: ChannelTypes.ChannelInstrumentType.ACCELEROMETER,
        channelOrientationType: ChannelTypes.ChannelOrientationType.NORTH_SOUTH,
        channelOrientationCode: 'N',
        units: CommonTypes.Units.DEGREES,
        nominalSampleRateHz: 40,
        location: undefined,
        orientationAngles: undefined,
        configuredInputs: [],
        processingDefinition: {},
        processingMetadata: undefined
      }
    ],
    channelGroups: undefined,
    description: 'testStation',
    effectiveAt: 0,
    effectiveUntil: 1000,
    location: undefined,
    name: 'testStation',
    relativePositionsByChannel: undefined,
    type: StationTypes.StationType.SEISMIC_ARRAY
  };
  const visibilityDictionaryTest: StationVisibilityChangesDictionary = {
    testStation: {
      stationName: station.name,
      visibility: true,
      isStationExpanded: false,
      hiddenChannels: undefined
    }
  };
  const mockDispatch = jest.fn();
  const zoomIntervalMock = {
    startTimeSecs: 6000,
    endTimeSecs: 8000
  };
  const zoomIntervalMockDifferent = {
    startTimeSecs: 6500,
    endTimeSecs: 6800
  };
  const zoomIntervalMockLeft = {
    startTimeSecs: 500,
    endTimeSecs: 600
  };
  const zoomIntervalMockRight = {
    startTimeSecs: 11000,
    endTimeSecs: 12000
  };
  const viewableIntervalMock = {
    startTimeSecs: 4000,
    endTimeSecs: 8000
  };
  const currentIntervalMock = {
    startTimeSecs: 6000,
    endTimeSecs: 7000
  };
  const getStateMock = jest.fn(() => {
    return {
      app: {
        waveform: {
          viewableInterval: viewableIntervalMock,
          zoomInterval: zoomIntervalMock
        },
        workflow: {
          timeRange: currentIntervalMock
        }
      }
    } as any;
  });
  const getStateLeftMock = jest.fn(() => {
    return {
      app: {
        waveform: {
          viewableInterval: viewableIntervalMock,
          zoomInterval: zoomIntervalMockLeft
        },
        workflow: {
          timeRange: currentIntervalMock
        }
      }
    } as any;
  });

  const getStateRightMock = jest.fn(() => {
    return {
      app: {
        waveform: {
          viewableInterval: viewableIntervalMock,
          zoomInterval: zoomIntervalMockRight
        },
        workflow: {
          timeRange: currentIntervalMock
        }
      }
    } as any;
  });

  const getEmptyStateMock = jest.fn(() => {
    return {
      app: {
        waveform: { viewableInterval: null, zoomInterval: zoomIntervalMock }
      }
    } as any;
  });

  const getBaseStationTimeStateMock = jest.fn(() => {
    return {
      app: {
        waveform: {
          viewableInterval: viewableIntervalMock,
          zoomInterval: zoomIntervalMock,
          baseStationTime: 1
        },
        workflow: {
          timeRange: currentIntervalMock
        }
      }
    } as any;
  });

  // clear of mock calls
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should have defined exports', () => {
    expect(AnalystWaveformOperations.stationsVisibilityDictionaryIsDefined).toBeDefined();
    expect(AnalystWaveformOperations.setStationsVisibility).toBeDefined();
    expect(AnalystWaveformOperations.resetStationsVisibility).toBeDefined();
    expect(AnalystWaveformOperations.setZoomInterval).toBeDefined();
    expect(AnalystWaveformOperations.initializeWaveformIntervals).toBeDefined();
    expect(AnalystWaveformOperations.initializeStationVisibility).toBeDefined();
    expect(AnalystWaveformOperations.loadData).toBeDefined();
    expect(AnalystWaveformOperations.Operations).toBeDefined();
  });

  it('should have a function to test if station visibility is defined', () => {
    expect(
      AnalystWaveformOperations.stationsVisibilityDictionaryIsDefined(visibilityDictionaryTest)
    ).toEqual(true);
  });

  it('should have a function to set station visibility', () => {
    let setStationsVisibilityTestFunction = AnalystWaveformOperations.setStationsVisibility({
      test: { stationName: 'test', visibility: true }
    });
    setStationsVisibilityTestFunction(mockDispatch);
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    setStationsVisibilityTestFunction =
      AnalystWaveformOperations.setStationsVisibility(visibilityDictionaryTest);
    expect(setStationsVisibilityTestFunction).toBeTruthy();

    setStationsVisibilityTestFunction(mockDispatch);
    expect(mockDispatch).toHaveBeenCalledWith(
      waveformSlice.actions.setStationsVisibility(visibilityDictionaryTest)
    );
  });

  it('should have a function to reset station visibility', () => {
    AnalystWaveformOperations.resetStationsVisibility(mockDispatch);
    expect(mockDispatch).toHaveBeenCalledWith(waveformSlice.actions.setStationsVisibility({}));
  });

  it('should have a function to set the zoom level', () => {
    mockDispatch.mockReset();
    let setZoomIntervalResultFunction = AnalystWaveformOperations.setZoomInterval({
      startTimeSecs: null,
      endTimeSecs: null
    });
    expect(() => {
      setZoomIntervalResultFunction(mockDispatch, getEmptyStateMock);
    }).toThrow();
    expect(mockDispatch).toHaveBeenCalledTimes(0);

    try {
      setZoomIntervalResultFunction =
        AnalystWaveformOperations.setZoomInterval(zoomIntervalMockDifferent);
      setZoomIntervalResultFunction(mockDispatch, getEmptyStateMock);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e.message).toMatchSnapshot();
    }
    expect(mockDispatch).toHaveBeenCalledTimes(0);

    setZoomIntervalResultFunction =
      AnalystWaveformOperations.setZoomInterval(zoomIntervalMockDifferent);

    setZoomIntervalResultFunction(mockDispatch, getStateMock);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      waveformSlice.actions.setZoomInterval(zoomIntervalMockDifferent)
    );
  });

  it('should have a function to initialize waveform intervals', () => {
    mockDispatch.mockReset();
    const initializeWaveformIntervalsMock = AnalystWaveformOperations.initializeWaveformIntervals();
    initializeWaveformIntervalsMock(mockDispatch, getStateMock);

    // get called twice due to initializing the interval
    expect(getStateMock).toHaveBeenCalledTimes(3);
    // get called with viewable interval change
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('should have a function to initialize station visibility', async () => {
    mockDispatch.mockImplementationOnce(
      async () =>
        new Promise(resolve => {
          process.nextTick(() => resolve({}));
        })
    );

    const stationGroup: StationGroup = {
      effectiveAt: 1,
      name: 'name',
      description: 'description'
    };

    const initializeWaveformIntervalsMock = AnalystWaveformOperations.initializeStationVisibility(
      stationGroup,
      1
    );

    await initializeWaveformIntervalsMock(mockDispatch, getStateMock);

    expect(getStateMock).toHaveBeenCalledTimes(1);
    // get called thrice due to initializing the query
    expect(mockDispatch).toHaveBeenCalledTimes(3);
  });

  it('should have a pan function', () => {
    mockDispatch.mockReset();
    const onLoadingLimitReached = jest.fn();
    const panLeft = AnalystWaveformOperations.loadData(WaveformTypes.LoadType.Earlier, {
      onLoadingLimitReached
    });
    panLeft(mockDispatch, getStateLeftMock);
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    const panRight = AnalystWaveformOperations.loadData(WaveformTypes.LoadType.Later, {
      onLoadingLimitReached
    });
    panRight(mockDispatch, getStateRightMock);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('should have defined exports Operations', () => {
    expect(AnalystWaveformOperations.Operations).toMatchInlineSnapshot(`
      {
        "initializeStationVisibility": [Function],
        "initializeWaveformIntervals": [Function],
        "loadData": [Function],
        "resetStationsVisibility": [Function],
        "setChannelVisibility": [Function],
        "setStationExpanded": [Function],
        "setStationVisibility": [Function],
        "setStationsVisibility": [Function],
        "setZoomInterval": [Function],
        "showAllChannels": [Function],
        "updateStationsVisibilityForSignalDetections": [Function],
      }
    `);
  });

  test('calculate zoom interval properties with base station time', () => {
    const mock = getBaseStationTimeStateMock();
    expect(
      AnalystWaveformOperations.calculateZoomIntervalProperties(mock.app.waveform)
    ).toMatchSnapshot();
  });
});
