/**
 * Takes selected ids and using the right clicked id determines if action target
 * is only the right clicked or all of the selected and updates action targets
 *
 * @param selectedIds selected ids that can be action targets
 * @param rightClickedId right clicked id used to determine if in selectedIds
 * @returns Object { isRightClickInSelected, actionTargets }
 */
export const determineActionTargetsFromRightClick = (
  selectedIds: string[],
  rightClickedId: string
) => {
  return selectedIds.indexOf(rightClickedId) === -1
    ? { isRightClickInSelected: false, actionTargets: [rightClickedId] }
    : { isRightClickInSelected: true, actionTargets: selectedIds };
};

/**
 * Takes selected ids and using the right clicked id determines if action target
 * is only the right clicked or all of the selected and updates action targets
 *
 * @param selectedIds selected ids that can be action targets
 * @param rightClickedId right clicked id used to determine if in selectedIds
 * @param function to updated action targets in state
 * @returns Object { isRightClickInSelected, actionTargets }
 */
export const determineActionTargetsFromRightClickAndSetActionTargets = (
  selectedIds: string[],
  rightClickedId: string,
  updateActionTargets: (targetIds: string[]) => void
) => {
  const result = determineActionTargetsFromRightClick(selectedIds, rightClickedId);
  updateActionTargets(result.actionTargets);
  return result;
};
