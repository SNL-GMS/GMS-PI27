import { Classes, NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { FkQueryStatus } from '@gms/ui-state';
import classNames from 'classnames';
import React from 'react';

import { FkThumbnailSize } from '../fk-thumbnail-list/fk-thumbnails-controls';

export interface FkThumbnailContentProps {
  fkQueryStatus: FkQueryStatus | undefined;
  sizePx: number;
  /** Applied to all possible content states */
  onClick: React.MouseEventHandler<HTMLElement>;
  /** Only applied to a loaded image */
  onDoubleClick: React.MouseEventHandler<HTMLCanvasElement>;
}

/**
 * Determines what content will be shown as part of the greater FK thumbnail component. Ideally
 * will show the FK thumbnail image, otherwise will show non-ideal states for pending query, error,
 * or invalid phase/station type.
 */
export const FkThumbnailContent = React.forwardRef<HTMLCanvasElement, FkThumbnailContentProps>(
  function FkThumbnailContent(
    { fkQueryStatus, sizePx, onClick, onDoubleClick }: FkThumbnailContentProps,
    ref
  ) {
    // Return canvas element
    if (fkQueryStatus === FkQueryStatus.SUCCESS) {
      return (
        <canvas
          className="fk-thumbnail__content"
          data-testid="fk-thumbnail"
          height={sizePx}
          width={sizePx}
          ref={ref}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        />
      );
    }

    const isPending = fkQueryStatus === FkQueryStatus.PENDING_QUERY;
    const invalidStationOrPhase =
      fkQueryStatus === FkQueryStatus.INVALID_PHASE ||
      fkQueryStatus === FkQueryStatus.INVALID_STATION_TYPE;

    const icon = invalidStationOrPhase ? IconNames.DISABLE : IconNames.ISSUE;

    let message = '';
    switch (fkQueryStatus) {
      case FkQueryStatus.PENDING_QUERY:
        message = 'Loading';
        break;
      case FkQueryStatus.INVALID_PHASE:
      case FkQueryStatus.INVALID_STATION_TYPE:
        message = 'Could not compute due to invalid phase or station type';
        break;
      case FkQueryStatus.NO_TEMPLATE:
      case FkQueryStatus.NETWORK_FAILURE:
        message = 'Failed to compute';
        break;
      default:
        break;
    }

    const large = sizePx === FkThumbnailSize.LARGE;

    // Else return a non-ideal state
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/control-has-associated-label
      <div
        className={classNames({
          'fk-thumbnail__content': true,
          'fk-thumbnail__content--small': !large
        })}
        // Include tooltip if thumbnail size is not LARGE
        title={!large ? message : undefined}
        style={{
          height: `${sizePx}px`,
          width: `${sizePx}px`
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        <NonIdealState
          className={classNames({
            [Classes.SKELETON]: isPending,
            'fk-thumbnail__content--failed': !isPending && !invalidStationOrPhase
          })}
          icon={!isPending ? icon : undefined}
          // Only include description text if thumbnail size is LARGE
          description={large ? message : undefined}
        />
      </div>
    );
  }
);
