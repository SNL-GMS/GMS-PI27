import React from 'react';

export interface FormattedTextProps {
  // text that should be split on newlines and wrapped in <p> tags
  textToFormat: string;

  // Optional string to concatenate to the end
  concatString?: string;
}

/**
 * Formats provided text with each line split on a `\n` or `\r` character and wrapped in a <p> tag
 *
 * @returns formatted text
 */
export function FormattedText({ textToFormat: tooltipText, concatString }: FormattedTextProps) {
  return (
    <>
      {tooltipText
        .concat(concatString ?? '')
        .split(/\r?\n/)
        .map(line => (
          <p key={line}>{line}</p>
        ))}
    </>
  );
}
