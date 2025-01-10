import { eventData, workflowDefinitionId } from '@gms/common-model/__tests__/__data__';

import {
  getWorkingEventHypothesis,
  hasWorkingEventHypothesis
} from '../../../../../src/ts/app/api/data/event/get-working-event-hypothesis';

describe('get working event hypothesis', () => {
  it('exists', () => {
    expect(hasWorkingEventHypothesis).toBeDefined();
    expect(getWorkingEventHypothesis).toBeDefined();
  });

  it('has working event hypothesis', () => {
    expect(hasWorkingEventHypothesis(eventData)).toBeFalsy();
    expect(hasWorkingEventHypothesis({ ...eventData, _uiHasUnsavedChanges: 1 })).toBeTruthy();
  });

  it('get working event hypothesis', () => {
    expect(() => {
      getWorkingEventHypothesis(workflowDefinitionId.name, eventData);
    }).toThrow();

    expect(() => {
      getWorkingEventHypothesis(workflowDefinitionId.name, {
        ...eventData,
        _uiHasUnsavedChanges: 1
      });
    }).not.toThrow();

    expect(
      getWorkingEventHypothesis(workflowDefinitionId.name, {
        ...eventData,
        _uiHasUnsavedChanges: 1
      })
    ).toEqual(eventData.eventHypotheses[0]);
  });
});
