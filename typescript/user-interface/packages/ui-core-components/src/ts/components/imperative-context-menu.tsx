import type { ContextMenuPopoverProps } from '@blueprintjs/core';
import { Classes, ContextMenuPopover, hideContextMenu } from '@blueprintjs/core';
import { uuid4 } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import defer from 'lodash/defer';
import React from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

const logger = UILogger.create(
  'GMS_IMPERATIVE_CONTEXT_MENU',
  process.env.GMS_IMPERATIVE_CONTEXT_MENU
);

// the imperative context menu container; a singleton instance
let imperativeContainer: ImperativeContainer | undefined;

/** manages the deferred hide/close operations */
let deferHide: { func: () => void; timerId: number | undefined } | undefined;

/**
 * The properties of an imperative context menu.
 */
interface ImperativeContainer {
  /**
   * The unique id of the context menu used to determine changes; e.g. opening one context menu from another
   */
  readonly id: string;

  /**
   * The container for the context menu
   */
  readonly rootContainer: Root;

  /**
   * The internal {@link HTMLElement} container for the context menu
   */
  readonly container: HTMLElement;

  /**
   * The active element with focus prior to opening up the context menu
   */
  readonly activeElement: HTMLElement;

  /**
   * A reference to the onClose method that was passed to the imperative context
   */
  readonly onClose?: () => void;
}

/**
 * Imperative Context Menu Props
 */
export type ImperativeContextMenuProps = Omit<ContextMenuPopoverProps, 'isOpen'> & {
  /**
   * (optional) if set the element will receive focus on close
   */
  readonly activeElementOnClose?: HTMLElement;
};

/**
 * Hide Imperative Context Options
 */
export interface HideImperativeContextMenuOptions {
  /**
   * (optional) if set to true; then the context menu onClose callback will be invoked
   * ! default is set to true
   */
  readonly shouldInvokeOnClose?: boolean;

  /**
   * (optional) if set to true; then the context menu will return focus on close
   *
   * @default true
   */
  readonly shouldReturnFocus?: boolean;

  /**
   * (optional) an optional callback to be called after the imperative context menu has been closed
   * ? This callback will execute after the context menu onClose (if enabled) and the refocus of the active element (if enabled)
   *
   * @default undefined
   */
  readonly callback?: () => void;
}

/** helper to gather the props needed for hiding the imperative context menu */
function getHideImperativeContextMenuProps(options: HideImperativeContextMenuOptions = {}) {
  return {
    shouldInvokeOnClose: options.shouldInvokeOnClose ?? true,
    shouldReturnFocus: options.shouldReturnFocus ?? true,
    callback: options.callback || undefined,
    activeElement: imperativeContainer?.activeElement,
    onClose: imperativeContainer?.onClose
  };
}

/** unmount the imperative context menu  */
function unmountImperativeContextMenu() {
  if (imperativeContainer !== undefined) {
    imperativeContainer.container.remove();
    imperativeContainer.rootContainer.unmount();
    imperativeContainer = undefined;
  }
}

/** remove the context menu content from the dom */
function removeContextMenuFromDom() {
  const elements = [
    ...document.getElementsByClassName(`${Classes.POPOVER_CONTENT}`),
    ...document.getElementsByClassName(`${Classes.POPOVER_BACKDROP}`),
    ...document.getElementsByClassName(`${Classes.TOOLTIP}`),
    ...document.getElementsByClassName(`${Classes.POPOVER_TRANSITION_CONTAINER}`)
  ];

  elements.forEach((e, idx) => {
    elements[idx].innerHTML = '';
  });
}

/**
 * Hide imperative context menu that was created using {@link showImperativeContextMenu}.
 *
 * @see https://blueprintjs.com/docs/#core/components/context-menu-popover.imperative-api
 */
export function hideImperativeContextMenu(options: HideImperativeContextMenuOptions = {}) {
  // if multiple hide operations are called immediately; bypass the defer and execute the previous call first
  if (deferHide !== undefined) {
    logger.debug('forcing execution of previous deferred hide');
    clearTimeout(deferHide.timerId);
    deferHide.func();
  }

  logger.debug('hide invoked');

  const { shouldInvokeOnClose, shouldReturnFocus, callback, activeElement, onClose } =
    getHideImperativeContextMenuProps(options);

  deferHide = {
    timerId: undefined,
    func: () => {
      if (shouldInvokeOnClose && onClose) {
        onClose();
      }
      if (callback) {
        callback();
      }

      if (shouldReturnFocus && activeElement) {
        activeElement.focus();
      }

      deferHide = undefined;
    }
  };

  // unmount the imperative context menu
  unmountImperativeContextMenu();

  hideContextMenu();

  // remove the context menu content from the dom
  removeContextMenuFromDom();

  deferHide.timerId = defer(deferHide.func);
}

/**
 * A simple wrapper around {@link ContextMenu2Popover} which is open by default and controlled.
 * The context menu closes when a user clicks outside the popover.
 */
function UncontrolledContextMenuPopover(props: ImperativeContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const idRef = React.useRef(imperativeContainer?.id);

  const handleClose = React.useCallback(() => {
    logger.debug('on close invoked');
    setIsOpen(false);

    if (imperativeContainer?.id !== idRef.current) {
      logger.debug('no need to handle on close');
    } else {
      logger.debug('handle on close');
      hideImperativeContextMenu();
    }
  }, []);

  //! useEffect updates local state
  React.useEffect(() => {
    return () => {
      setIsOpen(false);
    };
  }, []);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <ContextMenuPopover key={uuid4()} isOpen={isOpen} {...props} onClose={handleClose} />;
}

/**
 * Show Imperative Context Options
 */
export interface ShowImperativeContextMenuOptions {
  /**
   * (optional) if set to true; then the context menu onClose callback will be invoked
   * ! default is set to false
   */
  readonly shouldInvokeOnClose?: boolean;

  /**
   * (optional) if set to true; then the context menu will return focus on close
   * ! default is set to true
   */
  readonly shouldReturnFocus?: boolean;
}

/**
 * Show imperative context menu.
 *
 * Shows a context menu at a particular offset from the top-left corner of the document.
 * The menu will appear below-right of this point and will flip to below-left if there is not enough
 * room onscreen. Additional props like `onClose`, `isDarkTheme`, etc. can be forwarded to the {@link ContextMenu2Popover}.
 *
 * Context menus created with this API will automatically close when a user clicks outside the popover.
 * You may force them to close by using {@link hideImperativeContextMenu}.
 *
 * @see https://blueprintjs.com/docs/#core/components/context-menu-popover.imperative-api
 */
export function showImperativeContextMenu(
  props: ImperativeContextMenuProps,
  options: Omit<HideImperativeContextMenuOptions, 'callback'> = {}
) {
  logger.debug('show invoked');

  const shouldInvokeOnClose = options.shouldInvokeOnClose ?? false;
  const shouldReturnFocus = options.shouldReturnFocus ?? true;
  const previousActiveElement: HTMLElement | undefined = imperativeContainer?.activeElement;

  hideImperativeContextMenu({
    shouldInvokeOnClose,
    shouldReturnFocus,
    callback: () => {
      // show the new context menu after ensuring that the previous one has been closed and cleaned up
      const { onClose } = props;

      const id: string = uuid4();

      const container: HTMLElement = document.createElement(`imperative-context-menu`);
      container.id = id;
      container.classList.add(Classes.CONTEXT_MENU);
      document.body.appendChild(container);

      const rootContainer: Root = createRoot(container, {
        identifierPrefix: 'imperative-context-menu'
      });

      const activeElement: HTMLElement =
        props.activeElementOnClose ||
        previousActiveElement ||
        (document.activeElement as HTMLElement);

      imperativeContainer = {
        id,
        rootContainer,
        container,
        activeElement,
        onClose
      };

      imperativeContainer.rootContainer.render(
        // eslint-disable-next-line react/jsx-props-no-spreading
        <UncontrolledContextMenuPopover key={id} {...props} />
      );

      /**
       * The {@link ContextMenu2Popover} has a boarder that if clicked can allow the default system context menu to popup.
       *
       * !Once the {@link ContextMenu2Popover} is rendered (defer) add an event listener to capture and prevent the default system context menu from showing.
       */
      defer(() => {
        const elements = [
          ...document.getElementsByClassName(`${Classes.CONTEXT_MENU_VIRTUAL_TARGET}`),
          ...document.getElementsByClassName(`${Classes.CONTEXT_MENU_BACKDROP}`),
          ...document.getElementsByClassName(`${Classes.CONTEXT_MENU}`)
        ];
        elements.forEach(element => {
          element.addEventListener('contextmenu', (event: Event) => {
            event.preventDefault();
          });
        });
      });
    }
  });
}
