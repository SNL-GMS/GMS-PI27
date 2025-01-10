import isEqual from 'lodash/isEqual';

/**
 * Gets tabbable elements
 *
 * @param parentContainerClassName classname of parent
 * @param tabbableClassName classname of tabbable elements
 * @returns html elements
 */
export const getTabbableElementsByClassname = (
  parentContainerClassName: string,
  tabbableClassName: string
): HTMLElement[] => {
  const tabbableElements: HTMLElement[] = [];
  const parentContainers: Element[] = Array.from(
    document.getElementsByClassName(parentContainerClassName)
  );
  parentContainers.forEach(parentContainer => {
    const elements: Element[] = Array.from(
      parentContainer.getElementsByClassName(tabbableClassName)
    );
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        tabbableElements.push(element);
      }
    });
  });
  return tabbableElements;
};

/**
 * Sets focus to first tabbable element
 *
 * @param className of elements that are tabbable
 */
export const focusToFirstTabbableElementByClassname = (
  parentContainerClassName: string,
  tabbableClassName: string
): void => {
  const tabbableElements = getTabbableElementsByClassname(
    parentContainerClassName,
    tabbableClassName
  );
  tabbableElements[0]?.focus();
};

/**
 * Determines if key is tabbable
 *
 * @param event keyboard event
 * @returns a boolean if key is tabbable
 */
export const isTabbableKey = (event: React.KeyboardEvent<HTMLElement>): boolean =>
  event.key === 'ArrowDown' || event.key === 'Tab' || event.key === 'ArrowUp';

/**
 * Determines if key is previous tab
 *
 * @param event keyboard event
 * @returns a boolean if key is previous tabbable
 */
export const isPreviousTabbableKey = (event: React.KeyboardEvent<HTMLElement>): boolean =>
  event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey);

/**
 * Determines if key is next tab
 *
 * @param event keyboard event
 * @returns a boolean if key is next tabbable
 */
export const isNextTabbableKey = (event: React.KeyboardEvent<HTMLElement>): boolean =>
  event.key === 'ArrowDown' || event.key === 'Tab';

/**
 * Looks through tabbable elements and handles tab key and arrow keys to move focus
 *
 * @param event keyboard event
 * @param parentContainerClassName classname of parent
 * @param tabbableClassName of elements that are tabbable
 */
export const handleTabOrArrows = (
  event: React.KeyboardEvent<HTMLElement>,
  parentContainerClassName: string,
  tabbableClassName: string
): void => {
  if (!isTabbableKey(event)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const tabbableElements = getTabbableElementsByClassname(
    parentContainerClassName,
    tabbableClassName
  );
  const { activeElement } = document;
  let nextTabIndex = -1;

  if (activeElement != null) {
    tabbableElements.forEach((element, index) => {
      if (isEqual(element, activeElement)) {
        nextTabIndex = index;
      }
    });
  }
  if (isPreviousTabbableKey(event)) {
    nextTabIndex -= 1;
    if (nextTabIndex < 0) {
      nextTabIndex = tabbableElements.length - 1;
    }
  } else {
    nextTabIndex += 1;
    if (nextTabIndex >= tabbableElements.length) {
      nextTabIndex = 0;
    }
  }
  const elementToTab = tabbableElements[nextTabIndex];
  elementToTab.focus();
};
