import { FilterableOptionList } from '@gms/ui-core-components';
import React from 'react';

/**
 * How wide to render internal elements
 */
const widthPx = 160;

export interface PhaseSelectionListProps {
  phase?: string;
  sdPhases: string[];
  prioritySdPhases?: string[];
  onBlur(phase: string);
  onEnterForPhases?(phase: string);
  onPhaseClicked?(phase: string);
}

export interface PhaseSelectionMenuState {
  phase: string;
}

/**
 * Phase selection menu.
 */
export class PhaseSelectionList extends React.Component<
  PhaseSelectionListProps,
  PhaseSelectionMenuState
> {
  private constructor(props) {
    super(props);
    const { phase } = this.props;
    this.state = {
      phase: phase || 'P'
    };
  }

  /**
   * React component lifecycle.
   */
  // eslint-disable-next-line react/sort-comp
  public render(): JSX.Element {
    const { sdPhases, prioritySdPhases, onEnterForPhases } = this.props;
    const { phase } = this.state;
    return (
      <div className="alignment-dropdown">
        <FilterableOptionList
          options={sdPhases}
          onSelection={this.onPhaseSelection}
          onClick={this.onClick}
          onDoubleClick={this.onClick}
          priorityOptions={prioritySdPhases}
          defaultSelection={phase}
          widthPx={widthPx}
          onEnter={onEnterForPhases}
        />
      </div>
    );
  }

  /**
   * On phase selection event handler.
   *
   * @param phase the selected phase
   */
  private readonly onPhaseSelection = (phase: string) => {
    this.setState({ phase });
  };

  private readonly onClick = (phase: string) => {
    const { onPhaseClicked } = this.props;
    if (onPhaseClicked) {
      onPhaseClicked(phase);
    } else {
      this.setState({ phase });
    }
  };
}
