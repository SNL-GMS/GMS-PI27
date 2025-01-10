import React from 'react';

interface DialogItemProps {
  /** Display label for the item */
  label: string;
  value: React.ReactNode;
  required?: boolean;
  monospace?: boolean;
}

/**
 * Simple item component to be used with a Dialog. Provides a label.
 */
export function DialogItem(props: DialogItemProps) {
  const { label, value, required, monospace } = props;

  const labelClassNames = `dialog-item__label ${required ? 'dialog-item__label--required' : ''}`;

  const valueClassNames = `dialog-item__value ${monospace ? 'monospace' : ''}`;
  return (
    <>
      <div className={labelClassNames}>{label}</div>
      <div className={valueClassNames}>{value}</div>
    </>
  );
}
