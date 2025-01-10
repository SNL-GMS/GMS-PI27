import React from 'react';

const TEN = 20;
const TWENTY = 20;
const FIFTY = 50;

export interface RecordSectionLabelsProps {
  /** Bottom value as number */
  bottomVal: number;

  /** Top value as number */
  topVal: number;

  /** Phases options as any */
  phases: [
    {
      percentX: number;
      percentY: number;
      phase: string;
    }
  ];
}

export class RecordSectionLabels extends React.Component<RecordSectionLabelsProps, unknown> {
  public readonly containerStyle: React.CSSProperties = {
    borderLeft: 'solid',
    borderWidth: '3px',
    height: '100%',
    position: 'absolute',
    width: '100%'
  };

  /**
   * Constructor
   *
   * @param props Record Section Labels props as RecordSectionLabelsProps
   */
  public constructor(props: RecordSectionLabelsProps) {
    super(props);
    this.state = {};
  }

  /**
   * @returns labels as any[]
   */
  public getLabels(): any[] {
    let labels: any[] = [];
    const { bottomVal, topVal } = this.props;
    const degreeRange = bottomVal - topVal;
    if (degreeRange) {
      const roundedTopVal = Math.floor(topVal);
      let interval = 0;

      if (degreeRange < FIFTY) {
        interval = 5;
      } else if (degreeRange < 100) {
        interval = TEN;
      } else {
        interval = TWENTY;
      }

      const numPoints = Math.floor(degreeRange / interval);
      const base = roundedTopVal + (interval - (roundedTopVal % interval));
      labels = Array.from(Array(numPoints).keys()).map(val => base + interval * val);
    }
    return labels;
  }

  public render(): JSX.Element {
    const { bottomVal, topVal, phases } = this.props;
    const yAxisLabels: any[] = this.getLabels();
    const scalingFactor = 100 / (bottomVal - topVal);
    const yAxisLabelElements: any[] = [];
    const phaseLabelElements: any[] = [];

    for (let i = 0; i < yAxisLabels.length; i += 1) {
      const style: React.CSSProperties = {
        WebkitTransform: 'translate(0, -50%)',
        left: '-1px',
        msTransform: 'translate(0, -50%)',
        position: 'absolute',
        textShadow: '-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white',
        top: `${(yAxisLabels[i] - topVal) * scalingFactor}%`,
        transform: 'translate(0, -50%)'
      };

      yAxisLabelElements.push(
        <div style={style} key={`label${i}`}>
          -{yAxisLabels[i]}
        </div>
      );
    }

    for (let i = 0; i < phases.length; i += 1) {
      const style: React.CSSProperties = {
        left: `${phases[i].percentX}%`,
        position: 'absolute',
        textShadow: '-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white',
        top: `${phases[i].percentY}%`
      };

      phaseLabelElements.push(
        <div style={style} key={`phase${i}`}>
          {phases[i].phase}
        </div>
      );
    }

    return (
      <div className="y-axis-container" style={this.containerStyle}>
        {yAxisLabelElements}
        {phaseLabelElements}
      </div>
    );
  }
}
