import { HotkeysProvider } from '@blueprintjs/core';
import type { IanDisplays } from '@gms/common-model/lib/displays/types';
import type GoldenLayout from '@gms/golden-layout';
import { getDataAttributesFromProps, useElementSize } from '@gms/ui-util';
import * as React from 'react';

import { TabContextMenu } from '~analyst-ui/common/menus/tab-context-menu';

import type { BaseDisplayContextData } from './base-display-context';
import { BaseDisplayContext } from './base-display-context';

/**
 * Props for the base display that goes as a direct child
 * of the golden layout display.
 * Base Display accepts data-* props, as well, which it will
 * apply to the div that it creates.
 *
 * For example
 * <BaseDisplay>
 */
export interface BaseDisplayProps {
  glContainer: GoldenLayout.Container | undefined;
  tabName?: IanDisplays;
  className?: string;
  displayRef?: React.MutableRefObject<HTMLDivElement>;
  onContextMenu?(e: React.MouseEvent<HTMLElement, MouseEvent>): void;
}

/**
 * A base display that should be at the base of all display components.
 * Adds consistent padding to each display, and exposes the width and height
 * of the display in the BaseDisplayContext.
 *
 * @param props requires a reference to the glContainer.
 * Also accepts data attributes in the form 'data-cy': 'example-component'
 */
export function BaseDisplay(props: React.PropsWithChildren<BaseDisplayProps>) {
  /**
   * Base display size behavior
   */
  const [displayRef, heightPx, widthPx] = useElementSize();

  /**
   * the context menu handler, if provided
   */
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { onContextMenu, tabName, glContainer, className, children } = props;
  /**
   * Get any data attributes provided to this display (like data-cy attributes)
   */
  const dataAttributes = getDataAttributesFromProps(props);

  const baseDisplayContextData: BaseDisplayContextData = React.useMemo(
    () => ({
      glContainer,
      widthPx: glContainer?.width ?? widthPx ?? 0,
      heightPx: glContainer?.height ?? heightPx ?? 0
    }),
    [heightPx, glContainer, widthPx]
  );

  return (
    <HotkeysProvider>
      <div
        className={`base-display ${className ?? ''}`}
        ref={ref => {
          displayRef.current = ref;
        }}
        tabIndex={-1}
        onContextMenu={
          onContextMenu ||
          (event => {
            event.preventDefault();
          })
        }
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...dataAttributes}
      >
        <BaseDisplayContext.Provider value={baseDisplayContextData}>
          {tabName ? <TabContextMenu tabName={tabName} /> : null}
          {children}
        </BaseDisplayContext.Provider>
      </div>
    </HotkeysProvider>
  );
}
