/* eslint-disable react/destructuring-assignment */
/*
FormLabel renders the formitem's label
*/
import React from 'react';

/**
 * FormLabel Props
 */
export interface FormLabelProps {
  text: string;
  fontSizeEm: number;
  hideColon?: boolean;
  modified: boolean;
  widthEm: number;
}

/**
 * FormLabel component.
 */
export class FormLabel extends React.PureComponent<FormLabelProps> {
  /**
   * React component lifecycle.
   */
  public render(): JSX.Element {
    /*
     */
    const hiddenColonText = this.props.hideColon ? this.props.text : `${this.props.text}:`;
    const propText = this.props.modified ? `${this.props.text}*` : hiddenColonText;

    return <div className="form-label">{propText}</div>;
  }
}
