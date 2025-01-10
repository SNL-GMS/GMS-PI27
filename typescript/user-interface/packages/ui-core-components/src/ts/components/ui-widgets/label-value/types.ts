import type React from 'react';

/**
 * App determines the default styling for the label-value toolbar item.
 */
export interface LabelValueProps {
  containerClass?: string;
  customStylePrefix?: string;
  label: string;
  numeric?: boolean;
  styleForValue?: React.CSSProperties;
  tooltip: string;
  value: React.ReactNode;
  valueColor?: string;
}
