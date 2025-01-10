import { TimePrecision } from '@blueprintjs/datetime2';
import type { Format } from '@gms/common-util';
import {
  TIME_FORMAT,
  TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION,
  TIME_FORMAT_WITH_SECOND_PRECISION
} from '@gms/common-util';

export const convertTimeFormatToTimePrecision = (format: Format): TimePrecision | undefined => {
  if (format.includes(TIME_FORMAT_WITH_FRACTIONAL_SECOND_PRECISION))
    return TimePrecision.MILLISECOND;
  if (format.includes(TIME_FORMAT_WITH_SECOND_PRECISION)) return TimePrecision.SECOND;
  if (format.includes(TIME_FORMAT)) return TimePrecision.MINUTE;
  return undefined;
};
