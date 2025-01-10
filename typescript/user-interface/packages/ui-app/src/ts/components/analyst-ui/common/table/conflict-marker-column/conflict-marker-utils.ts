import type { EventRow } from '~analyst-ui/components/events/types';

/** Type guard for {@link EventRow} */
export const isEventRow = (object: unknown): object is EventRow => {
  return (object as EventRow).eventFilterOptions !== undefined;
};
