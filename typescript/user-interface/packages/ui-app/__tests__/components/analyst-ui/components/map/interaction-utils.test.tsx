/* eslint-disable no-underscore-dangle */

import * as Cesium from 'cesium';

import * as InteractionUtils from '../../../../../src/ts/components/analyst-ui/components/map/interaction-utils';
import * as MapUtils from '../../../../../src/ts/components/analyst-ui/components/map/map-utils';
import { mockSd } from './map-sd-mock-data';

const mockShowContextMenu = jest.fn();
const mockHideContextMenu = jest.fn();
console.warn = jest.fn();
jest.mock('@blueprintjs/core', () => {
  const actual = jest.requireActual('@blueprintjs/core');
  return {
    ...actual,
    showContextMenu: () => {
      mockShowContextMenu();
    },
    hideContextMenu: () => {
      mockHideContextMenu();
    }
  };
});

// Mock console.warn so they are not getting out put to the test log
// several tests are unhappy path tests and will console warn
console.warn = jest.fn();

describe('Ian map tooltip utils', () => {
  test('are defined', () => {
    expect(InteractionUtils.stationTooltipLabel).toBeDefined();
    expect(InteractionUtils.eventTooltipLabel).toBeDefined();
    expect(InteractionUtils.tooltipHandleMouseMove).toBeDefined();
    expect(InteractionUtils.tooltipHandleAltClick).toBeDefined();
    expect(InteractionUtils.clearEventTooltip).toBeDefined();
    expect(InteractionUtils.clearHoverTooltip).toBeDefined();
    expect(InteractionUtils.formatEntityAsTooltip).toBeDefined();
    expect(InteractionUtils.buildSiteOrStationTooltip).toBeDefined();
    expect(InteractionUtils.buildSignalDetectionTooltip).toBeDefined();
    expect(InteractionUtils.buildEventTooltip).toBeDefined();
  });
  test('StationTooltipLabel should match snapshot', () => {
    expect(InteractionUtils.stationTooltipLabel).toMatchSnapshot();
  });

  test('buildSiteOrStationTooltip should update the tooltip entity for stations and channels', () => {
    const thingToChange = {
      label: {
        text: '',
        backgroundColor: '',
        fillColor: '',
        scale: '',
        font: '',
        backgroundPadding: ''
      }
    } as any;
    const viewer = {
      camera: {
        pickEllipsoid: () => {
          return { x: 1, y: 2 };
        }
      },
      scene: { globe: { ellipsoid: {} } }
    } as any;
    const movement = { endPosition: { x: 1, y: 2 } } as any;
    const selectedEntity = { name: 'entity' } as any;
    InteractionUtils.buildSiteOrStationTooltip(thingToChange, viewer, movement, selectedEntity);
    expect(thingToChange).toMatchSnapshot();
  });
  test('buildSignalDetectionTooltip should updated the tooltip for SDs', () => {
    const thingToChange = {
      label: {
        text: '',
        backgroundColor: '',
        fillColor: '',
        scale: '',
        font: '',
        backgroundPadding: ''
      }
    } as any;
    const viewer = {
      camera: {
        pickEllipsoid: () => {
          return { x: 1, y: 2 };
        }
      },
      scene: { globe: { ellipsoid: {} } }
    } as any;
    const movement = { endPosition: { x: 1, y: 2 } } as any;
    const properties = {
      phaseValue: { getValue: jest.fn(() => 'value') },
      stationName: { getValue: jest.fn(() => 'value') }
    } as any;
    InteractionUtils.buildSignalDetectionTooltip(thingToChange, viewer, movement, properties);
    expect(thingToChange).toMatchSnapshot();
  });

  test('buildEventTooltip should updated the tooltip for event', () => {
    const thingToChange = {
      label: {
        text: '',
        backgroundColor: '',
        fillColor: '',
        scale: '',
        font: '',
        backgroundPadding: ''
      }
    } as any;
    const viewer = {
      camera: {
        pickEllipsoid: () => {
          return { x: 1, y: 2 };
        }
      },
      scene: { globe: { ellipsoid: {} } }
    } as any;
    const movement = { endPosition: { x: 1, y: 2 } } as any;
    const properties = {
      event: {
        getValue: jest.fn(() => {
          return { time: { value: 'value' } };
        })
      }
    } as any;
    InteractionUtils.buildEventTooltip(thingToChange, viewer, movement, properties);
    expect(thingToChange).toMatchSnapshot();
  });

  describe('TooltipHandleMouseMove', () => {
    const movement: any = {
      endPosition: 'position'
    };

    const tooltipDataSource = {
      name: 'Tooltip',
      entities: {
        getById: jest.fn(() => {
          return {
            id: 'hoverLabelEntity',
            label: {
              text: 'default'
            }
          };
        }),
        add: jest.fn(() => {
          return InteractionUtils.stationTooltipLabelOptions;
        })
      }
    };
    const viewer = {
      dataSources: {
        getByName: jest.fn(() => {
          return [tooltipDataSource];
        }),
        entities: {
          getById: jest.fn(() => {
            return undefined;
          }),

          add: jest.fn(() => {
            return InteractionUtils.stationTooltipLabelOptions;
          })
        }
      },
      scene: {
        pickPosition: jest.fn(() => {
          return 'myPosition';
        }),
        requestRender: jest.fn(),
        globe: { ellipsoid: undefined }
      },
      camera: {
        pickEllipsoid: jest.fn(() => {
          return 'myPosition';
        })
      }
    };

    const stationProperties = {
      coordinates: {
        _value: {
          latitude: 100,
          longitude: 100,
          elevation: 100
        }
      },
      statype: {
        _value: 'SEISMIC_3_COMPONENT'
      },
      type: 'Station'
    };

    const channelGroupProperties = {
      coordinates: {
        _value: {
          latitude: 100,
          longitude: 100,
          elevation: 100
        }
      },
      type: 'ChannelGroup'
    };

    const signalDetectionProperties = {
      phaseValue: {
        value: 'P'
      },
      stationName: 'station',
      type: 'Signal detection'
    };

    const eventProperties = {
      type: 'Event location',
      event: {
        id: 'eventId',
        time: 0,
        latitudeDegrees: 1,
        longitudeDegrees: 2,
        depthKm: 3
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // reassign getObjectFromPoint to get a empty entity back
      // like we would if nothing is below the hovered point
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return {};
        }
      });
    });

    test('should handle updating the labels for a Station', () => {
      const selectedEntityStation = {
        name: 'AAK',
        properties: { getValue: jest.fn(() => stationProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 1, y: 2, z: 3 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleMouseMove(
        movement,
        viewer as any
      );
      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('hoverLabelEntity');
      expect(defaultLabelEntity).toMatchSnapshot();
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(1);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntityStation;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity.label.show._value).toBeFalsy();
      expect(labelEntity).toMatchSnapshot();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(2);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('should handle updating the labels for a Channel Group', () => {
      const selectedEntityChannelGroup = {
        name: 'AAK0',
        properties: { getValue: jest.fn(() => channelGroupProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 1, y: 2, z: 3 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleMouseMove(
        movement,
        viewer as any
      );
      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('hoverLabelEntity');
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(1);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntityChannelGroup;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity).toMatchSnapshot();
      expect(labelEntity.label.show._value).toBeFalsy();

      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(2);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('should handle updating the labels for a signal detection', () => {
      const selectedEntitySignalDetection = {
        properties: { getValue: jest.fn(() => signalDetectionProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 1, y: 2, z: 3 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleMouseMove(
        movement,
        viewer as any
      );
      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('hoverLabelEntity');
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(1);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntitySignalDetection;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity).toMatchSnapshot();
      expect(labelEntity.label.show._value).toBeFalsy();

      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(2);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('should handle updating the labels for an Event', () => {
      const selectedEvent = {
        properties: { getValue: jest.fn(() => eventProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 1, y: 2, z: 3 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleMouseMove(
        movement,
        viewer as any
      );

      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('hoverLabelEntity');
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(1);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);

      // reassigned getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => selectedEvent
      });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);

      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity).toMatchSnapshot();
      expect(labelEntity.label.show._value).toBeFalsy();

      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(2);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('should not show a tooltip if the hovered entity has no properties', () => {
      const selectedEntityChannelGroupNoProperties = {
        name: 'AAK0'
      };

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntityChannelGroupNoProperties;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity.label.show._value).toBe(false);
    });

    test('should not show a tooltip if the hovered entity is not a station or channel group', () => {
      const selectedEntityWrongType =
        // reassign getObjectFromPoint to get a correct entity back
        Object.assign(InteractionUtils, {
          ...InteractionUtils,
          getObjectFromPoint: () => {
            return selectedEntityWrongType;
          }
        });

      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('hoverLabelEntity');
      expect(labelEntity.label.show._value).toBe(false);
    });

    test('should not show a tooltip if the tooltip datasource is not present', () => {
      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, {
        dataSources: { getByName: jest.fn(() => undefined) }
      } as any);
      // should return undefined
      expect(labelEntity).not.toBeDefined();
    });

    test('should not show a tooltip if there is no label entity', () => {
      const labelEntity: any = InteractionUtils.tooltipHandleMouseMove(movement, {
        dataSources: {
          getByName: jest.fn(() => [{ entities: { getById: jest.fn(() => undefined) } }])
        }
      } as any);
      // should return undefined
      expect(labelEntity).not.toBeDefined();
    });
  });

  describe('TooltipHandleAltClick', () => {
    const movement = {
      position: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 100, y: 100 }
    };

    const tooltipDataSource = {
      name: 'Tooltip',
      entities: {
        getById: jest.fn(() => {
          return {
            id: 'eventLabelEntity',
            label: {
              text: 'default',
              show: new Cesium.ConstantProperty(false)
            }
          };
        }),
        add: jest.fn(() => {
          return InteractionUtils.eventTooltipLabelOptions;
        })
      }
    };
    const viewer = {
      dataSources: {
        getByName: jest.fn(() => {
          return [tooltipDataSource];
        }),
        entities: {
          getById: jest.fn(() => {
            return undefined;
          }),

          add: jest.fn(() => {
            return InteractionUtils.eventTooltipLabelOptions;
          })
        }
      },
      scene: {
        pickPosition: jest.fn(() => {
          return 'myPosition';
        }),
        requestRender: jest.fn()
      }
    };

    const eventProperties = {
      type: 'Event location',
      event: {
        id: 'eventId',
        time: 0,
        latitudeDegrees: 1,
        longitudeDegrees: 2,
        depthKm: 3
      }
    };
    // set up canvas focus so we dont get any errors

    beforeEach(() => {
      jest.clearAllMocks();
      // reassign getObjectFromPoint to get a empty entity back
      // like we would if nothing is below the hovered point
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return {};
        }
      });
    });

    test('should handle updating the labels for an event', () => {
      const selectedEntityEvent = {
        properties: { getValue: jest.fn(() => eventProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 4, y: 5, z: 6 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should not receive a label back from this non-event entity mock
      expect(defaultLabelEntity).not.toBeDefined();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(0);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntityEvent;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // ensure undefined, no longer displaying details in tooltip
      expect(labelEntity).not.toBeDefined();
      expect(labelEntity).toMatchSnapshot();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(0);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('clicking an sd does not inhibit updating event labels', () => {
      const sdProperties = mockSd;
      const selectedEntitySd = {
        properties: { getValue: jest.fn(() => sdProperties) },
        position: {
          getValue: jest.fn(() => {
            return { x: 4, y: 5, z: 6 };
          })
        }
      };

      const defaultLabelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should not receive a label entity back for a non-event entity
      expect(defaultLabelEntity).not.toBeDefined();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(0);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntitySd;
        }
      });
      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should not get a label entity back when clicking on a SD
      expect(labelEntity).not.toBeDefined();
      expect(tooltipDataSource.entities.getById).toHaveBeenCalledTimes(0);
      expect(tooltipDataSource.entities.add).toHaveBeenCalledTimes(0);
    });

    test('should not show a tooltip if the hovered entity has no properties', () => {
      const selectedEntityEventNoProperties = {};

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(MapUtils, {
        ...MapUtils,
        getObjectFromPoint: () => {
          return selectedEntityEventNoProperties;
        }
      });

      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should not receive a label entity back
      expect(labelEntity).not.toBeDefined();
    });

    test('should not show a tooltip if the hovered entity is not an event location', () => {
      const selectedEntityWrongType =
        // reassign getObjectFromPoint to get a correct entity back
        Object.assign(InteractionUtils, {
          ...InteractionUtils,
          getObjectFromPoint: () => {
            return selectedEntityWrongType;
          }
        });

      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        viewer as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should not receive a label entity back
      expect(labelEntity).not.toBeDefined();
    });

    test('should not show a tooltip if the tooltip datasource is not present', () => {
      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        {
          dataSources: { getByName: jest.fn(() => undefined) }
        } as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should return undefined
      expect(labelEntity).not.toBeDefined();
    });

    test('should not show a tooltip if there is no label entity', () => {
      const labelEntity: any = InteractionUtils.tooltipHandleAltClick(
        movement as any,
        {
          dataSources: {
            getByName: jest.fn(() => [{ entities: { getById: jest.fn(() => undefined) } }])
          }
        } as any,
        [],
        jest.fn(),
        jest.fn()
      );
      // should return undefined
      expect(labelEntity).not.toBeDefined();
    });
  });

  describe('clearEventTooltip', () => {
    it('handles the escape key', () => {
      const mockTooltipEntity: any = { label: { show: new Cesium.ConstantProperty(true) } };

      const mockTooltipGetById: any = jest.fn(() => mockTooltipEntity);

      const mockTooltipDataSource: any = {
        entities: {
          getById: mockTooltipGetById
        }
      };

      const mockRender: any = jest.fn();

      InteractionUtils.setViewer({
        dataSources: { getByName: jest.fn(() => [mockTooltipDataSource]) },
        scene: {
          requestRender: mockRender
        }
      } as any);

      const mockEscapeEvent: any = { key: 'Escape' };

      InteractionUtils.clearEventTooltip(mockEscapeEvent);

      expect(mockTooltipGetById).toHaveBeenCalledWith('eventLabelEntity');

      expect(mockTooltipEntity.label.show._value).toBeFalsy();
      expect(mockRender).toHaveBeenCalled();
    });
    it('handles a non escape key', () => {
      const mockTooltipEntity: any = { label: { show: new Cesium.ConstantProperty(true) } };

      const mockTooltipGetById: any = jest.fn(() => mockTooltipEntity);

      const mockTooltipDataSource: any = {
        entities: {
          getById: mockTooltipGetById
        }
      };

      const mockRender: any = jest.fn();

      InteractionUtils.setViewer({
        dataSources: { getByName: jest.fn(() => [mockTooltipDataSource]) },
        scene: {
          requestRender: mockRender
        }
      } as any);

      const mockNonEscapeEvent: any = { key: 'E' };

      InteractionUtils.clearEventTooltip(mockNonEscapeEvent);

      expect(mockTooltipGetById).toHaveBeenCalledTimes(0);

      expect(mockTooltipEntity.label.show._value).toBeTruthy();
      expect(mockRender).toHaveBeenCalledTimes(0);
    });
  });

  describe('clearHoverTooltip', () => {
    it('handles the escape key', () => {
      const mockTooltipEntity: any = { label: { show: new Cesium.ConstantProperty(true) } };

      const mockTooltipGetById: any = jest.fn(() => mockTooltipEntity);

      const mockTooltipDataSource: any = {
        entities: {
          getById: mockTooltipGetById
        }
      };

      const mockRender: any = jest.fn();

      InteractionUtils.setViewer({
        dataSources: { getByName: jest.fn(() => [mockTooltipDataSource]) },
        scene: {
          requestRender: mockRender
        }
      } as any);

      const mockEscapeEvent: any = { key: 'Escape' };

      InteractionUtils.clearHoverTooltip(mockEscapeEvent);

      expect(mockTooltipGetById).toHaveBeenCalledWith('hoverLabelEntity');

      expect(mockTooltipEntity.label.show._value).toBeFalsy();
      expect(mockRender).toHaveBeenCalled();
    });
    it('handles a non escape key', () => {
      const mockTooltipEntity: any = { label: { show: new Cesium.ConstantProperty(true) } };

      const mockTooltipGetById: any = jest.fn(() => mockTooltipEntity);

      const mockTooltipDataSource: any = {
        entities: {
          getById: mockTooltipGetById
        }
      };

      const mockRender: any = jest.fn();

      InteractionUtils.setViewer({
        dataSources: { getByName: jest.fn(() => [mockTooltipDataSource]) },
        scene: {
          requestRender: mockRender
        }
      } as any);

      const mockNonEscapeEvent: any = { key: 'E' };

      InteractionUtils.clearHoverTooltip(mockNonEscapeEvent);

      expect(mockTooltipGetById).toHaveBeenCalledTimes(0);

      expect(mockTooltipEntity.label.show._value).toBeTruthy();
      expect(mockRender).toHaveBeenCalledTimes(0);
    });
  });
});
