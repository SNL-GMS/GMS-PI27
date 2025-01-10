import React from 'react';

export interface ErrorTooltipProps {
  errorTitle: string | undefined;
  message: string;
}

/**
 * Component that renders an error title and an error message. Designed for use within error tooltips.
 */
export function ErrorTooltip({ errorTitle, message }: ErrorTooltipProps) {
  return (
    <div className="error-tooltip">
      <span className="error-tooltip__title">
        <span className="monospace">
          <span className="error-tooltip__label">Error:</span> {errorTitle}
        </span>
      </span>
      <span className="error-tooltip__message">{message}</span>
    </div>
  );
}
