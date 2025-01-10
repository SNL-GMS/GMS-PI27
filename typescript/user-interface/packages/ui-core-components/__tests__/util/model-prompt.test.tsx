import { render } from '@testing-library/react';
import * as React from 'react';
import * as util from 'util';

import { ModalPrompt } from '../../src/ts/components';
import type { PromptProps } from '../../src/ts/components/dialog/types';

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

const props: PromptProps = {
  title: 'Example Title',
  actionText: 'Accept',
  actionTooltipText: 'Accept the prompt',
  cancelText: 'Reject',
  cancelTooltipText: 'Reject the prompt',
  isOpen: true,
  actionCallback: jest.fn(),
  cancelButtonCallback: jest.fn(),
  onCloseCallback: jest.fn()
};

describe('modal prompt tests', () => {
  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<ModalPrompt {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('renders children', () => {
    const { container } = render(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <ModalPrompt {...props}>
        <div>Sample Children</div>
      </ModalPrompt>
    );
    expect(container).toMatchSnapshot();
  });
});
