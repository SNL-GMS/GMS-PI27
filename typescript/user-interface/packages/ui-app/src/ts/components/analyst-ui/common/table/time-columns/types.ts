import type { Row } from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';

export interface TimeRow extends Row {
  time: ArrivalTime;
}
