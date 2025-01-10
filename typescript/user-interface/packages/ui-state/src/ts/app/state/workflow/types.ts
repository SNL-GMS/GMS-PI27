import type { CommonTypes, WorkflowTypes } from '@gms/common-model';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';

export interface WorkflowState {
  timeRange: Nullable<CommonTypes.TimeRange>;
  stationGroup: WorkflowTypes.StationGroup;
  openIntervalName: string; // e.x AL1
  openActivityNames: string[]; // e.x Event Review
  analysisMode: WorkflowTypes.AnalysisMode | null;
}
