import type { HistoryAction } from '@gms/ui-state';

export interface HistoryMeta {
  readonly type: HistoryAction;
  readonly isApplied: boolean;
  readonly isIncluded: boolean;
  readonly isAssociated: boolean;
  readonly isAssociatedToOther: boolean;
  readonly isUnAssociated: boolean;
  readonly isRelatedToEvent: boolean;
  readonly isCompleted: boolean;
  readonly isConflictCreated: boolean;
  readonly isConflictResolved: boolean;
  readonly isDeletion: boolean;
  readonly isRejection: boolean;
}

export interface HistoryChange extends HistoryMeta {
  readonly id: string;
  readonly historyId: string;
  readonly label: string;
  readonly description: string;
}

export interface History extends HistoryMeta {
  readonly id: string;
  readonly historyId: string;
  readonly label: string;
  readonly description: string;
  readonly changes: HistoryChange[];
}

export interface HistoryPointer {
  readonly index: number;
}
