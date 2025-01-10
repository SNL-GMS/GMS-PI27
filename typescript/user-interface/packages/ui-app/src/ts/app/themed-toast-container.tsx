import { useUiTheme } from '@gms/ui-state';
import React from 'react';
import { Slide, ToastContainer } from 'react-toastify';

/**
 * Creates a ToastContainer with the default values, and gives it the GMS Theme
 */
export function ThemedToastContainer() {
  const [uiTheme] = useUiTheme();
  return (
    <ToastContainer
      transition={Slide}
      autoClose={4000}
      position="bottom-right"
      theme={uiTheme.isDarkMode ? 'dark' : 'light'}
    />
  );
}
