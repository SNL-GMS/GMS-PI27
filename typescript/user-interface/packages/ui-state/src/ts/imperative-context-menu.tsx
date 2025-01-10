import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { showImperativeContextMenu } from '@gms/ui-core-components';
import React from 'react';
import { Provider } from 'react-redux';

import { getStore } from './app/store';

/**
 * Show imperative context menu.
 *
 * Wraps the content with a Redux {@link Provider} and injects the Reject store
 * so that the store is available within the context of the context menu.
 *
 * @see {@link showImperativeContextMenu}
 */
export function showImperativeReduxContextMenu(props: ImperativeContextMenuProps) {
  const { content } = props;
  const propsWithRedux: ImperativeContextMenuProps = {
    ...props,
    content: <Provider store={getStore()}>{content}</Provider>
  };
  showImperativeContextMenu(propsWithRedux);
}
