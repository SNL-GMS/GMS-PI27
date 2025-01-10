import { Button, Collapse, H5 } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import React from 'react';

import { HelpText, HelpTextTarget } from '../../help-text';
import type { FormGroupProps } from '../types';

/**
 * Creates a label, form element, and optional helper text
 */
export function FormGroup({
  fill,
  label,
  children,
  helperText,
  labelFor,
  labelInfo,
  nestedContent,
  accordionIsExpanded,
  accordionCanCollapse = true
}: FormGroupProps) {
  const [isOpen, setIsOpen] = React.useState(accordionIsExpanded);
  const labelElement = (
    <span>
      {label} {labelInfo && <span className="gms-form-group__label-info">{labelInfo}</span>}
    </span>
  );
  return (
    <>
      {label ? (
        <HelpTextTarget
          backgroundColor="color-mix(in srgb, var(--gms-main) 5%, var(--gms-dialog-background))"
          className="gms-group__label form-label"
          tagName="label"
          tagProps={{ htmlFor: labelFor }}
        >
          {helperText ? (
            <>
              <HelpText>
                <div className="gms-form-group__helper-text">
                  <H5>{labelElement}</H5>
                  {helperText}
                </div>
              </HelpText>
              {labelElement}
            </>
          ) : (
            labelElement
          )}
          {nestedContent && accordionCanCollapse ? (
            <Button
              onClick={() => setIsOpen(val => !val)}
              minimal
              small
              icon={isOpen ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
            />
          ) : null}
        </HelpTextTarget>
      ) : null}
      <div
        className={classNames([
          'gms-form-group__content',
          'form-value',
          { 'gms-form-group__content--fill': !label || fill }
        ])}
      >
        {children}
      </div>
      {nestedContent ? (
        <Collapse
          isOpen={isOpen}
          className={classNames('gms-form-group__content--accordion', {
            'gms-form-group__content--hidden': !isOpen
          })}
        >
          {nestedContent}
        </Collapse>
      ) : null}
    </>
  );
}
