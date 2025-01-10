import { Alignment, Button, Icon, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import React from 'react';

import {
  hideImperativeContextMenu,
  showImperativeContextMenu
} from '../../imperative-context-menu';
import type { PopoverProps, PopoverState } from './types';

/**
 * Renders button in toolbar that creates and dismisses popovers
 * Not for external use
 */
export class PopoverButtonComponent extends React.Component<PopoverProps, PopoverState> {
  /** Internal reference to the button container */
  private internalRef: HTMLDivElement;

  private constructor(props) {
    super(props);
    this.state = {
      isExpanded: false
    };
  }

  /**
   * Handles onClose method of the context menu.
   */
  private readonly onClose = (): void => {
    const { onPopoverDismissed } = this.props;
    if (onPopoverDismissed) {
      onPopoverDismissed();
    }
    this.setState({ isExpanded: false });
  };

  /**
   * Toggles the popover
   *
   * @param leftOff left offset to render popover
   * @param topSet top offset to render popover
   */
  public togglePopover = (leftOffset?: number, topOffset?: number): void => {
    const { renderAsMenuItem } = this.props;
    const { isExpanded } = this.state;
    if (isExpanded) {
      this.setState({ isExpanded: false }, () => {
        hideImperativeContextMenu();
      });
    } else {
      const { popupContent } = this.props;
      const left = renderAsMenuItem
        ? this.internalRef.getBoundingClientRect().left + this.internalRef.scrollWidth
        : this.internalRef.getBoundingClientRect().left;
      // The plus four is a chosen offset - has no real world meaning
      const top = renderAsMenuItem
        ? this.internalRef.getBoundingClientRect().top
        : this.internalRef.getBoundingClientRect().top + this.internalRef.scrollHeight + 4;

      // set the state to expanded
      this.setState({ isExpanded: true }, () => {
        showImperativeContextMenu({
          content: popupContent,
          onClose: this.onClose,
          targetOffset: {
            left: leftOffset || left,
            top: topOffset || top
          }
        });
      });
    }
  };

  /**
   * React component lifecycle.
   */
  public render(): JSX.Element {
    const {
      widthPx,
      onlyShowIcon,
      icon,
      iconLeft,
      label,
      renderAsMenuItem,
      disabled,
      tooltip,
      onClick
    } = this.props;

    const { isExpanded } = this.state;

    const widthStr = widthPx ? `${widthPx}px` : undefined;
    const iconAlignText = onlyShowIcon ? Alignment.CENTER : Alignment.LEFT;
    const iconClassName = onlyShowIcon ? 'toolbar-button--icon-only' : 'toolbar-button';
    const iconLabel = onlyShowIcon ? null : label;
    const iconSymbol = icon || IconNames.CARET_DOWN;

    return (
      <div
        ref={ref => {
          if (ref) {
            this.internalRef = ref;
          }
        }}
      >
        {renderAsMenuItem ? (
          <MenuItem
            disabled={disabled}
            icon={IconNames.MENU_OPEN}
            text={label}
            label="opens dialog"
            onClick={event => {
              event.stopPropagation();
              this.togglePopover();
            }}
          />
        ) : (
          <Button
            icon={iconLeft}
            title={tooltip}
            disabled={disabled}
            onClick={() => {
              this.togglePopover();
              if (onClick) {
                onClick(this.internalRef);
              }
            }}
            active={isExpanded}
            style={{ width: widthStr }}
            alignText={iconAlignText}
            className={iconClassName}
          >
            <span>{iconLabel}</span>
            <Icon title={false} icon={iconSymbol} />
          </Button>
        )}
      </div>
    );
  }
}
