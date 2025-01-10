import { WorkflowTypes } from '@gms/common-model';

const iaStage: WorkflowTypes.InteractiveAnalysisStage = {
  name: 'name',
  mode: WorkflowTypes.StageMode.INTERACTIVE,
  duration: 50,
  activities: [
    {
      name: 'name',
      analysisMode: WorkflowTypes.AnalysisMode.EVENT_REVIEW,
      stationGroup: {
        name: 'ALL_1',
        effectiveAt: 1000,
        description: 'Hi'
      }
    }
  ]
};

const autoStage: WorkflowTypes.AutomaticProcessingStage = {
  name: 'name',
  mode: WorkflowTypes.StageMode.AUTOMATIC,
  duration: 5000,
  sequences: [
    {
      name: 'name',
      steps: []
    }
  ]
};

export const workflow: WorkflowTypes.Workflow = {
  name: 'workflow',
  stages: [iaStage, autoStage]
};

/**
 * Mock data that matches what might be returned by the stageIntervalsByIdAndTime query.
 * Note that the type returned by that query is not the superset of all possible types that
 * will get returned in reality, and so we use the specific type that is what matches the
 * actual return value, rather than the defined return type from that query.
 */
export const stageIntervals: {
  name: string;
  value: WorkflowTypes.InteractiveAnalysisStageInterval[];
}[] = [
  {
    name: 'AL1',
    value: [
      {
        stageMode: WorkflowTypes.StageMode.INTERACTIVE,
        activityIntervals: [
          {
            activeAnalysts: ['TestUser'],
            stageName: 'AL1',
            comment: '',
            processingStartTime: 1669158900,
            status: WorkflowTypes.IntervalStatus.IN_PROGRESS,
            intervalId: {
              startTime: 1669150800,
              definitionId: {
                name: 'AL1 Event Review'
              }
            },
            modificationTime: 1669152441.906,
            endTime: 1669154400,
            processingEndTime: 1669151100,
            percentAvailable: 1,
            storageTime: 1669152441.906
          },
          {
            activeAnalysts: ['TestUser2'],
            stageName: 'AL1',
            comment: '',
            processingStartTime: 1669158900,
            status: WorkflowTypes.IntervalStatus.IN_PROGRESS,
            intervalId: {
              startTime: 1669150800,
              definitionId: {
                name: 'AL1 Scan'
              }
            },
            modificationTime: 1669152441.906,
            endTime: 1669154400,
            processingEndTime: 1669151100,
            percentAvailable: 1,
            storageTime: 1669152441.906
          }
        ],
        comment: '',
        processingStartTime: 1669158900,
        status: WorkflowTypes.IntervalStatus.IN_PROGRESS,
        intervalId: {
          startTime: 1669150800,
          definitionId: {
            name: 'AL1'
          }
        },
        modificationTime: 1669152441.906,
        endTime: 1669154400,
        processingEndTime: 1669151100,
        percentAvailable: 1,
        storageTime: 1669152441.906
      },
      {
        stageMode: WorkflowTypes.StageMode.INTERACTIVE,
        activityIntervals: [
          {
            activeAnalysts: ['TestUser'],
            stageName: 'AL1',
            comment: '',
            processingStartTime: 1669089900,
            status: WorkflowTypes.IntervalStatus.COMPLETE,
            intervalId: {
              startTime: 1669089600,
              definitionId: {
                name: 'AL1 Event Review'
              }
            },
            modificationTime: 1669089900,
            endTime: 1669093200,
            processingEndTime: 1669089900,
            percentAvailable: 1,
            storageTime: 1669089900
          },
          {
            activeAnalysts: [],
            stageName: 'AL1',
            comment: '',
            processingStartTime: 1669089900,
            status: WorkflowTypes.IntervalStatus.COMPLETE,
            intervalId: {
              startTime: 1669089600,
              definitionId: {
                name: 'AL1 Scan'
              }
            },
            modificationTime: 1669089900,
            endTime: 1669093200,
            processingEndTime: 1669089900,
            percentAvailable: 1,
            storageTime: 1669089900
          }
        ],
        comment: '',
        processingStartTime: 1669089900,
        status: WorkflowTypes.IntervalStatus.COMPLETE,
        intervalId: {
          startTime: 1669089600,
          definitionId: {
            name: 'AL1'
          }
        },
        modificationTime: 1669089900,
        endTime: 1669093200,
        processingEndTime: 1669089900,
        percentAvailable: 1,
        storageTime: 1669089900
      }
    ]
  }
];
