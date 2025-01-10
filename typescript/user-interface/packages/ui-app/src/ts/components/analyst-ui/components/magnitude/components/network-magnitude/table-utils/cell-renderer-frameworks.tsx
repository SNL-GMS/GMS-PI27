/* eslint-disable react/prop-types */
import { Icon, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

export function SetCircleTick(props) {
  const { data } = props;
  return data.isPreferred ? <Icon icon={IconNames.TICK_CIRCLE} intent={Intent.PRIMARY} /> : <div />;
}
