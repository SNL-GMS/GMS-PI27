import type { IconName } from '@blueprintjs/core';

export interface PopoverProps {
  label: string;
  popupContent: JSX.Element;
  renderAsMenuItem?: boolean;
  disabled?: boolean;
  tooltip: string;
  widthPx?: number;
  onlyShowIcon?: boolean;
  icon?: IconName;
  /** Additional icon to be shown on the left side */
  iconLeft?: IconName;
  onPopoverDismissed?: () => void;
  onClick?(ref?: HTMLDivElement);
}
export interface PopoverState {
  isExpanded: boolean;
}
