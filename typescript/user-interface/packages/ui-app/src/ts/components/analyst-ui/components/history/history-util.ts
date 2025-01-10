/**
 * Sets focus to history display
 */
export function setFocusToHistoryDisplay(): void {
  const historyPanel = document.getElementsByClassName('history-panel');
  const historyPanelElement = historyPanel[0].parentElement;
  historyPanelElement?.focus();
}
