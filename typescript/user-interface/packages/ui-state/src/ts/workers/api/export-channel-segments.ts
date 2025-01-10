import type { FilterDefinitionAssociationsObject } from '../../types';
import { WorkerOperations } from '../waveform-worker/operations';
import { waveformWorkerRpc } from '../worker-rpcs';

/**
 * The Worker API for exporting UIChannelSegments as COI ChannelSegments
 *
 * @param filterDefinitionAssociationsObject the request config
 *
 * @returns Promise of Blob containing converted COI format data
 */
export const exportChannelSegmentsWithFilterAssociations = async (
  filterDefinitionAssociationsObject: FilterDefinitionAssociationsObject
): Promise<Blob> =>
  waveformWorkerRpc.rpc(
    WorkerOperations.EXPORT_CHANNEL_SEGMENTS,
    filterDefinitionAssociationsObject
  );
