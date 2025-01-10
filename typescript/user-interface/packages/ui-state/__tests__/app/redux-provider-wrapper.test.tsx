import { H1 } from '@blueprintjs/core';
import { render } from '@testing-library/react';
import React from 'react';

import { withReduxProvider } from '../../src/ts/app/redux-provider';

window.alert = jest.fn();
window.open = jest.fn();

// simple component we can wrap
class Welcome extends React.PureComponent {
  public render() {
    return <H1>Hello</H1>;
  }
}

describe('Redux wrapper', () => {
  const component: any = Welcome;
  const Wrapper = withReduxProvider(component);

  // make sure the function is defined
  test('should exist', () => {
    expect(withReduxProvider).toBeDefined();
  });

  // see what we got from the wrapper (should be a constructor function for a class)
  test('function should create a component class', () => {
    // returns a class function that we can call with the new keyword
    expect(typeof Wrapper).toBe('function');
  });

  // lets render our wrapper and see what we get back
  test('can create a rendered wrapper', () => {
    const container = render(<Wrapper />);
    expect(container).toMatchSnapshot();
  });
});
