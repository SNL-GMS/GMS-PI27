import { Timer } from '@gms/common-util';
import { UILogger } from '@gms/ui-util';
import { RpcProvider } from 'worker-rpc';

import { clearWaveforms } from './operations/clear-waveforms';
import { exportChannelSegmentsWithFilterAssociations } from './operations/export-channel-segments';
import { exportWaveformStore } from './operations/export-waveform-store';
import { fetchChannelSegmentsByChannel } from './operations/fetch-channel-segments-by-channel';
import { fetchChannelsByNamesTimeRange } from './operations/fetch-channels-by-names-timerange';
import { fetchEventBeamsByEventHypothesisAndStations } from './operations/fetch-event-beams-by-event-hypothesis-and-stations';
import { fetchEventsAndDetectionsWithSegments } from './operations/fetch-events-detections-segments-by-time';
import { fetchFilterDefinitionsForSignalDetections } from './operations/fetch-filter-definitions-for-signal-detections';
import { fetchSignalDetectionsWithSegments } from './operations/fetch-signal-detections-segments-by-stations-time';
import { getBoundaries } from './operations/get-boundaries';
import { getWaveform } from './operations/get-waveform';
import { importWaveformStore } from './operations/import-waveform-store';
import { WorkerOperations } from './operations/operations';
import { maskAndBeamWaveformsWorker } from './operations/ui-beam-processor';
import {
  designFilter,
  filterChannelSegment,
  filterChannelSegments
} from './operations/ui-filter-processor';
import {
  computeFkSpectraWorker,
  computeLegacyFkSpectra,
  getPeakFkAttributesWorker
} from './operations/ui-fk-processor';
import { maskAndRotate2d } from './operations/ui-rotation-processor';

const logger = UILogger.create('GMS_LOG_RPC_PROVIDER', process.env.GMS_LOG_RPC_PROVIDER);

/**
 * Set this to true to use transfer objects (this will cause the worker to lose access to that data).
 * Not yet supported.
 */
const SHOULD_USE_TRANSFER = true;

/**
 * Handle the message passed to the worker. Dispatch the requested operation.
 */
// eslint-disable-next-line no-restricted-globals
(self as unknown as SharedWorkerGlobalScope).onconnect = connectEvent => {
  const port = connectEvent.ports[0];

  /**
   * Create the rpcProvider and tell it how to send messages.
   * TODO: remove RpcProvider as it is no longer needed for worker compatibility with webpack
   * TODO: will need to re-write registration functions
   */
  const rpcProvider = new RpcProvider((message, transfer) => {
    Timer.end('[Waveform worker]', 1000);

    if (SHOULD_USE_TRANSFER && ArrayBuffer.isView(message.payload)) {
      // We can only use transferObjects for ArrayBuffers and their Views (such as Float32Array)
      port.postMessage(message, [message.payload.buffer]);
    } else {
      // Copy message data via structured cloning
      port.postMessage(message, transfer as unknown as any);
    }
  });

  /**
   * The error event is dispatched if there is either a local or remote communication error (timeout, invalid id, etc.)
   * This will also catch if you forgot to register the worker operation :)
   */
  rpcProvider.error.addHandler(err => {
    logger.error(err.message);
  });

  /** RPC Handler Registration */
  rpcProvider.registerRpcHandler(WorkerOperations.COMPUTE_FK_SPECTRA, computeFkSpectraWorker);
  rpcProvider.registerRpcHandler(
    WorkerOperations.COMPUTE_LEGACY_FK_SPECTRA,
    computeLegacyFkSpectra
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_SIGNAL_DETECTIONS_WITH_SEGMENTS_BY_STATIONS_TIME,
    fetchSignalDetectionsWithSegments
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_CHANNEL_SEGMENTS_BY_CHANNEL,
    fetchChannelSegmentsByChannel
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_EVENT_BEAMS_BY_EVENT_HYPOTHESIS_AND_STATIONS,
    fetchEventBeamsByEventHypothesisAndStations
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_EVENTS_WITH_DETECTIONS_AND_SEGMENTS_BY_TIME,
    fetchEventsAndDetectionsWithSegments
  );
  rpcProvider.registerRpcHandler(WorkerOperations.GET_WAVEFORM, getWaveform);
  rpcProvider.registerRpcHandler(WorkerOperations.GET_BOUNDARIES, getBoundaries);
  rpcProvider.registerRpcHandler(
    WorkerOperations.GET_PEAK_FK_ATTRIBUTES,
    getPeakFkAttributesWorker
  );
  rpcProvider.registerRpcHandler(WorkerOperations.CLEAR_WAVEFORMS, clearWaveforms);
  rpcProvider.registerRpcHandler(WorkerOperations.FILTER_CHANNEL_SEGMENTS, filterChannelSegments);
  rpcProvider.registerRpcHandler(WorkerOperations.FILTER_CHANNEL_SEGMENT, filterChannelSegment);
  rpcProvider.registerRpcHandler(WorkerOperations.DESIGN_FILTER, designFilter);
  rpcProvider.registerRpcHandler(
    WorkerOperations.MASK_AND_BEAM_WAVEFORMS,
    maskAndBeamWaveformsWorker
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.EXPORT_CHANNEL_SEGMENTS,
    exportChannelSegmentsWithFilterAssociations
  );
  rpcProvider.registerRpcHandler(WorkerOperations.EXPORT_WAVEFORM_STORE, exportWaveformStore);
  rpcProvider.registerRpcHandler(WorkerOperations.IMPORT_WAVEFORM_STORE, importWaveformStore);
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_CHANNELS_BY_NAMES_TIME_RANGE,
    fetchChannelsByNamesTimeRange
  );
  rpcProvider.registerRpcHandler(
    WorkerOperations.FETCH_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS,
    fetchFilterDefinitionsForSignalDetections
  );

  rpcProvider.registerRpcHandler(WorkerOperations.MASK_AND_ROTATE_2D, maskAndRotate2d);

  /**
   * Handle the message passed to the worker. Dispatch the requested operation.
   */
  port.onmessage = messageEvent => {
    Timer.start('[Waveform worker]');
    rpcProvider.dispatch(messageEvent.data);
  };
};
