import { Checkbox } from '@blueprintjs/core';
import { DropDown } from '@gms/ui-core-components';
import type { AnalystWorkspaceTypes } from '@gms/ui-state';
import produce from 'immer';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { MagnitudeCategory, systemConfig } from '~analyst-ui/config/system-config';

export interface MagnitudeConfigurationProps {
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes;
  setCategoryAndTypes(types: AnalystWorkspaceTypes.DisplayedMagnitudeTypes): void;
}
export interface MagnitudeConfigurationState {
  displayedMagnitudeTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes;
}

export class MagnitudeConfiguration extends React.Component<
  MagnitudeConfigurationProps,
  MagnitudeConfigurationState
> {
  /**
   * constructor
   */
  public constructor(props: MagnitudeConfigurationProps) {
    super(props);
    this.state = {
      displayedMagnitudeTypes: props.displayedMagnitudeTypes
    };
  }

  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const { displayedMagnitudeTypes } = this.state;
    const surfaceWave = this.isSurfaceWave() ? MagnitudeCategory.SURFACE : '';
    const magnitudeConfigurationValue = this.isBodyWave() ? MagnitudeCategory.BODY : surfaceWave;

    return (
      <div className="magnitude-configuration-popover">
        <div className="magnitude-configuration-popover__dropdown">
          <DropDown<typeof MagnitudeCategory>
            dropDownItems={MagnitudeCategory}
            value={this.isCustom() ? '' : magnitudeConfigurationValue}
            custom={this.isCustom()}
            onChange={val => {
              this.setState(
                {
                  displayedMagnitudeTypes: systemConfig.displayedMagnitudesForCategory.get(
                    val as MagnitudeCategory
                  )
                },
                this.callback
              );
            }}
          />
          <div className="magnitude-configuration-popover__label">Customize Magnitude Types:</div>
          <div className="magnitude-configuration-checkboxes">
            {Object.keys(displayedMagnitudeTypes).map((key, index) => (
              <Checkbox
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                label={key}
                checked={displayedMagnitudeTypes[key]}
                onClick={() => {
                  this.setState(
                    prevState =>
                      produce(prevState, draft => {
                        draft.displayedMagnitudeTypes[key] = !draft.displayedMagnitudeTypes[key];
                      }),
                    this.callback
                  );
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  private readonly callback = () => {
    const { setCategoryAndTypes } = this.props;
    const { displayedMagnitudeTypes } = this.state;
    return setCategoryAndTypes(displayedMagnitudeTypes);
  };

  /**
   * Returns true if the selected state is a custom configuration,
   * does not match the configuration for body wave or surface wave.
   */
  private readonly isCustom = (): boolean => !(this.isBodyWave() || this.isSurfaceWave());

  /**
   * Returns true if the selected state matches the state for body waves.
   */
  private readonly isBodyWave = (): boolean => {
    const { displayedMagnitudeTypes } = this.state;
    return isEqual(
      displayedMagnitudeTypes,
      systemConfig.displayedMagnitudesForCategory.get(MagnitudeCategory.BODY)
    );
  };

  /**
   * Returns true if the selected state matches the state for surface waves.
   */
  private readonly isSurfaceWave = (): boolean => {
    const { displayedMagnitudeTypes } = this.state;
    return isEqual(
      displayedMagnitudeTypes,
      systemConfig.displayedMagnitudesForCategory.get(MagnitudeCategory.SURFACE)
    );
  };
}
