import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

window.onload = () => {
  const container = document.getElementById('app');

  if (container == null) {
    throw new Error(`Failed to get element by id, app`);
  }

  const root = createRoot(container);
  root.render(<App />);
};
