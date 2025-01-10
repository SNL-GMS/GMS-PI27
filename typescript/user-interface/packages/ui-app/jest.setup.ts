/* eslint-disable max-classes-per-file */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
import 'fake-indexeddb/auto';

import * as util from 'util';

// This is to fix an issue with test leaks related to createStateSyncMiddleware() in jsdom
process.env.GMS_DISABLE_REDUX_STATE_SYNC = 'true';

process.env.GMS_DISABLE_PRE_CACHE_CHANNEL_SEGMENT_BY_CHANNEL = 'true';

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import type { FilterDefinition } from '@gms/common-model/lib/filter/types';
import range from 'lodash/range';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-canvas-mock');

const globalAny: any = global;

// eslint-disable-next-line @typescript-eslint/no-require-imports
globalAny.fetch = require('jest-fetch-mock');

globalAny.fetchMock = globalAny.fetch;

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('jest-fetch-mock').enableMocks();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
window.MutationObserver = jest.fn(() => {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
    takeRecords: jest.fn()
  };
});
globalAny.window = window;

class Worker {
  public url: string;

  public onmessage: (message: Record<string, unknown>, transfer?: Transferable[]) => void;

  public constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = () => {
      // do nothing
    };
  }

  public postMessage(message: Record<string, unknown>, transfer?: Transferable[]) {
    this.onmessage(message, transfer);
  }
}
globalAny.window.Worker = Worker;

class MessagePort {
  public url: string;

  public onmessage: (message: Record<string, unknown>, transfer?: Transferable[]) => void;

  public postMessage(message: Record<string, unknown>, transfer?: Transferable[]) {
    this.onmessage(message, transfer);
  }
}

class SharedWorker {
  public url: string;

  public port = new MessagePort();

  public constructor(stringUrl: string) {
    this.url = stringUrl;

    this.port.onmessage = () => {
      // do nothing
    };
  }
}
globalAny.window.SharedWorker = SharedWorker;

// eslint-disable-next-line @typescript-eslint/no-require-imports
globalAny.$ = require('jquery');

globalAny.jQuery = globalAny.$;
globalAny.TextEncoder = util.TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-require-imports
globalAny.fetch = require('jest-fetch-mock');

globalAny.window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

jest.mock('axios', () => {
  const success = 'success';
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    request: jest.fn().mockReturnValue(Promise.resolve(success))
  };
});

jest.mock('cesium', () => {
  const realCesium = jest.requireActual('cesium');
  return {
    ...realCesium,
    BillboardGraphics: jest.fn(x => x),
    buildModuleUrl: jest.fn(),
    Camera: {
      DEFAULT_VIEW_FACTOR: 0
    },
    Cartesian2: jest.requireActual('cesium').Cartesian2,
    Cartesian3: jest.requireActual('cesium').Cartesian3,
    Color: {
      WHITE: '0000',
      GRAY: '5656',
      BLACK: { withAlpha: jest.fn(() => 'Test') },
      fromCssColorString: jest.fn(() => {
        return {
          alpha: 0
        };
      })
    },
    ColorMaterialProperty: jest.requireActual('cesium').ColorMaterialProperty,
    ConstantProperty: jest.fn(x => {
      return {
        _value: x,
        getValue: jest.fn(() => x)
      };
    }),
    ConstantPositionProperty: jest.fn(x => x),
    defined: jest.fn(x => x),
    DistanceDisplayCondition: jest.fn(),
    EllipsoidTerrainProvider: {},
    Entity: jest.requireActual('cesium').Entity,
    EntityCollection: jest.fn(x => x),
    GeoJsonDataSource: {},
    HorizontalOrigin: {
      CENTER: 0
    },
    JulianDate: {
      now: jest.fn(() => 0)
    },
    LabelGraphics: jest.fn(x => {
      return {
        _value: x,
        getValue: jest.fn(() => x)
      };
    }),
    LabelStyle: {
      FILL_AND_OUTLINE: 0
    },
    PolylineGraphics: jest.fn(x => x),
    ProviderViewModel: jest.fn(),
    SceneMode: {
      SCENE2D: true
    },
    ScreenSpaceEventType: {
      MOUSE_MOVE: 'MOUSE_MOVE'
    },
    TileMapServiceImageryProvider: jest.fn(),
    VerticalOrigin: {
      TOP: 0,
      CENTER: 0
    },
    Viewer: {
      scene: {
        pickPosition: jest.fn(x => x)
      }
    }
  };
});

jest.mock('resium', () => {
  const realResium = jest.requireActual('resium');
  return {
    ...realResium,
    Camera: {
      DEFAULT_VIEW_FACTOR: 0
    },
    CameraFlyTo: {},
    CesiumComponentRef: {},
    CesiumMovementEvent: {},
    ImageryLayer: {},
    cesiumElement: {},
    useCesium: () => {
      return {
        camera: {
          pickEllipsoid: jest.fn(() => {
            // Intentional
          })
        },
        globe: {
          ellipsoid: {}
        }
      };
    },
    Viewer: {
      scene: {
        pickPosition: jest.fn(x => x)
      }
    }
  };
});

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'), // create a fake div
      setSize: jest.fn(),
      render: jest.fn(),
      setScissorTest: jest.fn(),
      setViewport: jest.fn(),
      dispose: jest.fn()
    })
  };
});

jest.mock('worker-rpc', () => {
  const realWorkerRpc = jest.requireActual('worker-rpc');
  // We do this here to guarantee that it runs before the waveform panel generates its workers.
  // This works because jest.mock gets hoisted and run before even imports are figured out.
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    writable: false,
    value: 4
  });

  const mockRpc = jest.fn(async () => {
    return new Promise(resolve => {
      resolve([]);
    });
  });

  const RpcProvider = jest.fn().mockImplementation(() => {
    return {
      rpc: mockRpc,
      _dispatch: jest.fn(),
      _nextTransactionId: 0,
      _pendingTransactions: {},
      _rpcHandlers: {},
      _rpcTimeout: 0,
      _signalHandlers: {},
      error: {
        _contexts: [],
        _handlers: [],
        dispatch: jest.fn(),
        hasHandlers: false
      }
    };
  });

  // We don't actually need to mock anything in the worker-rpc module... just to hijack the
  // window before it runs.
  return {
    ...realWorkerRpc,
    RpcProvider
  };
});

jest.mock('react-toastify', () => {
  const actualToastify = jest.requireActual('react-toastify');
  return {
    ...actualToastify,
    info: (message: string, options: any, ...args) => {
      actualToastify.info(message, { ...options, toastId: 'mock-toast-info' }, args);
    },
    warn: (message: string, options: any, ...args) => {
      actualToastify.warn(message, { ...options, toastId: 'mock-toast-warn' }, args);
    },
    error: (message: string, options: any, ...args) => {
      actualToastify.error(message, { ...options, toastId: 'mock-toast-error' }, args);
    }
  };
});

jest.mock('@gms/ui-wasm', () => {
  const isDesigned = jest.requireActual('@gms/ui-wasm/lib/gms-interop/is-designed');

  const filter = async (
    filterDefinition: FilterDefinition,
    data: Float64Array
  ): Promise<Float64Array> => Promise.resolve(data);

  const design = async (filterDefinition: FilterDefinition): Promise<FilterDefinition> =>
    Promise.resolve(filterDefinition);

  const getBoundsForPositionBuffer = async (): Promise<{
    min: number;
    minSecs: number;
    max: number;
    maxSecs: number;
  }> => Promise.resolve({ min: 0, minSecs: 0, max: 10, maxSecs: 10 });

  return {
    design,
    filter,
    getBoundsForPositionBuffer,
    isDesigned: isDesigned.isDesigned
  };
});

// globally mock configuration so it doesn't need to be done in every test file
jest.mock('@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks'
  );

  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData),
    useKeyboardShortcutConfigurationsWithValidation: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    ),
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    )
  };
});

// Mocking because of issue: https://github.com/d3/d3-interpolate/issues/96
// Where `d3-scale-chromatic/src/index.js:1` has a syntax error
// Cannot use `const actual = jest.requireActual('d3-scale-chromatic');`
// since that causes the parsing error. This means we will have to mock
// any functions needed from d3-scale-chromatic
jest.mock('d3-scale-chromatic', () => {
  return {
    interpolateCividis: () => {
      return function interpolateCividis(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateCoo: () => {
      return function interpolateCoo(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateCubehelixDefault: () => {
      return function interpolateCubehelixDefault(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateInferno: () => {
      return function interpolateInferno(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateMagma: () => {
      return function interpolateMagma(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolatePlasma: () => {
      return function interpolatePlasma(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateTurbo: () => {
      return function interpolateTurbo(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateViridis: () => {
      return function interpolateViridis(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    },
    interpolateWarm: () => {
      return function interpolateWarm(t, n) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
      };
    }
  };
});
