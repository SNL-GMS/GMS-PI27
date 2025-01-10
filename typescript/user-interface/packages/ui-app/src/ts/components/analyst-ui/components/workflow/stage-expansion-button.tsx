import { Button } from '@blueprintjs/core';
import React from 'react';

export interface StageExpansionButtonProps {
  readonly isExpanded: boolean;
  readonly disabled: boolean;
  readonly stageName: string;
  readonly toggle: () => void;
}

function StageExpansionButtonComponent(props: StageExpansionButtonProps) {
  const { disabled, stageName, isExpanded, toggle } = props;
  const smallSign = isExpanded ? 'small-minus' : 'small-plus';
  return !disabled ? (
    <Button
      key={stageName}
      className="stage-row__expand-button"
      icon={smallSign}
      onClick={toggle}
      disabled={disabled}
    />
  ) : null;
}

export const StageExpansionButton: React.FunctionComponent<StageExpansionButtonProps> = React.memo(
  StageExpansionButtonComponent
);
