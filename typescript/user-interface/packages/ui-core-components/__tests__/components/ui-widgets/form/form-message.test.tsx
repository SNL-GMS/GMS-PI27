import { Intent } from '@blueprintjs/core';
import { render } from '@testing-library/react';
import React from 'react';

import { FormMessage } from '../../../../src/ts/components';

describe('Form message', () => {
  it('can render with no details and intent', () => {
    const { container } = render(<FormMessage message={{ summary: 'my summary' }} />);
    expect(container).toMatchSnapshot();
  });

  it('can render with no intent', () => {
    const { container } = render(
      <FormMessage message={{ summary: 'my summary', details: 'my details' }} />
    );
    expect(container).toMatchSnapshot();
  });

  it('can render with with different intents', () => {
    let rendered = render(
      <FormMessage
        message={{ summary: 'my summary', details: 'my details', intent: Intent.NONE }}
      />
    );
    expect(rendered.container).toMatchSnapshot();

    rendered = render(
      <FormMessage
        message={{ summary: 'my summary', details: 'my details', intent: Intent.PRIMARY }}
      />
    );
    expect(rendered.container).toMatchSnapshot();

    rendered = render(
      <FormMessage
        message={{ summary: 'my summary', details: 'my details', intent: Intent.SUCCESS }}
      />
    );
    expect(rendered.container).toMatchSnapshot();

    rendered = render(
      <FormMessage
        message={{ summary: 'my summary', details: 'my details', intent: Intent.WARNING }}
      />
    );
    expect(rendered.container).toMatchSnapshot();

    rendered = render(
      <FormMessage
        message={{ summary: 'my summary', details: 'my details', intent: Intent.DANGER }}
      />
    );
    expect(rendered.container).toMatchSnapshot();
  });
});
