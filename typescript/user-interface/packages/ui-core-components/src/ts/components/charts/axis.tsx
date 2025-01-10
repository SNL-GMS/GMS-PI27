/* eslint-disable react/destructuring-assignment */
import Immutable from 'immutable';
import * as React from 'react';
import { VictoryAxis, VictoryLabel } from 'victory';

import type { AxisProps, BarDefinition } from './types';
import { baseLabelStyles } from './victory-themes';

/**
 * Custom mask for adding hash to tick labels
 *
 * @param hasMask, should add hashed pattern
 * @returns mask on for tick label
 */
function LabelMask(props: { hasMask: boolean }) {
  if (!props.hasMask) {
    return null;
  }

  return (
    <svg>
      <defs>
        <pattern
          id="pattern-stripe"
          width="16"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="8" height="4" transform="translate(8,0)" fill="#999" />
          <rect width="8" height="4" transform="translate(0,0)" fill="white" />
        </pattern>
        <mask id="mask-stripe">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-stripe)" />
        </mask>
      </defs>
    </svg>
  );
}

/**
 * Custom label for the axis tic marks.
 * Adds the ability to add tooltips to the tic labels.
 */
function Label(props: {
  // the `any` types are used because that is what Victory expects
  index?: any;
  x?: any;
  y?: any;
  text?: any;
  verticalAnchor?: any;
  textAnchor?: any;
  angle?: any;
  transform?: any;
  style?: any;
  events?: any;
  dx?: number;
  dy?: number;
  tooltips?: string[];
  xLabelInfoMap?: Immutable.Map<
    string,
    {
      isDisabled: boolean;
      tooltip: string;
      index: number;
      hasBackground: boolean;
      backgroundColor: string;
      labelFontColor: string;
      isHashedPattern: boolean;
    }
  >;
  disabledColor?: string;
  onContextMenuBarLabel?(e: any, index: number): void;
}) {
  const labelInfo =
    props.xLabelInfoMap && props.xLabelInfoMap.has(props.text)
      ? props.xLabelInfoMap.get(props.text)
      : undefined;
  const backgroundStyle =
    labelInfo && labelInfo.hasBackground
      ? {
          fill: labelInfo.backgroundColor,
          opacity: 0.9,
          rx: 4,
          ry: 4,
          strokeWidth: 1,
          stroke: labelInfo.labelFontColor,
          mask: labelInfo.isHashedPattern ? 'url(#mask-stripe)' : ''
        }
      : { opacity: 0 };

  let fillColorToUse = props.style.fill;
  if (labelInfo?.labelFontColor) {
    fillColorToUse = labelInfo.labelFontColor;
  }

  let title = props.text;
  if (labelInfo) {
    title = labelInfo.tooltip;
  } else if (props?.tooltips?.[props.index]) {
    title = props.tooltips[props.index];
  }

  // The svg below is used to add hash pattern to tickLabels when added to the backgroundStyle
  return (
    <>
      <LabelMask hasMask={labelInfo?.isHashedPattern ?? false} />
      <VictoryLabel
        events={{
          onContextMenu: e => {
            if (props?.onContextMenuBarLabel && labelInfo)
              props.onContextMenuBarLabel(e, labelInfo.index);
          }
        }}
        title={`${title}`}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        backgroundPadding={[
          { left: 4 - Number(props.dx), right: 4 + Number(props.dx), top: 4, bottom: 3 }
        ]}
        backgroundStyle={backgroundStyle}
        style={{
          ...props.style,
          // Overriding props with disabled fill
          fill: labelInfo && labelInfo.isDisabled ? props.disabledColor : fillColorToUse
        }}
      />
    </>
  );
}

/**
 * Builds the InfoMap label for each BarDef
 *
 * @param props
 * @param index
 * @param isDisabledList
 * @param barDef
 * @returns
 */
function buildBarDefLabelInfoMap(
  props: AxisProps,
  index: number,
  isDisabledList: boolean[],
  barDef: BarDefinition
): Immutable.Map<
  string,
  {
    isDisabled: boolean;
    hasBackground: boolean;
    tooltip: string;
    index: number;
    backgroundColor: string;
    labelFontColor: string;
    isHashedPattern: boolean;
  }
> {
  const hasLabelsWithBackGround = props.xTickLabels && props.xTickLabels[index] !== undefined;
  const bgColor = hasLabelsWithBackGround
    ? props.xTickLabels?.[index].labelBackgroundColor
    : undefined;
  const lblFontColor = hasLabelsWithBackGround
    ? props.xTickLabels?.[index].labelFontColor
    : undefined;
  const isHashedPat = hasLabelsWithBackGround
    ? props.xTickLabels?.[index].isHashedPattern
    : undefined;
  const toolTip = props.xTickTooltips ? props.xTickTooltips[index] : undefined;
  let labelInfoMap = Immutable.Map<
    string,
    {
      isDisabled: boolean;
      hasBackground: boolean;
      tooltip: string;
      index: number;
      backgroundColor: string;
      labelFontColor: string;
      isHashedPattern: boolean;
    }
  >();
  labelInfoMap = labelInfoMap.set(
    props.xTickFormat ? (props.xTickFormat(barDef.id) as string) : (barDef.id as string),
    {
      isDisabled: isDisabledList[index],
      tooltip: toolTip || '',
      index,
      hasBackground: hasLabelsWithBackGround || false,
      backgroundColor: bgColor || '',
      labelFontColor: lblFontColor || '',
      isHashedPattern: isHashedPat || false
    }
  );
  return labelInfoMap;
}

function SetLabelInfoMap(props: AxisProps, xTicks: { value: number; tooltip: string }[] = []) {
  let labelInfoMap = Immutable.Map<
    string,
    {
      isDisabled: boolean;
      hasBackground: boolean;
      tooltip: string;
      index: number;
      backgroundColor: string;
      labelFontColor: string;
      isHashedPattern: boolean;
    }
  >();
  if (props.barDefs) {
    props.barDefs.forEach((barDef, index) => {
      const tickTooltips = props.xTickTooltips ? props.xTickTooltips[index] : undefined;
      xTicks.push({
        value: barDef.value.y,
        tooltip: tickTooltips || ''
      });
    });
    const isDisabledList = xTicks.map(tick =>
      props?.disabled?.xTicks ? props.disabled.xTicks.disabledCondition(tick) : false
    );

    props.barDefs.forEach((barDef, index) => {
      labelInfoMap = buildBarDefLabelInfoMap(props, index, isDisabledList, barDef);
    });
    return labelInfoMap;
  }
  return undefined;
}
/**
 * A component that renders the Victory Axis for a Victory Chart.
 */
export function Axis(props: AxisProps) {
  /* x-axis tic padding in pixels */
  const rotatePixelX = -30;
  const rotatePixelY = -10;
  const xAxisTicPaddingX: number = props.rotateAxis ? rotatePixelX : 0;
  const xAxisTicPaddingY: number = props.rotateAxis ? rotatePixelY : 0;

  /* y-axis tic padding in pixels */
  const yAxisTicPaddingX = 6;
  const yAxisTicPaddingY = 0;
  const xTicks: { value: number; tooltip: string }[] = [];
  const labelInfoMap = SetLabelInfoMap(props, xTicks);
  const xTickFormat = value => (props.xTickFormat ? props.xTickFormat(value) : value);
  const negativeOfAngle = -65;
  const labelAngle = props.rotateAxis ? negativeOfAngle : 0;
  return (
    <>
      {!props.suppressXAxis ? (
        <VictoryAxis
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          dependentAxis={false}
          label={props.xAxisLabel}
          tickCount={props.xTickCount}
          tickValues={props.xTickValues}
          tickFormat={xTickFormat}
          tickLabelComponent={
            <Label
              // eslint-disable-next-line @typescript-eslint/unbound-method
              onContextMenuBarLabel={props.onContextMenuBarLabel}
              dx={xAxisTicPaddingX}
              dy={xAxisTicPaddingY}
              disabledColor={props.disabled?.xTicks?.disabledColor}
              xLabelInfoMap={labelInfoMap}
              angle={labelAngle}
            />
          }
          style={{
            axisLabel: {
              ...baseLabelStyles,
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers
              padding: props.rotateAxis ? 82 : 50
            },
            tickLabels: {
              fontSize: 10,
              fontWeight: props.xTickLabels ? 'bold' : 'normal',
              letterSpacing: '1px'
            }
          }}
        />
      ) : undefined}

      {!props.suppressYAxis ? (
        <VictoryAxis
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          dependentAxis
          label={props.yAxisLabel}
          tickCount={props.yTickCount}
          tickValues={props.yTickValues}
          tickFormat={value => (props.yTickFormat ? props.yTickFormat(value) : value)}
          tickLabelComponent={
            <Label tooltips={props.yTickTooltips} dx={yAxisTicPaddingX} dy={yAxisTicPaddingY} />
          }
          style={{
            axisLabel: {
              ...baseLabelStyles,
              padding: 40
            },
            tickLabels: {
              fontSize: 10
            }
          }}
        />
      ) : undefined}
    </>
  );
}
