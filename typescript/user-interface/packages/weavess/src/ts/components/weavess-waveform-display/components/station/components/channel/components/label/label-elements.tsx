import { Tooltip } from '@blueprintjs/core';
import { classList } from '@gms/ui-util';
import classNames from 'classnames';
import React from 'react';

export interface LabelLeftExpandElementProps {
  channelId: string;
  onClick;
  isExpanded: boolean;
}

export interface LabelLeftCancelElementProps {
  channelId: string;
  onClick;
}

export interface DefaultLabelLeftElementProps {
  isDefaultChannel: boolean;
  isSplitChannel: boolean;
}

export interface LabelLeftElementProps {
  isDefaultChannel: boolean;
  isSplitChannel: boolean;
  labelContainerOnClick;
  closeSplitChannelOverlayCallback;
  channelId: string;
  isExpandable: boolean;
  isExpanded;
}

/**
 * A button for expanding or collapsing the channel row to reveal sub-channels
 *
 * @param props ExpandElementProps
 * @returns an expand element for the left hand side of the weavess label
 */
export function LabelLeftExpandElement(props: LabelLeftExpandElementProps) {
  const { channelId, onClick, isExpanded } = props;
  const expandText = isExpanded ? '-' : '+';
  const expandElem = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="label-container-left-parent-expansion-button"
      data-cy="weavess-expand-parent"
      data-cy-channel-name={channelId}
      onClick={onClick}
    >
      {expandText}
    </div>
  );
  return expandElem;
}

/**
 * A button used to cancel the split channel row expansion
 *
 * @param props CancelElementProps
 * @returns Cancel button element for the left hand side of the weavess label
 */
export function LabelLeftCancelElement(props: LabelLeftCancelElementProps) {
  const { channelId, onClick } = props;
  return (
    <Tooltip
      disabled={false}
      className={classList({
        'weavess-tooltip': true,
        'weavess-tooltip--cancel-element': true,
        'weavess-tooltip__target': true
      })}
      content="Cancel (hotkey: esc)"
      placement="right"
      hoverOpenDelay={250} // ms
    >
      {
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
          role="button"
          tabIndex={0}
          className="label-container-left-parent-cancel-button"
          data-cy="weavess-cancel-split"
          data-cy-channel-name={channelId}
          onClick={onClick}
        >
          x
        </div>
      }
    </Tooltip>
  );
}

/**
 *  Currently displayed when the channel is not expandable, and does not need a CancelElement.
 *  Is colored differently for split channels.
 *
 * @param props
 * @returns DefaultLeftElement for the left hand side of the weavess label
 */
export function DefaultLabelLeftElement(props: DefaultLabelLeftElementProps) {
  const { isDefaultChannel, isSplitChannel } = props;
  return (
    <div
      className={classNames({
        'label-container-left-child': true,
        'label-container-left-child--split-channel': isSplitChannel && !isDefaultChannel
      })}
    />
  );
}

/**
 * The left-hand element in a weavess channel label. Might contain an expand/collapse element if it's on a default channel,
 * or a cancel element if the default channel is in expansion mode.
 *
 * @param props
 * @returns left-hand weavess label element
 */
export const LabelLeftElement = React.memo(function LabelLeftElement(props: LabelLeftElementProps) {
  const {
    isDefaultChannel,
    isSplitChannel,
    closeSplitChannelOverlayCallback,
    labelContainerOnClick,
    channelId,
    isExpandable,
    isExpanded
  } = props;
  const expandElem = isExpandable ? (
    <LabelLeftExpandElement
      channelId={channelId}
      onClick={labelContainerOnClick}
      isExpanded={isExpanded}
    />
  ) : null;
  const cancelElement =
    isExpandable && isSplitChannel ? (
      <LabelLeftCancelElement channelId={channelId} onClick={closeSplitChannelOverlayCallback} />
    ) : null;

  /* render child label without expansion button */
  const labelWithoutExpansion = (
    <DefaultLabelLeftElement isDefaultChannel={isDefaultChannel} isSplitChannel={isSplitChannel} />
  );
  return isDefaultChannel ? (
    /* render parent label with expansion button */
    <div className="label-container-left-parent">{cancelElement ?? expandElem}</div>
  ) : (
    labelWithoutExpansion
  );
});
