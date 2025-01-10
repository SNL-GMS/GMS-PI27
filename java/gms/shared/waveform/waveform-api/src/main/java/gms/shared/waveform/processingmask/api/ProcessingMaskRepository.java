package gms.shared.waveform.processingmask.api;

import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.util.Collection;
import java.util.UUID;

/** Interface defining Processing Mask Repository operations */
public interface ProcessingMaskRepository {

  /**
   * Returns a collection of {@link ProcessingMask} for each {@link UUID} provided in the query
   * parameters.
   *
   * @param idList List of {@link ProcessingMask} {@link UUID}'s
   * @return List of {@link ProcessingMask} objects
   */
  Collection<ProcessingMask> findProcessingMasksByIds(Collection<UUID> idList);
}
