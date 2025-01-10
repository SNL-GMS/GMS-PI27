import classNames from 'classnames';
import React from 'react';

/**
 * The type of the props for the {@link FormContent} component
 */
export interface FormContentProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Simple wrapper around the content of a form
 */
export function FormContent({ children, className }: FormContentProps) {
  return <div className={classNames(className, 'form-content')}>{children}</div>;
}
