import { signalDetectionsData } from '@gms/common-model/__tests__/__data__/signal-detections/signal-detection-data';

import {
  determineActionTargetsFromRightClick,
  determineActionTargetsFromRightClickAndSetActionTargets
} from '../../src/ts/common-util';

describe('action target utils', () => {
  test('function exist', () => {
    expect(determineActionTargetsFromRightClick).toBeDefined();
    expect(determineActionTargetsFromRightClickAndSetActionTargets).toBeDefined();
  });

  test('calls determineActionTargetsFromRightClick with a right-clicked sd within a selection', () => {
    const result = determineActionTargetsFromRightClick(
      [signalDetectionsData[0].id, signalDetectionsData[1].id],
      signalDetectionsData[0].id
    );
    expect(result).toEqual({
      isRightClickInSelected: true,
      actionTargets: [signalDetectionsData[0].id, signalDetectionsData[1].id]
    });
  });

  test('calls determineActionTargetsFromRightClick with a right-clicked sd outside of a selection', () => {
    const result = determineActionTargetsFromRightClick(
      [signalDetectionsData[1].id],
      signalDetectionsData[0].id
    );
    expect(result).toEqual({
      isRightClickInSelected: false,
      actionTargets: [signalDetectionsData[0].id]
    });
  });

  test('calls determineActionTargetsFromRightClickAndSetActionTargets with a right-clicked sd within a selection', () => {
    const updateActionTargets = jest.fn();

    const result = determineActionTargetsFromRightClickAndSetActionTargets(
      [signalDetectionsData[0].id, signalDetectionsData[1].id],
      signalDetectionsData[0].id,
      updateActionTargets
    );

    expect(updateActionTargets).toHaveBeenCalledWith([
      signalDetectionsData[0].id,
      signalDetectionsData[1].id
    ]);

    expect(result).toEqual({
      isRightClickInSelected: true,
      actionTargets: [signalDetectionsData[0].id, signalDetectionsData[1].id]
    });
  });

  test('calls determineActionTargetsFromRightClickAndSetActionTargets with a right-clicked sd outside of a selection', () => {
    const updateActionTargets = jest.fn();

    const result = determineActionTargetsFromRightClickAndSetActionTargets(
      [signalDetectionsData[1].id],
      signalDetectionsData[0].id,
      updateActionTargets
    );

    expect(updateActionTargets).toHaveBeenCalledWith([signalDetectionsData[0].id]);

    expect(result).toEqual({
      isRightClickInSelected: false,
      actionTargets: [signalDetectionsData[0].id]
    });
  });
});
