import type { LocationBehavior } from './types';

/**
 * Locate Event Mutation Args
 */
export interface LocateEventMutationArgs {
  eventHypothesisId: string;
  preferredLocationSolutionId: string;
  locationBehaviors: LocationBehavior[];
}
