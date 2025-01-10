import classNames from 'classnames';
import React from 'react';

export interface CounterEntryProps {
  readonly name: string;
  readonly color: string;
  readonly value: number;
  readonly isShown: boolean;
  readonly numberOfDigitsToDisplay: number;
  readonly tooltip?: string;
  readonly onClick?: () => void;
}

interface PrefixedDisplayNumberProps {
  readonly digits: number;
  readonly value: number;
  readonly className?: string;
  readonly tooltip?: string;
}

/**
 * Used to display prefixed count values
 *
 * @param props PrefixedDisplayNumberProps
 * @returns prefixed count value
 */
function PrefixedDisplayNumber(props: PrefixedDisplayNumberProps) {
  const { digits, value, className, tooltip } = props;
  const prefixLength = digits - value.toString().length;

  return (
    <span className={`counter__count ${className ?? ''}`} title={tooltip}>
      {prefixLength > 0 && (
        <span className="counter__count--prefix">{new Array(prefixLength).fill(0)}</span>
      )}
      <span className="counter__count--main" title={tooltip}>
        {value}
      </span>
    </span>
  );
}

/**
 * Country Entry for display the label and the count value
 *
 * @param props CounterEntryProps
 * @returns a counter entry that is a span with a prefixed display number
 */
export function CounterEntry(props: CounterEntryProps) {
  const { name, color, value, isShown, numberOfDigitsToDisplay, tooltip, onClick } = props;
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <span
      className={classNames(
        {
          'counter__entry--disabled': !isShown,
          'counter__entry--clickable': !!onClick
        },
        'counter__entry'
      )}
      onClick={onClick}
      title={tooltip}
      style={{ '--entry-color': `${color}` } as React.CSSProperties}
    >
      <span className="counter__label">{name}</span>
      <PrefixedDisplayNumber digits={numberOfDigitsToDisplay} value={value} />
    </span>
  );
}
