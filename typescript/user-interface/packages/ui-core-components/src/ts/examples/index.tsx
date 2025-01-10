import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

window.onload = () => {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error(`Unable to get element by id for app`);
  }

  const root = createRoot(container);
  root.render(<App />);
};
