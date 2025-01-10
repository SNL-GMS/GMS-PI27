import '@testing-library/jest-dom';

import { Classes } from '@blueprintjs/core';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import {
  useBaseDisplaySize,
  useGoldenLayoutContainer
} from '../../../../../src/ts/components/common-ui/components/base-display/base-display-hooks';

function TestBaseDisplayConsumerSize() {
  const [widthPx, heightPx] = useBaseDisplaySize();

  return (
    <div>
      <div>widthPx: {widthPx}</div>
      <div>heightPx: {heightPx}</div>
    </div>
  );
}

function TestBaseDisplayConsumerGlContainer() {
  const glContainer = useGoldenLayoutContainer();

  return (
    <div>
      <div>glContainer.title: {glContainer.title}</div>
    </div>
  );
}

describe('System Messages Display', () => {
  it('should be defined', () => {
    expect(BaseDisplay).toBeDefined();
  });

  it('renders children', () => {
    render(
      <BaseDisplay
        glContainer={
          {
            onContextMenu: jest.fn(),
            on: jest.fn()
          } as any
        }
      >
        <div>child element</div>
      </BaseDisplay>
    );

    expect(screen.getByText('child element')).toBeInTheDocument();
  });

  it('passes height and width to child BaseDisplayContext consumers', () => {
    render(
      <BaseDisplay
        glContainer={
          {
            onContextMenu: jest.fn(),
            height: 100,
            width: 200,
            on: jest.fn()
          } as any
        }
      >
        <TestBaseDisplayConsumerSize />
      </BaseDisplay>
    );

    expect(screen.getByText('heightPx: 100')).toBeInTheDocument();
    expect(screen.getByText('widthPx: 200')).toBeInTheDocument();
  });

  it('passes glContainer to child BaseDisplayContext consumers', () => {
    render(
      <BaseDisplay
        glContainer={
          {
            onContextMenu: jest.fn(),
            title: 'Test Title',
            on: jest.fn()
          } as any
        }
      >
        <TestBaseDisplayConsumerGlContainer />
      </BaseDisplay>
    );
    expect(screen.getByText('glContainer.title: Test Title')).toBeInTheDocument();
  });

  it('will apply classNames to the base container', () => {
    const { container } = render(
      <BaseDisplay
        className="test-class-name"
        glContainer={
          {
            onContextMenu: jest.fn(),
            on: jest.fn()
          } as any
        }
      />
    );

    expect(container.getElementsByClassName('test-class-name')).toHaveLength(1);
  });

  it('will not add a TabContextMenu to the view if tabName is not defined', () => {
    const { container } = render(
      <BaseDisplay
        glContainer={
          {
            onContextMenu: jest.fn(),
            on: jest.fn()
          } as any
        }
      />
    );

    expect(container.getElementsByClassName(`${Classes.CONTEXT_MENU}2`)).toHaveLength(0);
  });

  it('will apply data attributes to the base container', () => {
    render(
      <BaseDisplay
        data-testid="passes-data-attributes"
        glContainer={
          {
            onContextMenu: jest.fn(),
            on: jest.fn()
          } as any
        }
      />
    );

    expect(screen.getByTestId('passes-data-attributes')).toBeInTheDocument();
  });
});
