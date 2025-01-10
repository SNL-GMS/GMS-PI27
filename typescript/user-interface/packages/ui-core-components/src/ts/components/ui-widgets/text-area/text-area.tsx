/* eslint-disable react/destructuring-assignment */
import React from 'react';

import type { TextAreaState } from '../widgets/types';
import type { TextAreaProps } from './types';

export class TextArea extends React.Component<TextAreaProps, TextAreaState> {
  private constructor(props) {
    super(props);
    this.state = {
      // optional can be undefined
      charsLeft: this.props.maxChar
        ? this.props.maxChar - this.props.defaultValue.length
        : undefined,
      // optional can be undefined
      maxChar: this.props.maxChar,
      value: this.props.defaultValue
    };
  }

  /**
   * React component lifecycle.
   */
  public render(): JSX.Element {
    // Only used if `fillWidth` is true
    const style: React.CSSProperties = {
      width: '100%'
    };
    return (
      <div>
        <textarea
          className="form__text-input"
          style={this.props.fillWidth ? style : undefined}
          rows={4}
          title={this.props.title}
          data-cy={this.props['data-cy'] ? `${this.props['data-cy']}-textarea` : 'textarea'}
          // Stop propagation to prevent waveform hotkeys from firing
          onKeyDown={e => e.stopPropagation()}
          onChange={e => {
            e.persist();
            const length = e.target.value?.length || 0;
            // handle case where we dont want to do character count
            this.setState(prevState => ({
              value: e.target.value,
              charsLeft: prevState.maxChar ? prevState.maxChar - length : undefined
            }));
            this.props.onMaybeValue(e.target.value);
          }}
          maxLength={this.state.maxChar}
          value={this.state.value}
          disabled={this.props.disabled}
        />
        {this.state.maxChar && (
          <p className="form__character-count">Characters remaining: {this.state.charsLeft}</p>
        )}
      </div>
    );
  }
}
