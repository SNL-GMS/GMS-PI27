import { Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import React from 'react';

import { Tooltip2Wrapper } from '../tooltip';

export interface HelpTextIconProps {
  children: React.ReactNode & (string | JSX.Element);
  align?: 'top' | 'center' | 'bottom';
}

/**
 * Component to create a tooltip icon that appears on hover, and that adds
 * the help text to the tooltip.
 *
 * Wrap this in a {@link HelpTextTarget} in order to reveal the help text icon when the target is
 * hovered over.
 */
export const HelpText = React.memo(function HelpText({ children, align }: HelpTextIconProps) {
  return (
    <Tooltip2Wrapper
      className={classNames(['help-text', { [`help-text--${align}`]: !!align }])}
      content={<p className="help-text--wrap">{children}</p>}
      position="left"
    >
      <Icon icon={IconNames.INFO_SIGN} size={14} />
    </Tooltip2Wrapper>
  );
});

export interface HelpTextWrapperProps {
  /**
   * Children component(s) should include one {@link HelpText} component.
   * It may also include other elements.
   */
  children:
    | (React.ReactNode & (string | JSX.Element | null))
    | (React.ReactNode & (string | JSX.Element | null))[];

  /**
   * ClassName passed to the wrapper element
   */
  className?: string;

  /** Controls whether the wrapper is rendered in a div, span, or label HTML element */
  tagName?: 'span' | 'div' | 'label';

  /** A background color to be used behind the icon */
  backgroundColor?: string;

  /**
   * Props that will be passed to the tag. For example, this can be used to pass
   *  a `htmlFor` prop to a label
   */
  tagProps?:
    | React.HTMLProps<HTMLDivElement>
    | React.HTMLProps<HTMLLabelElement>
    | React.HTMLProps<HTMLSpanElement>;
}

/**
 * Wrapper for the {@link HelpText} component, which creates a hover target that reveals the help icon
 * when the wrapper is hovered over
 */
export const HelpTextTarget = React.memo(function HelpTextTarget(props: HelpTextWrapperProps) {
  const { backgroundColor, children, className, tagName = 'div', tagProps } = props;
  const wrappedTarget = React.createElement(
    tagName,
    {
      ...tagProps,
      className: classNames([`help-text__hover-container`, className, tagProps?.className]),
      style: {
        '--help-text-background': backgroundColor,
        ...tagProps?.style
      } as React.CSSProperties // So we can add custom property. React just passes it through
    },
    children
  );
  return wrappedTarget;
});
