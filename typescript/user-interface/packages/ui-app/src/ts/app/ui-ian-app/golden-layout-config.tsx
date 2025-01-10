import { Displays, UserProfileTypes } from '@gms/common-model';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type GoldenLayout from '@gms/golden-layout';
import { withReduxProvider } from '@gms/ui-state';
import { isElectron } from '@gms/ui-util';
import React from 'react';

import { UniqueComponent } from '~common-ui/components/unique-component';
import { AnalystUiComponents } from '~components/analyst-ui';
import type {
  GLComponentConfig,
  GLComponentConfigList,
  GLComponentValue,
  GLMap,
  GoldenLayoutContextData
} from '~components/workspace/components/golden-layout/types';

/**
 * Wraps the component for a golden layout panel.
 * Provides the required context providers to the component.
 *
 * @param Component the golden layout component
 */
const wrap = (Component: any, name: string) => {
  function WrappedComponent(p) {
    const { glContainer } = p;

    return (
      <UniqueComponent name={name} glContainer={glContainer}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...p} />
      </UniqueComponent>
    );
  }
  return withReduxProvider(WrappedComponent);
};

// ! CAUTION: when changing the golden-layout component name
// The route paths must match the `golden-layout` component name for popout windows
// For example, the component name `signal-detections` must have the route path of `signal-detections`

const ianComponents: Record<Displays.IanDisplays, GLComponentConfig> = {
  [Displays.IanDisplays.EVENTS]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.EVENTS),
    component: Displays.IanDisplays.EVENTS
  },
  [Displays.IanDisplays.MAP]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.MAP),
    component: Displays.IanDisplays.MAP
  },
  [Displays.IanDisplays.SIGNAL_DETECTIONS]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.SIGNAL_DETECTIONS),
    component: Displays.IanDisplays.SIGNAL_DETECTIONS
  },
  [Displays.IanDisplays.STATION_PROPERTIES]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.STATION_PROPERTIES),
    component: Displays.IanDisplays.STATION_PROPERTIES
  },
  [Displays.IanDisplays.WORKFLOW]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.WORKFLOW),
    component: Displays.IanDisplays.WORKFLOW
  },
  [Displays.IanDisplays.WAVEFORM]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.WAVEFORM),
    component: Displays.IanDisplays.WAVEFORM
  },
  [Displays.IanDisplays.FILTERS]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.FILTERS),
    component: Displays.IanDisplays.FILTERS
  },
  [Displays.IanDisplays.AZIMUTH_SLOWNESS]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.AZIMUTH_SLOWNESS),
    component: Displays.IanDisplays.AZIMUTH_SLOWNESS
  },
  [Displays.IanDisplays.HISTORY]: {
    type: 'react-component',
    title: Displays.toDisplayTitle(Displays.IanDisplays.HISTORY),
    component: Displays.IanDisplays.HISTORY
  }
};

// Adding all components
const components: GLComponentConfigList = {};
[...Object.entries(ianComponents)].forEach(([componentName, glComponent]) => {
  components[componentName] = glComponent;
});

const defaultGoldenLayoutConfig: GoldenLayout.Config = {
  settings: {
    showPopoutIcon: Boolean(isElectron()),
    showMaximiseIcon: true,
    showCloseIcon: true
  },
  content: [
    {
      type: 'row',
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'column',
              content: [
                {
                  ...ianComponents[Displays.IanDisplays.WORKFLOW]
                }
              ]
            }
          ]
        },
        {
          type: 'row',
          content: [
            {
              type: 'column',
              content: [
                {
                  ...ianComponents[Displays.IanDisplays.MAP]
                }
              ]
            }
          ]
        },
        {
          type: 'row',
          content: [
            {
              type: 'column',
              content: [
                {
                  ...ianComponents[Displays.IanDisplays.SIGNAL_DETECTIONS]
                }
              ]
            }
          ]
        },
        {
          type: 'row',
          content: [
            {
              type: 'column',
              content: [
                {
                  ...ianComponents[Displays.IanDisplays.STATION_PROPERTIES]
                }
              ]
            }
          ]
        },
        {
          type: 'column',
          content: [
            {
              ...ianComponents[Displays.IanDisplays.WAVEFORM],
              height: 70
            }
          ]
        }
      ]
    }
  ],
  dimensions: {
    borderWidth: 2,
    minItemHeight: 30,
    minItemWidth: 30,
    headerHeight: 30
  }
};

/**
 * The Golden Layout context for the IAN UI.
 * Note: Defines the Application Menu structure.
 */
const glComponents = (): GLMap =>
  new Map<string, GLComponentValue>([
    [
      'Analyst Displays',
      new Map([
        [
          components[Displays.IanDisplays.EVENTS].component,
          {
            id: components[Displays.IanDisplays.EVENTS],
            value: wrap(AnalystUiComponents.Events, IanDisplays.EVENTS)
          }
        ],
        [
          components[Displays.IanDisplays.MAP].component,
          {
            id: components[Displays.IanDisplays.MAP],
            value: wrap(AnalystUiComponents.IANMap, IanDisplays.MAP)
          }
        ],
        [
          components[Displays.IanDisplays.SIGNAL_DETECTIONS].component,
          {
            id: components[Displays.IanDisplays.SIGNAL_DETECTIONS],
            value: wrap(AnalystUiComponents.SignalDetections, IanDisplays.SIGNAL_DETECTIONS)
          }
        ],
        [
          components[Displays.IanDisplays.STATION_PROPERTIES].component,
          {
            id: components[Displays.IanDisplays.STATION_PROPERTIES],
            value: wrap(AnalystUiComponents.StationProperties, IanDisplays.STATION_PROPERTIES)
          }
        ],
        [
          components[Displays.IanDisplays.WAVEFORM].component,
          {
            id: components[Displays.IanDisplays.WAVEFORM],
            value: wrap(AnalystUiComponents.Waveform, IanDisplays.WAVEFORM)
          }
        ],
        [
          components[Displays.IanDisplays.WORKFLOW].component,
          {
            id: components[Displays.IanDisplays.WORKFLOW],
            value: wrap(AnalystUiComponents.Workflow, IanDisplays.WORKFLOW)
          }
        ],
        [
          components[Displays.IanDisplays.FILTERS].component,
          {
            id: components[Displays.IanDisplays.FILTERS],
            value: wrap(AnalystUiComponents.Filters, IanDisplays.FILTERS)
          }
        ],
        [
          components[Displays.IanDisplays.HISTORY].component,
          {
            id: components[Displays.IanDisplays.HISTORY],
            value: wrap(AnalystUiComponents.History, IanDisplays.HISTORY)
          }
        ],
        [
          components[Displays.IanDisplays.AZIMUTH_SLOWNESS].component,
          {
            id: components[Displays.IanDisplays.AZIMUTH_SLOWNESS],
            value: wrap(AnalystUiComponents.AzimuthSlowness, IanDisplays.AZIMUTH_SLOWNESS)
          }
        ]
      ])
    ]
  ]);

/** The Golden Layout context */
export const glContextData = (): GoldenLayoutContextData => ({
  glComponents: glComponents(),
  gl: undefined,
  glRef: undefined,
  config: {
    components,
    workspace: defaultGoldenLayoutConfig
  },
  supportedUserInterfaceMode: UserProfileTypes.UserMode.IAN
});
