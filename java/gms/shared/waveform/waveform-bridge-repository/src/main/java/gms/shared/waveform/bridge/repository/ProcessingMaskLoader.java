package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.time.Instant;
import java.util.List;

/** Interface for getting processing masks from some source. */
public interface ProcessingMaskLoader {

  List<ProcessingMask> loadProcessingMasks(Channel channel, Instant startTime, Instant endTime);
}
