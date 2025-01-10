import React from 'react';

import type { CounterEntryProps } from './counter-entry';
import { CounterEntry } from './counter-entry';

export interface CounterProps {
  readonly entries: CounterEntryProps[];
}

/**
 * Provides a counter with colors, labels, and prefixed number option for the count values
 *
 * @param props CounterProps
 * @returns Counter entries with labels
 */
export function Counter(props: CounterProps) {
  const { entries } = props;
  return (
    <div className="counter">
      {entries.map((entry: CounterEntryProps) => (
        <CounterEntry
          key={entry.name}
          name={entry.name}
          tooltip={entry.tooltip}
          color={entry.color}
          value={entry.value}
          numberOfDigitsToDisplay={entry.numberOfDigitsToDisplay}
          onClick={entry.onClick}
          isShown={entry.isShown}
        />
      ))}
    </div>
  );
}
