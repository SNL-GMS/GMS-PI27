/**
 * Sets focus to location
 */
export function setFocusToLocation(): void {
  const locationPanel = document.getElementsByClassName('location-wrapper');
  const locationPanelElement = locationPanel[0] as HTMLElement;
  locationPanelElement?.focus();
}

/**
 * Returns location panel element
 */
export function getLocationPanelElement(): HTMLElement {
  return document.getElementsByClassName('location-wrapper')[0] as HTMLElement;
}
