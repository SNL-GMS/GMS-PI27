import { FkQueryStatus } from '@gms/ui-state';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { FkThumbnailContent } from '~analyst-ui/components/azimuth-slowness/components/fk-thumbnail/fk-thumbnail-content';
import { FkThumbnailSize } from '~analyst-ui/components/azimuth-slowness/components/fk-thumbnail-list/fk-thumbnails-controls';

const mockOnClick = jest.fn();
const mockOnDoubleClick = jest.fn();

describe('FkThumbnailContent', () => {
  it('Returns a canvas element', () => {
    const { container } = render(
      <FkThumbnailContent
        fkQueryStatus={FkQueryStatus.SUCCESS}
        sizePx={FkThumbnailSize.MEDIUM}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
      />
    );

    const maybeCanvasElement = screen.getByTestId('fk-thumbnail');

    expect(maybeCanvasElement).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('Returns a loading spinner', () => {
    const { container } = render(
      <FkThumbnailContent
        fkQueryStatus={FkQueryStatus.PENDING_QUERY}
        sizePx={FkThumbnailSize.LARGE}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
      />
    );

    let error = false;
    try {
      // This should fail to find the canvas because it didn't render
      screen.getByTestId('fk-thumbnail');
    } catch {
      error = true;
    }

    expect(error).toBe(true);
    expect(container).toMatchSnapshot();
  });

  it('Returns an invalid phase/stationType state', () => {
    const { container } = render(
      <FkThumbnailContent
        fkQueryStatus={FkQueryStatus.INVALID_PHASE}
        sizePx={FkThumbnailSize.LARGE}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
      />
    );

    let error = false;
    try {
      // This should fail to find the canvas because it didn't render
      screen.getByTestId('fk-thumbnail');
    } catch {
      error = true;
    }

    expect(error).toBe(true);
    expect(container).toMatchSnapshot();
  });

  it('Returns a network error/no template state', () => {
    const { container } = render(
      <FkThumbnailContent
        fkQueryStatus={FkQueryStatus.NO_TEMPLATE}
        sizePx={FkThumbnailSize.LARGE}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
      />
    );

    let error = false;
    try {
      // This should fail to find the canvas because it didn't render
      screen.getByTestId('fk-thumbnail');
    } catch {
      error = true;
    }

    expect(error).toBe(true);
    expect(container).toMatchSnapshot();
  });
});
