package gms.shared.signaldetection.util;

import static com.google.common.base.Preconditions.checkNotNull;

/**
 * Helper Record containing method results and whether all results were gathered successfully or
 * only part of the results resolved.
 */
public record BatchResults<T>(T results, boolean isPartial) {
  public BatchResults {
    checkNotNull(results);
  }
}
