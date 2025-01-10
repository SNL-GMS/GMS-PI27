/* eslint-disable react/destructuring-assignment */
import classNames from 'classnames';
import kebabCase from 'lodash/kebabCase';
import React from 'react';

import type { LabelValueProps } from './types';

export function LabelValue(props: LabelValueProps) {
  const { customStylePrefix } = props;
  const prefix = customStylePrefix != null ? `${customStylePrefix}-` : '';
  const containerClass = `${prefix}label-value-container`;
  const labelClass = `${prefix}label-value__label`;
  const valueClass = `${prefix}label-value__value`;
  const numericClass = props.numeric ? `${valueClass}--numeric` : null;
  const customContainerClass = `${containerClass} ${
    props.containerClass ? props.containerClass : ''
  }`;
  const labelKebab = kebabCase(props.label);
  return (
    <div className={props.containerClass ? customContainerClass : containerClass}>
      <div className={labelClass} data-cy={`${labelKebab}-label`}>
        {props.label && props.label.length > 0 ? `${props.label}: ` : ''}
      </div>
      <div
        title={props.tooltip}
        className={classNames(valueClass, numericClass)}
        data-cy={`${labelKebab}-value`}
        style={{
          color: props.valueColor ? props.valueColor : '',
          ...props.styleForValue
        }}
      >
        {props.value}
      </div>
    </div>
  );
}
